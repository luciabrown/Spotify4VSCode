package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func nowPlayingHandler(w http.ResponseWriter, r *http.Request) {
	client, err := getClient()
	if err != nil {
		http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	resp, err := client.Get("https://api.spotify.com/v1/me/player/currently-playing")
	if err != nil {
		http.Error(w, "Failed to get now playing: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 204 {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "Nothing is playing"}`))
		return
	} else if resp.StatusCode != 200 {
		http.Error(w, "Spotify API error: "+resp.Status, resp.StatusCode)
		return
	}

	var raw struct {
		IsPlaying bool `json:"is_playing"`
		Item      struct {
			Name  string `json:"name"`
			Album struct {
				Name   string `json:"name"`
				Images []struct {
					URL string `json:"url"`
				} `json:"images"`
			} `json:"album"`
			Artists []struct {
				Name string `json:"name"`
			} `json:"artists"`
			ExternalURLs struct {
				Spotify string `json:"spotify"`
			} `json:"external_urls"`
		} `json:"item"`
	}

	err = json.NewDecoder(resp.Body).Decode(&raw)
	if err != nil {
		http.Error(w, "Failed to decode response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Extract info
	artists := ""
	for i, artist := range raw.Item.Artists {
		if i > 0 {
			artists += ", "
		}
		artists += artist.Name
	}

	albumArt := ""
	if len(raw.Item.Album.Images) > 0 {
		albumArt = raw.Item.Album.Images[0].URL
	}

	// Create simplified response
	simplified := map[string]interface{}{
		"status": func() string {
			if raw.IsPlaying {
				return "Playing"
			} else {
				return "Paused"
			}
		}(),
		"song":          raw.Item.Name,
		"artists":       artists,
		"album":         raw.Item.Album.Name,
		"album_art_url": albumArt,
		"spotify_url":   raw.Item.ExternalURLs.Spotify,
		"description":   fmt.Sprintf("🎵 Now playing: '%s' by %s", raw.Item.Name, artists),
	}

	// Pretty-print JSON output
	w.Header().Set("Content-Type", "application/json")
	prettyJSON, err := json.MarshalIndent(simplified, "", "  ")
	if err != nil {
		http.Error(w, "Failed to format JSON: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write(prettyJSON)
}
