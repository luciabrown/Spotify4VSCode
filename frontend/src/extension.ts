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

    // Spawn backend
    const backend = cp.spawn(backendPath, [], {
        cwd: path.dirname(backendPath),
        windowsHide: true
    });

    backend.stdout.on('data', d => console.log(`backend: ${d}`));
    backend.stderr.on('data', d => console.error(`backend error: ${d}`));
    backend.on('close', code => console.log(`backend exited: ${code}`));

    // Kill backend on deactivate
    context.subscriptions.push(
        new vscode.Disposable(() => {
            try { backend.kill(); } catch {}
        })
    );

    // Helper to wait for backend to be ready
    async function waitForBackend(url: string, timeout = 5000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            try {
                const res = await fetch(url);
                if (res.ok) return;
            } catch {}
            await new Promise(r => setTimeout(r, 200));
        }
        throw new Error('Backend did not start in time');
    }

    waitForBackend('http://127.0.0.1:12345/nowplaying')
        .then(() => vscode.window.showInformationMessage('Go backend started'))
        .catch(err => vscode.window.showErrorMessage(`Backend failed to start: ${err}`));

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    // Commands
    const helloCmd = vscode.commands.registerCommand('Spotify4VSCode.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from SpotifyNowListening!');
    });
    context.subscriptions.push(helloCmd);

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

    const prevCmd = vscode.commands.registerCommand('Spotify4VSCode.spotifyPrev', async () => {
        try {
            stopPolling();
            const res = await fetch('http://127.0.0.1:12345/prev', { method: 'POST' });
            const text = await res.text();
            vscode.window.showInformationMessage(`Prev: ${text}`);
            await delay(300);
            updateSpotifyStatus();
            startPolling();
        } catch (err) {
            vscode.window.showErrorMessage(`Prev error: ${err}`);
            startPolling();
        }
    });
    context.subscriptions.push(prevCmd);

    const nextCmd = vscode.commands.registerCommand('Spotify4VSCode.spotifyNext', async () => {
        try {
            stopPolling();
            const res = await fetch('http://127.0.0.1:12345/next', { method: 'POST' });
            const text = await res.text();
            vscode.window.showInformationMessage(`Next: ${text}`);
            await delay(400);
            updateSpotifyStatus();
            startPolling();
        } catch (err) {
            updateSpotifyStatus();
            startPolling();
        }
    });
    context.subscriptions.push(nextCmd);

    // Status bar items
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(sync~spin) Fetching Spotify...';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    const playButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    playButton.text = '$(play-circle)';
    playButton.tooltip = 'Play/Pause Spotify';
    playButton.command = 'Spotify4VSCode.spotifyPlayPause';
    playButton.show();
    context.subscriptions.push(playButton);

    const prevButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
    prevButton.text = '$(debug-reverse-continue)';
    prevButton.tooltip = 'Previous Spotify';
    prevButton.command = 'Spotify4VSCode.spotifyPrev';
    prevButton.show();
    context.subscriptions.push(prevButton);

    const nextButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
    nextButton.text = '$(debug-continue)';
    nextButton.tooltip = 'Next Spotify';
    nextButton.command = 'Spotify4VSCode.spotifyNext';
    nextButton.show();
    context.subscriptions.push(nextButton);

    // Polling
    let pollInterval: NodeJS.Timeout | undefined;

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

    async function updateSpotifyStatus() {
        try {
            const res = await fetch('http://127.0.0.1:12345/nowplaying');
            if (!res.ok) {
                statusBarItem.text = '$(error) Spotify fetch error';
                return;
            }
            const data = (await res.json()) as SpotifyNowPlaying;

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