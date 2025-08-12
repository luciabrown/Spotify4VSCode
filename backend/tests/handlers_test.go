package tests

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"vscode/backend/handlers"

	"golang.org/x/oauth2"
)

// TestNowPlayingHandler checks if NowPlayingHandler responds with status 200
func TestNowPlayingHandler(t *testing.T) {
	req, err := http.NewRequest("GET", "/nowplaying", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(handlers.NowPlayingHandler)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("Expected status code %d, got %d", http.StatusOK, status)
	}

}

func TestHandleCallback_Success(t *testing.T) {
	// Backup original functions
	handlers.SetOAuthConfig(
		"dummy-client-id",
		"dummy-client-secret",
		"http://localhost/callback",
	)
	origLoadToken := handlers.LoadToken
	origSaveToken := handlers.SaveToken
	defer func() {
		handlers.LoadToken = origLoadToken
		handlers.SaveToken = origSaveToken
	}()

	// Mock functions
	handlers.LoadToken = func() (*oauth2.Token, error) {
		return nil, errors.New("mock load token: no token")
	}
	handlers.SaveToken = func(token *oauth2.Token) error {
		return nil // pretend save succeeded
	}

	req := httptest.NewRequest(http.MethodGet, "/callback?state="+handlers.StateString+"&code=dummycode", nil)
	rr := httptest.NewRecorder()

	// Also, you might want to mock oauthConfig.Exchange (this part is tricky without refactor)
	// For now, assume token exchange works or is tested separately.

	handlers.HandleCallback(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, rr.Code)
	}
}
