package handlers

import (
	"fmt"
	"io"
	"net/http"
)

func NextTrackHandler(w http.ResponseWriter, r *http.Request) {
	client, err := getClient()
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	req, err := http.NewRequest(http.MethodPost, "https://api.spotify.com/v1/me/player/next", nil)
	if err != nil {
		http.Error(w, "Failed to create request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Failed to skip to next track: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNoContent {
		fmt.Fprintln(w, "Skipped to next track.")
	} else if resp.StatusCode == http.StatusNotFound {
		http.Error(w, "No active playback found.", http.StatusNotFound)
	} else {
		bodyBytes, _ := io.ReadAll(resp.Body)
		http.Error(w, "Error skipping track: "+string(bodyBytes), resp.StatusCode)
	}
}

func PreviousTrackHandler(w http.ResponseWriter, r *http.Request) {
	client, err := getClient()
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	req, err := http.NewRequest(http.MethodPost, "https://api.spotify.com/v1/me/player/previous", nil)
	if err != nil {
		http.Error(w, "Failed to create request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Failed to skip to previous track: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNoContent {
		fmt.Fprintln(w, "Skipped to previous track.")
	} else if resp.StatusCode == http.StatusNotFound {
		http.Error(w, "No active playback found.", http.StatusNotFound)
	} else {
		bodyBytes, _ := io.ReadAll(resp.Body)
		http.Error(w, "Error skipping track: "+string(bodyBytes), resp.StatusCode)
	}
}
