/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(__webpack_require__(1));
const cp = __importStar(__webpack_require__(2));
const path = __importStar(__webpack_require__(3));
function activate(context) {
    const platform = process.platform;
    const arch = process.arch;
    const baseName = platform === 'win32'
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
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    const disposable = vscode.commands.registerCommand('Spotify4VSCode.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from SpotifyNowListening!');
    });
    context.subscriptions.push(new vscode.Disposable(() => {
        try {
            backend.kill();
        }
        catch { }
    }));
    // Play command
    const playCmd = vscode.commands.registerCommand('Spotify4VSCode.spotifyPlayPause', async () => {
        try {
            const res = await fetch('http://127.0.0.1:12345/playpause', { method: 'PUT' });
            const text = await res.text();
            vscode.window.showInformationMessage(`Play: ${text}`);
        }
        catch (err) {
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
        }
        catch (err) {
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
        }
        catch (err) {
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
    nextButton.text = '$(debug-continue)';
    nextButton.tooltip = 'Next Spotify';
    nextButton.command = 'Spotify4VSCode.spotifyNext';
    nextButton.show();
    context.subscriptions.push(nextButton);
    let pollInterval;
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
            const data = (await res.json());
            console.log('Spotify fetch data:', data);
            if (data.status === 'Paused') {
                statusBarItem.text = '$(debug-pause) Not playing';
            }
            else if (data.song) {
                statusBarItem.text = `$(play) ${data.song} — ${data.artists}`;
            }
            else {
                statusBarItem.text = '$(question) No song data';
            }
        }
        catch (error) {
            statusBarItem.text = '$(error) Failed to fetch Spotify';
        }
    }
    updateSpotifyStatus();
    startPolling();
}
function deactivate() { }


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("path");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map