package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// Fallback track
const fallbackTrackURI = "spotify:track:4cOdK2wGLETKBW3PvgPWqT"

func TogglePlayHandler(w http.ResponseWriter, r *http.Request) {
	client, err := getClient()
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	// Step 1: Get current playback state
	playbackReq, err := http.NewRequest(http.MethodGet, "https://api.spotify.com/v1/me/player", nil)
	if err != nil {
		http.Error(w, "Failed to create playback request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	resp, err := client.Do(playbackReq)
	if err != nil {
		http.Error(w, "Failed to get current playback: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNoContent {
		http.Error(w, "No active playback found.", http.StatusNotFound)
		return
	}
	if resp.StatusCode != http.StatusOK {
		http.Error(w, "Failed to get playback state: "+resp.Status, resp.StatusCode)
		return
	}

	var playbackState struct {
		Device struct {
			ID string `json:"id"`
		} `json:"device"`
		IsPlaying  bool `json:"is_playing"`
		ProgressMs int  `json:"progress_ms"`
		Item       struct {
			URI      string `json:"uri"`
			Duration int    `json:"duration_ms"`
		} `json:"item"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&playbackState); err != nil {
		http.Error(w, "Failed to parse playback state: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if playbackState.Device.ID == "" {
		http.Error(w, "No active device found. Please open Spotify on a device and try again.", http.StatusBadRequest)
		return
	}

	// Step 2: Toggle based on current state
	if playbackState.IsPlaying {
		// Pause
		req, err := http.NewRequest(http.MethodPut, "https://api.spotify.com/v1/me/player/pause", nil)
		if err != nil {
			http.Error(w, "Failed to create pause request: "+err.Error(), http.StatusInternalServerError)
			return
		}
		resp, err := client.Do(req)
		if err != nil {
			http.Error(w, "Failed to pause playback: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusNoContent {
			fmt.Fprintln(w, "Playback paused.")
		} else {
			http.Error(w, "Pause error: "+resp.Status, resp.StatusCode)
		}
	} else {
		// Play
		trackToPlay := playbackState.Item.URI
		if trackToPlay == "" {
			trackToPlay = fallbackTrackURI
		}

		pos := playbackState.ProgressMs
		if pos >= playbackState.Item.Duration {
			pos = 0
		}

		body := map[string]interface{}{
			"uris":        []string{trackToPlay},
			"position_ms": pos,
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
			fmt.Fprintln(w, "Playback started/resumed.")
		} else {
			bodyBytes, _ := io.ReadAll(playResp.Body)
			http.Error(w, "Playback error: "+string(bodyBytes), playResp.StatusCode)
		}
	}
}
