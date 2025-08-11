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
	vscode.window.showInformationMessage('Spotify extension is activated!');
  	console.log('Spotify extension is activated!');

	const disposable = vscode.commands.registerCommand('luciabrown.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from SpotifyNowListening!');
	});
	context.subscriptions.push(disposable);

	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	statusBarItem.text = '$(sync~spin) Fetching Spotify...';
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

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