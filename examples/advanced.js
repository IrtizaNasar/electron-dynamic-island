const { app, BrowserWindow, ipcMain } = require('electron');
const { DynamicIsland } = require('../index');

let mainWindow;
let island;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: { nodeIntegration: true }
    });
    mainWindow.loadURL('data:text/html,<h1>Advanced Example</h1><p>Check the Dynamic Island...</p>');
}

app.whenReady().then(() => {
    createWindow();

    // Initialize Island
    island = new DynamicIsland({
        enableSounds: true,
        sizing: { type: 'fixed' } // Start with fixed mode
    });
    island.init();

    // SCENARIO 1: Sequential Updates (Loading -> Success)
    setTimeout(() => {
        // 1. Show Loading State
        island.show({
            type: 'info',
            message: 'Connecting to Device...',
            icon: 'spin', // Built-in spinner
            animation: 'spin',
            duration: 10000 // Long duration so it doesn't hide before update
        });

        // 2. Update to Success after 2 seconds
        setTimeout(() => {
            island.show({
                type: 'success',
                message: 'Device Connected',
                icon: 'check',
                animation: 'pulse'
            });
        }, 2000);
    }, 2000);

    // SCENARIO 2: Dynamic Sizing with Large Content (after 6 seconds)
    setTimeout(() => {
        island.show({
            type: 'info',
            message: 'Downloading large update package (450MB)...',
            icon: 'bluetooth', // Just as an example
            sizing: {
                type: 'dynamic',
                height: true,
                width: true
            },
            duration: 5000
        });
    }, 6000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
