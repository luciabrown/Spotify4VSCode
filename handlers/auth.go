package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"golang.org/x/oauth2"
)

var (
	oauthConfig *oauth2.Config
	stateString = "randomstatestring"
	tokenFile   = "token.json"
)

func SetOAuthConfig(clientID, clientSecret, redirectURI string) {
	oauthConfig = &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURI,
		Scopes:       []string{"user-read-playback-state"},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.spotify.com/authorize",
			TokenURL: "https://accounts.spotify.com/api/token",
		},
	}
}

// If token not saved, print URL
func startAuthFlow() {
	if _, err := loadToken(); err == nil {
		log.Println("Token found, skipping authentication")
		return
	}
	url := oauthConfig.AuthCodeURL(stateString, oauth2.AccessTypeOffline)
	fmt.Println("Open this URL in your browser")
	fmt.Println(url)
}

// HTTP handler
func handleCallback(w http.ResponseWriter, r *http.Request) {
	if r.FormValue("state") != stateString {
		http.Error(w, "State mismatch", http.StatusBadRequest)
		return
	}
	code := r.FormValue("code")
	token, err := oauthConfig.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, "Failed to exchange token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	err = saveToken(token)
	if err != nil {
		http.Error(w, "Failed to save token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "Authentication successful.")
	log.Println("Authentication complete, token saved.")
}

func getClient() (*http.Client, error) {
	token, err := loadToken()
	if err != nil {
		return nil, fmt.Errorf("failed to load token: %w", err)
	}

	tokenSource := oauthConfig.TokenSource(context.Background(), token)
	newToken, err := tokenSource.Token()
	if err != nil {
		return nil, fmt.Errorf("failed to get token: %w", err)
	}

	// Save refreshed token if changed
	if newToken.AccessToken != token.AccessToken {
		saveToken(newToken)
	}
	return oauth2.NewClient(context.Background(), tokenSource), nil
}
