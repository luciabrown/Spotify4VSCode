import * as vscode from 'vscode';

interface SpotifyNowPlaying {
  status: 'Playing' | 'Paused';
  song?: string;
  artists?: string;
  album?: string;
  album_art_url?: string;
  spotify_url?: string;
  description?: string;
}

export function activate(context: vscode.ExtensionContext) {
	//vscode.window.showInformationMessage('Spotify extension is activated!');
  	//console.log('Spotify extension is activated!');

	const disposable = vscode.commands.registerCommand('frontend.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from SpotifyNowListening!');
	});
	context.subscriptions.push(disposable);

	// Pause command
    const pauseCmd = vscode.commands.registerCommand('frontend.spotifyPause', async () => {
        try {
            const res = await fetch('http://127.0.0.1:12345/pause', { method: 'PUT' });
            const text = await res.text();
            vscode.window.showInformationMessage(`Pause: ${text}`);
        } catch (err) {
            vscode.window.showErrorMessage(`Pause error: ${err}`);
        }
    });
    context.subscriptions.push(pauseCmd);

    // Play command
    const playCmd = vscode.commands.registerCommand('frontend.spotifyPlay', async () => {
        try {
            const res = await fetch('http://127.0.0.1:12345/play', { method: 'PUT' });
            const text = await res.text();
            vscode.window.showInformationMessage(`Play: ${text}`);
        } catch (err) {
            vscode.window.showErrorMessage(`Play error: ${err}`);
        }
    });
    context.subscriptions.push(playCmd);

    // Status Bar: Song
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(sync~spin) Fetching Spotify...';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Status Bar: Play Button
    const playButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    playButton.text = '$(play)';
    playButton.tooltip = 'Play Spotify';
    playButton.command = 'frontend.spotifyPlay';
    playButton.show();
    context.subscriptions.push(playButton);

    // Status Bar: Pause Button
    const pauseButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
    pauseButton.text = '$(debug-pause)';
    pauseButton.tooltip = 'Pause Spotify';
    pauseButton.command = 'frontend.spotifyPause';
    pauseButton.show();
    context.subscriptions.push(pauseButton);

	// Poll spotify
	async function updateSpotifyStatus() {
		try {
			const res = await fetch('http://127.0.0.1:12345/nowplaying');
			if (!res.ok) {
				statusBarItem.text = '$(error) Spotify fetch error';
				return;
			}
			const data = (await res.json()) as SpotifyNowPlaying;
			console.log('Spotify fetch data:', data);

			if (data.status === 'Paused') {
			statusBarItem.text = '$(debug-pause) Not playing';
			} else if (data.song) {
			statusBarItem.text = `$(play) ${data.song} — ${data.artists}`;
			} else {
			statusBarItem.text = '$(question) No song data';
			}
		} catch (error) {
			statusBarItem.text = '$(error) Failed to fetch Spotify';
		}
	}

	updateSpotifyStatus();
	setInterval(updateSpotifyStatus, 15000);
}
export function deactivate() {}