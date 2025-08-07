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

	// Play last known track or fallback
	trackToPlay := lastKnownTrackURI
	if trackToPlay == "" {
		trackToPlay = fallbackTrackURI
	}

	body := map[string]interface{}{
		"uris": []string{trackToPlay},
	}
	jsonBody, _ := json.Marshal(body)

	req, err := http.NewRequest(http.MethodPut, "https://api.spotify.com/v1/me/player/play", bytes.NewReader(jsonBody))
	if err != nil {
		http.Error(w, "Failed to create request: "+err.Error(), http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Failed to play track: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNoContent {
		fmt.Fprintln(w, "Playback started.")
	} else {
		http.Error(w, "Status: "+resp.Status, resp.StatusCode)
	}
}
