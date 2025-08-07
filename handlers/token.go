package handlers

import (
	"encoding/json"
	"os"

	"golang.org/x/oauth2"
)

func saveToken(token *oauth2.Token) error {
	f, err := os.Create(tokenFile)
	if err != nil {
		return err
	}
	defer f.Close()

	return json.NewEncoder(f).Encode(token)
}

func loadToken() (*oauth2.Token, error) {
	f, err := os.Open(tokenFile)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var token oauth2.Token
	err = json.NewDecoder(f).Decode(&token)
	return &token, err
}
