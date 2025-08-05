package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

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
		w.Write([]byte(`{"playing": false}`))
		return
	} else if resp.StatusCode != 200 {
		http.Error(w, "Spotify API error: "+resp.Status, resp.StatusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = io.Copy(w, resp.Body)
	if err != nil {
		http.Error(w, "Failed to write response: "+err.Error(), http.StatusInternalServerError)
	}
}
