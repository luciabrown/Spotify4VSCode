package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"vscode/backend/cache"
)

type Artist struct {
	Name string `json:"name"`
}

type AlbumImage struct {
	URL string `json:"url"`
}

type Album struct {
	Name   string       `json:"name"`
	Images []AlbumImage `json:"images"`
}

type ExternalURLs struct {
	Spotify string `json:"spotify"`
}

type Item struct {
	Name         string       `json:"name"`
	Artists      []Artist     `json:"artists"`
	Album        Album        `json:"album"`
	URI          string       `json:"uri"`
	ExternalURLs ExternalURLs `json:"external_urls"`
}

type NowPlaying struct {
	IsPlaying bool `json:"is_playing"`
	Item      Item `json:"item"`
}

var lastKnownTrackURI string // ID of last known track in the session

func NowPlayingHandler(w http.ResponseWriter, r *http.Request) {

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
		// No song playing
		empty := map[string]interface{}{
			"playing": false,
		}
		emptyJSON, _ := json.MarshalIndent(empty, "", "  ")
		cache.SaveImageURL("")
		cache.SaveJSON(emptyJSON)
		w.Header().Set("Content-Type", "application/json")
		w.Write(emptyJSON)
		return
	} else if resp.StatusCode != 200 {
		http.Error(w, "Spotify API error: "+resp.Status, resp.StatusCode)
		return
	}

	var raw NowPlaying
	err = json.NewDecoder(resp.Body).Decode(&raw)
	if err != nil {
		http.Error(w, "Failed to parse JSON: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Make note of last track played, if it exists
	lastKnownTrackURI = raw.Item.URI
	// Join artist names
	artists := ""
	for i, artist := range raw.Item.Artists {
		if i > 0 {
			artists += ", "
		}
		artists += artist.Name
	}

	// Get cover art URL (largest image)
	albumArt := ""
	if len(raw.Item.Album.Images) > 0 {
		albumArt = raw.Item.Album.Images[0].URL
	}

	// Build simplified response
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

	prettyJSON, err := json.MarshalIndent(simplified, "", "  ")
	if err != nil {
		http.Error(w, "Failed to marshal JSON: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Cache the cover art URL and simplified JSON
	cache.SaveImageURL(albumArt)
	cache.SaveJSON(prettyJSON)

	w.Header().Set("Content-Type", "application/json")
	w.Write(prettyJSON)
}
