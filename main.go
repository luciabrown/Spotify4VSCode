package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"vscode/handlers"

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

	handlers.SetOAuthConfig(clientID, clientSecret, redirectURI)
	go handlers.StartAuthFlow()
	go handlers.PollNowPlaying()

	//Success
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "backend running")
	})

	http.HandleFunc("/callback", handlers.HandleCallback)
	http.HandleFunc("/nowplaying", handlers.NowPlayingHandler) // Start the handler to find song
	//http.HandleFunc("/coverart", handlers.CoverArtHandler)     // Get cover art

	// Log notes
	http.HandleFunc("/pause", handlers.PauseHandler)
	http.HandleFunc("/play", handlers.PauseHandler)
	log.Println("Starting server on :12345")
	log.Fatal(http.ListenAndServe(":12345", nil))
}
