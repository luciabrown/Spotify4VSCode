# This is a work in progress extension for VSCode to display/control Spotify.

Currently only display works in the Visual Studio Code environment.
This project is in development!
More functionality is working in the localhost backend which is yet to be integrated into the frontend/extension.

This is a localhost application, not currently containerised or deployed.
This requires an API key from Spotify's Developer Tools (https://developer.spotify.com/).

I am working on a dependencies file to streamline this process but the prerequisites are as follows:
- Go (GoLang) installed
- go get github.com/joho/godotenv
- go get golang.org/x/oauth2
- go get golang.org/x/oauth2/spotify
- npm install node-fetch
- npm install -g yo generator-code
- yo code

## To run the application from terminal
cd backend
go run .
cd ..
cd frontend
npm run compile
code .
### at this point you should be redirected to the VSCode development environment (a new VSCode window containing only the frontend/extension piece of the project)
Click F5 _or_ navigate to the Extensions pane of VSCode and click "Debug Extension"/the green play button.
This will open _another_ VSCode window (yes, a third VSCode Window, I'm sorry) where the extension should be visible in the bottom right corner of the VSCode taskbar

:)
