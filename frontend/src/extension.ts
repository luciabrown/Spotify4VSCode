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

	const disposable = vscode.commands.registerCommand('frontend.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from SpotifyNowListening!');
	});
	context.subscriptions.push(disposable);

    // Play command
    const playCmd = vscode.commands.registerCommand('frontend.spotifyPlayPause', async () => {
        try {
            const res = await fetch('http://127.0.0.1:12345/playpause', { method: 'PUT' });
            const text = await res.text();
            vscode.window.showInformationMessage(`Play: ${text}`);
        } catch (err) {
            vscode.window.showErrorMessage(`Play error: ${err}`);
        }
    });
    context.subscriptions.push(playCmd);
    
    // Prev command
    const prevCmd = vscode.commands.registerCommand('frontend.spotifyPrev', async () => {
        try {
            const res = await fetch('http://127.0.0.1:12345/prev', { method: 'POST' });
            const text = await res.text();
            vscode.window.showInformationMessage(`Prev: ${text}`);
            updateSpotifyStatus();
        } catch (err) {
            vscode.window.showErrorMessage(`Prev error: ${err}`);
        }
    });
    context.subscriptions.push(prevCmd);

    // Next command
    const nextCmd = vscode.commands.registerCommand('frontend.spotifyNext', async () => {
        try {
            const res = await fetch('http://127.0.0.1:12345/next', { method: 'POST' });
            const text = await res.text();
            vscode.window.showInformationMessage(`Next: ${text}`);
            updateSpotifyStatus();
        } catch (err) {
            vscode.window.showErrorMessage(`Next error: ${err}`);
            updateSpotifyStatus();
        }
    });
    context.subscriptions.push(nextCmd);

    // Status Bar: Song
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(sync~spin) Fetching Spotify...';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Status Bar: Play/Pause Button
    const playButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    playButton.text = '$(play-circle)';
    playButton.tooltip = 'PlayPause Spotify';
    playButton.command = 'frontend.spotifyPlayPause';
    playButton.show();
    context.subscriptions.push(playButton);

    // Status Bar: Prev Button
    const prevButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
    prevButton.text = '$(debug-reverse-continue)';
    prevButton.tooltip = 'Previous Spotify';
    prevButton.command = 'frontend.spotifyPrev';
    prevButton.show();
    context.subscriptions.push(prevButton);

    // Status Bar: Next Button
    const nextButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
    nextButton.text =  '$(debug-continue)';
    nextButton.tooltip = 'Next Spotify';
    nextButton.command = 'frontend.spotifyNext';
    nextButton.show();
    context.subscriptions.push(nextButton);

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
