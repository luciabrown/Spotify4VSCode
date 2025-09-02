package handlers

import (
	"fmt"
	"net/http"

	"golang.org/x/oauth2"
)

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if oauthConfig == nil {
		http.Error(w, "OAuth config not initialized", http.StatusInternalServerError)
		return
	}
	url := oauthConfig.AuthCodeURL(StateString, oauth2.AccessTypeOffline)
	fmt.Fprintln(w, url)
}
