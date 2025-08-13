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
function activate(context) {
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
        }
        catch (err) {
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
        }
        catch (err) {
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
        }
        catch (err) {
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
        }
        catch (err) {
            vscode.window.showErrorMessage(`Next error: ${err}`);
        }
    });
    context.subscriptions.push(nextCmd);
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
    // Status Bar: Prev Button
    const prevButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
    prevButton.text = '$(triangle-left)';
    prevButton.tooltip = 'Previous Spotify';
    prevButton.command = 'frontend.spotifyPrev';
    prevButton.show();
    context.subscriptions.push(prevButton);
    // Status Bar: Next Button
    const nextButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 96);
    nextButton.text = '$(triangle-right)';
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
    setInterval(updateSpotifyStatus, 15000);
}
function deactivate() { }


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

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