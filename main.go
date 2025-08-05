package main

import (
	"fmt"
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
	// Log notes
	log.Println("Starting server on :12345")
	log.Fatal(http.ListenAndServe(":12345", nil))
}
