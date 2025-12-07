const { app, BrowserWindow } = require('electron');
const path = require('path');
const { DynamicIsland } = require('../../index');

let mainWindow;
let island;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.loadURL('data:text/html,<h1>Dynamic Island Example</h1><p>Press Cmd+Q to quit.</p>');
}

app.whenReady().then(() => {
    createWindow();

    // Initialize Island
    island = new DynamicIsland({
        devMode: false, // Show boundary for development
        enableSounds: true
    });
    island.init();

    // Simulate AirPods Connection
    setTimeout(() => {
        console.log('Triggering AirPods Notification...');
        island.show({
            type: 'success',
            message: 'AirPods Connected',
            icon: path.join(__dirname, 'airpods.png'),
            // iconWidth: 100,
            // iconHeight: 70,
            iconSize: 55,
            // sizing: { type: 'dynamic', height: true, width: true },
            duration: 4000
        });
    }, 2000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
