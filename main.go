package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file
	err := godotenv.Load()

	clientID := os.Getenv("CLIENT_ID")
	clientSecret := os.Getenv("CLIENT_SECRET")
	redirectURI := os.Getenv("REDIRECT_URI")

	if err != nil {
		log.Fatal("Error loading .env file")
	}

	SetOAuthConfig(clientID, clientSecret, redirectURI)
	go startAuthFlow()

	//Success
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "backend running")
	})

	http.HandleFunc("/callback", handleCallback)
	http.HandleFunc("/nowplaying", nowPlayingHandler) // Start the handler

	// Log notes
	log.Println("Starting server on :12345")
	log.Fatal(http.ListenAndServe(":12345", nil))
}
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
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":      "Paused",
			"description": "Nothing is currently playing on Spotify.",
		})
		return
	} else if resp.StatusCode != 200 {
		http.Error(w, "Spotify API error: "+resp.Status, resp.StatusCode)
		return
	}

	var raw struct {
		IsPlaying bool `json:"is_playing"`
		Item      struct {
			Name    string `json:"name"`
			Artists []struct {
				Name string `json:"name"`
			} `json:"artists"`
			Album struct {
				Name   string `json:"name"`
				Images []struct {
					URL string `json:"url"`
				} `json:"images"`
			} `json:"album"`
			ExternalURLs struct {
				Spotify string `json:"spotify"`
			} `json:"external_urls"`
		} `json:"item"`
	}

	err = json.NewDecoder(resp.Body).Decode(&raw)
	if err != nil {
		http.Error(w, "Failed to parse Spotify response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Get artist names as a comma-separated string
	var artistNames []string
	for _, a := range raw.Item.Artists {
		artistNames = append(artistNames, a.Name)
	}
	artists := strings.Join(artistNames, ", ")

	// Get album art (first image)
	albumArt := ""
	if len(raw.Item.Album.Images) > 0 {
		albumArt = raw.Item.Album.Images[0].URL
	}

	// Construct simplified response
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(simplified)
}
