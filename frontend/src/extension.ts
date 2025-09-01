import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

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

    const platform = process.platform;
    const arch = process.arch;

    const baseName =
        platform === 'win32'
            ? `backend-${platform}-${arch}.exe`
            : `backend-${platform}-${arch}`;


    const backendPath = context.asAbsolutePath(path.join('out', 'bin', baseName));
    const backend = cp.spawn(backendPath, [], {
        cwd: path.dirname(backendPath),
        windowsHide: true
    });
    backend.stdout.on('data', d => console.log(`backend: ${d}`));
    backend.stderr.on('data', d => console.error(`backend error: ${d}`));
    backend.on('close', code => console.log(`backend exited: ${code}`));
    vscode.window.showInformationMessage('Go backend started');

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
	const disposable = vscode.commands.registerCommand('Spotify4VSCode.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from SpotifyNowListening!');
	});
	context.subscriptions.push(
        new vscode.Disposable(() => {
            try { backend.kill(); } catch {}
        })
    );

    // Play command
    const playCmd = vscode.commands.registerCommand('Spotify4VSCode.spotifyPlayPause', async () => {
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
    const prevCmd = vscode.commands.registerCommand('Spotify4VSCode.spotifyPrev', async () => {
        try {
            stopPolling();
            const res = await fetch('http://127.0.0.1:12345/prev', { method: 'POST' });
            const text = await res.text();
            vscode.window.showInformationMessage(`Prev: ${text}`);
            await delay(300); // give Spotify time to switch tracks
            updateSpotifyStatus(); //show new track
            startPolling();
        } catch (err) {
            vscode.window.showErrorMessage(`Prev error: ${err}`);
            startPolling();
        }
    });
    context.subscriptions.push(prevCmd);

    // Next command
    const nextCmd = vscode.commands.registerCommand('Spotify4VSCode.spotifyNext', async () => {
        try {
            stopPolling();
            const res = await fetch('http://127.0.0.1:12345/next', { method: 'POST' });
            const text = await res.text();
            vscode.window.showInformationMessage(`Next: ${text}`);
            await delay(400); // give Spotify time to switch tracks
            updateSpotifyStatus();
            startPolling();
        } catch (err) {
            updateSpotifyStatus(); //show new track
            startPolling();
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
    playButton.command = 'Spotify4VSCode.spotifyPlayPause';
    playButton.show();
    context.subscriptions.push(playButton);

    // Status Bar: Prev Button
    const prevButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
    prevButton.text = '$(debug-reverse-continue)';
    prevButton.tooltip = 'Previous Spotify';
    prevButton.command = 'Spotify4VSCode.spotifyPrev';
    prevButton.show();
    context.subscriptions.push(prevButton);

    // Status Bar: Next Button
    const nextButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
    nextButton.text =  '$(debug-continue)';
    nextButton.tooltip = 'Next Spotify';
    nextButton.command = 'Spotify4VSCode.spotifyNext';
    nextButton.show();
    context.subscriptions.push(nextButton);

    let pollInterval: NodeJS.Timeout | undefined;

    // Poll control
    function startPolling() {
        stopPolling();
        pollInterval = setInterval(updateSpotifyStatus, 15000);
    }

    function stopPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = undefined;
        }
    }

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
    startPolling();
    
}

export function deactivate() {}