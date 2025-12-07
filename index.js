const { BrowserWindow, screen, app, ipcMain } = require('electron');
const path = require('path');
const { execSync } = require('child_process');

class DynamicIsland {
    constructor(options = {}) {
        this.options = {
            icon: options.icon || null,
            sounds: options.sounds || {}, // Custom sound paths: { success: 'path', error: 'path' }
            enableSounds: options.enableSounds !== false, // Default true
            devMode: options.devMode || false, // Shows boundary for debugging
            debug: options.debug || false,
            sizing: options.sizing || { type: 'fixed', height: false, width: false } // Default to Fixed
        };

        this.window = null;
        this.hideTimeout = null;
        this.debounceTimer = null;
        this.reposition = this.reposition.bind(this);
    }

    /**
     * Checks if the current Mac has a physical notch.
     * Returns true for MacBookPro18,x (M1 Pro/Max), MacBookAir11,x (M2 Air) and later.
     */
    hasNotch() {
        if (process.platform !== 'darwin') return false;

        try {
            const model = execSync('sysctl -n hw.model').toString().trim();
            // Simple regex for models known to have notches
            if (/^MacBookPro(1[8-9]|[2-9]\d),/.test(model)) return true; // MacBookPro18,x and later
            if (/^MacBookAir(1[1-9]|[2-9]\d),/.test(model)) return true; // MacBookAir11,x and later
            return false;
        } catch (e) {
            if (this.options.debug) console.error('Failed to check Mac model:', e);
            return false;
        }
    }

    /**
     * Initializes the Dynamic Island.
     * Should be called after app 'ready' event.
     */
    init() {
        if (!this.hasNotch()) {
            if (this.options.debug) console.log('[DynamicIsland] Hardware not compatible (No notch or not macOS).');
            return;
        }

        // Wait a bit to ensure app icon is established if called immediately
        setTimeout(() => {
            this.createWindow();
        }, 1000);

        // Handle display changes
        screen.on('display-metrics-changed', this.reposition);
        screen.on('display-added', this.reposition);
        screen.on('display-removed', this.reposition);
    }

    createWindow() {
        if (this.window && !this.window.isDestroyed()) return;

        if (process.platform === 'darwin') {
            app.dock.show();
        }

        this.window = new BrowserWindow({
            width: 160,
            height: 50,
            x: 0,
            y: -1000, // Start OFF-SCREEN
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            resizable: false,
            hasShadow: false,
            show: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
            backgroundColor: '#00000000',
            type: 'panel',
            focusable: false,
            skipTaskbar: true,
            hiddenInMissionControl: true,
            fullscreenable: false,
            enableLargerThanScreen: true,
            title: ''
        });

        this.window.setIgnoreMouseEvents(true, { forward: true });
        this.window.loadFile(path.join(__dirname, 'lib/assets/notch.html'));

        this.window.once('ready-to-show', () => {
            if (process.platform === 'darwin') {
                app.dock.show();
                app.setActivationPolicy('regular');
            }

            this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
            this.window.setAlwaysOnTop(true, 'screen-saver', 1);

            if (typeof this.window.setExcludedFromWindowsMenu === 'function') {
                this.window.setExcludedFromWindowsMenu(true);
            }

            this.reposition();
            this.window.showInactive();
        });

        // Handle dynamic window resizing from renderer
        ipcMain.on('resize-window', (event, { height }) => {
            if (this.window && !this.window.isDestroyed()) {
                const windowWidth = 600; // Keep width consistent
                const windowHeight = Math.max(200, height + 20); // Add buffer for safety

                // Store for the reposition loop
                this.currentWindowHeight = windowHeight;

                // Only resize if needed
                if (windowHeight !== this.window.getSize()[1]) {
                    this.window.setSize(windowWidth, windowHeight);
                }
            }
        });
    }

    getInternalDisplay() {
        const displays = screen.getAllDisplays();
        const internal = displays.find(d => d.internal === true);
        if (internal) return internal;

        const builtIn = displays.find(d => {
            const label = (d.label || '').toLowerCase();
            return label.includes('built-in') ||
                label.includes('color lcd') ||
                label.includes('liquid retina');
        });
        return builtIn || null;
    }

