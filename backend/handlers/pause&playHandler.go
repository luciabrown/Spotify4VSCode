package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// Fallback track
const fallbackTrackURI = "spotify:track:4cOdK2wGLETKBW3PvgPWqT"

// PauseHandler pauses the currently playing Spotify track if any.
func PauseHandler(w http.ResponseWriter, r *http.Request) {
	client, err := getClient()
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	req, err := http.NewRequest(http.MethodPut, "https://api.spotify.com/v1/me/player/pause", nil)
	if err != nil {
		http.Error(w, "Failed to create request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Failed to pause playback: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNoContent {
		fmt.Fprintln(w, "Playback paused successfully.")
	} else if resp.StatusCode == http.StatusNotFound {
		http.Error(w, "No active playback found.", http.StatusNotFound)
	} else {
		http.Error(w, "Status: "+resp.Status, resp.StatusCode)
	}
}

// PlayHandlers plays the Spotify track
func PlayHandler(w http.ResponseWriter, r *http.Request) {
	client, err := getClient()
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	// Get current playback state to find where you left off in the song
	playbackReq, err := http.NewRequest(http.MethodGet, "https://api.spotify.com/v1/me/player", nil)
	if err != nil {
		http.Error(w, "Failed to create playback state request: "+err.Error(), http.StatusInternalServerError)
		return
	}
	resp, err := client.Do(playbackReq)
	if err != nil {
		http.Error(w, "Failed to get current playback: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		http.Error(w, "Failed to get playback state, status: "+resp.Status, resp.StatusCode)
		return
	}

	var playbackState struct {
		IsPlaying  bool `json:"is_playing"`
		ProgressMs int  `json:"progress_ms"`
		Item       struct {
			URI string `json:"uri"`
		} `json:"item"`
	}

	err = json.NewDecoder(resp.Body).Decode(&playbackState)
	if err != nil {
		http.Error(w, "Failed to parse playback state: "+err.Error(), http.StatusInternalServerError)
		return
	}

	trackToPlay := playbackState.Item.URI
	if trackToPlay == "" {
		// fallback if no current track
		trackToPlay = fallbackTrackURI
	}

	body := map[string]interface{}{
		"uris":        []string{trackToPlay},
		"position_ms": playbackState.ProgressMs,
	}
	jsonBody, _ := json.Marshal(body)

	playReq, err := http.NewRequest(http.MethodPut, "https://api.spotify.com/v1/me/player/play", bytes.NewReader(jsonBody))
	if err != nil {
		http.Error(w, "Failed to create play request: "+err.Error(), http.StatusInternalServerError)
		return
	}
	playReq.Header.Set("Content-Type", "application/json")

	playResp, err := client.Do(playReq)
	if err != nil {
		http.Error(w, "Failed to play track: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer playResp.Body.Close()

	if playResp.StatusCode == http.StatusNoContent {
		fmt.Fprintln(w, "Playback resumed.")
	} else {
		http.Error(w, "Status: "+playResp.Status, playResp.StatusCode)
	}
}