    reposition() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            try {
                if (!this.window || this.window.isDestroyed()) return;

                const targetDisplay = this.getInternalDisplay();

                if (!targetDisplay) {
                    if (this.window.isVisible()) {
                        this.window.hide();
                    }
                    return;
                }

                const { x, y, width } = targetDisplay.bounds;

                // If hidden, keep off-screen
                if (!this.window.isVisible()) {
                    this.window.setPosition(x, -10000);
                    this.window.setSize(1, 1);
                    return;
                }

                const windowWidth = 600;
                // Use the current dynamic height instead of hardcoded 200
                const windowHeight = this.currentWindowHeight || 200;
                const newX = x + Math.round((width - windowWidth) / 2);
                const newY = y;

                this.window.setPosition(newX, newY);
                // Only set size if it changed to avoid jitter
                if (this.window.getSize()[1] !== windowHeight) {
                    this.window.setSize(windowWidth, windowHeight);
                }
                this.window.setIgnoreMouseEvents(true, { forward: true });
            } catch (error) {
                if (this.options.debug) console.error('[DynamicIsland] Error repositioning:', error);
            }
        }, 500);
    }

    /**
     * Triggers a notification.
     * @param {Object} options
     * @param {string} options.type - 'success', 'error', 'info', 'warning'
     * @param {string} options.message - The text to display
     * @param {string} options.icon - Optional SVG string or 'bluetooth' preset
     */
    show({
        type = 'success',
        message,
        icon,
        iconSize,
        iconWidth,
        iconHeight,
        iconGap,
        sizing: sizingOption,
        duration = 4500, // Default 4.5s
        fontFamily,
        fontSize,
        color,
        animation,
        glow,
        devMode
    }) {
        const validTypes = ['success', 'error', 'info', 'warning'];
        if (!validTypes.includes(type)) {
            console.error(`[DynamicIsland] Invalid notification type: ${type}`);
            return;
        }
        if (typeof message !== 'string') {
            console.error('[DynamicIsland] Message must be a string');
            return;
        }

        if (!this.window || this.window.isDestroyed()) return;

        // Resolve options (Method args > Constructor args)
        const finalIconSize = iconSize || this.options.iconSize;
        const finalIconWidth = iconWidth || this.options.iconWidth;
        const finalIconHeight = iconHeight || this.options.iconHeight;
        const finalIconGap = iconGap || this.options.iconGap;

        // Resolve Sizing Mode
        // sizing: { type: 'fixed' | 'dynamic', height: boolean, width: boolean }
        // Merge constructor defaults with method arguments
        const sizing = { ...this.options.sizing, ...sizingOption };

        const targetDisplay = this.getInternalDisplay();
        if (!targetDisplay) return;

        // Move to position
        try {
            const { x, y, width } = targetDisplay.bounds;
            const expandedWidth = 600;

            // ========================================
            // WINDOW POSITIONING
            // ========================================

            // Auto-detect notch height if not provided in options
            if (sizing.notchHeight === undefined) {
                const topOffset = targetDisplay.workArea.y - targetDisplay.bounds.y;
                // Default to 40 if no top offset detected (e.g. external display)
                sizing.notchHeight = topOffset > 0 ? topOffset : 40;
            }

            // Initial Window Size
            // We start with a safe height. The renderer will calculate the exact
            // required height based on content and request a resize via IPC.
            const initialHeight = 300;


            const newX = x + Math.round((width - expandedWidth) / 2);

            this.window.setBounds({
                x: newX,
                y: y,
                width: expandedWidth,
                height: initialHeight
            });

            // Reset current height tracker
            this.currentWindowHeight = initialHeight;

            if (process.platform === 'darwin') app.dock.show();

            this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
            this.window.setAlwaysOnTop(true, 'pop-up-menu');
            this.window.showInactive();
            this.window.setIgnoreMouseEvents(true, { forward: true });
        } catch (e) {
            if (this.options.debug) console.error('[DynamicIsland] Error showing:', e);
        }

        // Send data to renderer
        this.triggerNotification({
            type,
            message,
            icon: icon || this.options.icon,
            soundEnabled: this.options.enableSounds,
            soundFile: this.options.sounds[type] || null,
            devMode: devMode !== undefined ? devMode : this.options.devMode,
            iconSize: finalIconSize,
            iconWidth: finalIconWidth,
            iconHeight: finalIconHeight,
            iconGap: finalIconGap,
            sizing: sizing,
            duration,
            fontFamily,
            fontSize,
            color,
            animation,
            glow
        });

        // Schedule hide
        if (this.hideTimeout) clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
            if (this.window && !this.window.isDestroyed()) {
                try {
                    const { x } = targetDisplay.bounds;
                    this.window.setPosition(x, -10000);
                    this.window.setSize(1, 1);
                    // Reset height tracker
                    this.currentWindowHeight = null;
                } catch (e) {
                    if (this.options.debug) console.error('[DynamicIsland] Error hiding:', e);
                }
            }
        }, duration + 500); // Wait for duration + animation buffer
    }


    /**
     * Sends a message to the renderer process to trigger the notification.
     * @private
     * @param {object} payload - The data to send to the renderer.
     */
    triggerNotification(payload) {
        if (this.window && !this.window.isDestroyed()) {
            this.window.webContents.send('trigger-notch', payload);
        }
    }
}

module.exports = { DynamicIsland };
