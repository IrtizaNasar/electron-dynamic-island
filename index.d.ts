import { BrowserWindow } from 'electron';

export interface DynamicIslandOptions {
    /**
     * Path to a default icon, SVG string, or preset name ('bluetooth', 'check', 'x', 'warning', 'info').
     */
    icon?: string;
    /**
     * Custom sound paths for different notification types.
     * Example: { success: '/path/to/success.wav', error: '/path/to/error.mp3' }
     */
    sounds?: {
        success?: string;
        error?: string;
        info?: string;
        warning?: string;
        [key: string]: string | undefined;
    };
    /**
     * Enable or disable sound effects. Default: true.
     */
    enableSounds?: boolean;
    /**
     * Show the window boundary for debugging. Default: false.
     */
    devMode?: boolean;
    /**
     * Enable detailed logging. Default: false.
     */
    debug?: boolean;
    /**
     * Default sizing configuration.
     */
    sizing?: SizingOptions;
    /**
     * Default size for icons (width and height) in pixels.
     */
    iconSize?: number;
    /**
     * Default width for icons in pixels.
     */
    iconWidth?: number;
    /**
     * Default height for icons in pixels.
     */
    iconHeight?: number;
    /**
     * Default gap between icon and text in pixels.
     */
    iconGap?: number;
}

export interface SizingOptions {
    /**
     * 'fixed' (default) or 'dynamic'.
     */
    type?: 'fixed' | 'dynamic';
    /**
     * Allow height to expand in dynamic mode. Default: false.
     */
    height?: boolean;
    /**
     * Allow width to expand in dynamic mode. Default: false.
     */
    width?: boolean;
    /**
     * Override detected notch height. Default: 40.
     */
    notchHeight?: number;
    /**
     * Vertical offset in pixels. Default: 0.
     */
    verticalOffset?: number;
}

export interface ShowOptions {
    /**
     * Notification type. Determines default color and icon.
     * 'success' | 'error' | 'info' | 'warning'
     */
    type?: 'success' | 'error' | 'info' | 'warning';
    /**
     * The message text to display.
     */
    message: string;
    /**
     * Override the default icon.
     */
    icon?: string;
    /**
     * Size of the icon (width & height) in pixels.
     */
    iconSize?: number;
    /**
     * Width of the icon in pixels.
     */
    iconWidth?: number;
    /**
     * Height of the icon in pixels.
     */
    iconHeight?: number;
    /**
     * Gap between icon and text in pixels.
     */
    iconGap?: number;
    /**
     * Override the default sizing options for this notification.
     */
    sizing?: SizingOptions;
    /**
     * Duration in milliseconds before auto-hiding. Default: 4500.
     */
    duration?: number;
    /**
     * Custom font family.
     */
    fontFamily?: string;
    /**
     * Custom font size (e.g., '14px').
     */
    fontSize?: string;
    /**
     * Custom text/icon color (hex code).
     */
    color?: string;
    /**
     * Animation type.
     * 'pop-in' | 'slide' | 'fade' | 'shake' | 'pulse' | 'bounce' | 'spin' | 'wobble' | 'none'
     */
    animation?: 'pop-in' | 'slide' | 'fade' | 'shake' | 'pulse' | 'bounce' | 'spin' | 'wobble' | 'none' | string;
    /**
     * Enable or disable the glow effect. Default: true (based on type).
     */
    glow?: boolean;
    /**
     * Show debug boundary for this notification.
     */
    devMode?: boolean;
}

export class DynamicIsland {
    constructor(options?: DynamicIslandOptions);

    /**
     * Checks if the current Mac has a physical notch.
     */
    hasNotch(): boolean;

    /**
     * Initializes the Dynamic Island. Should be called after app 'ready'.
     */
    init(): void;

    /**
     * Triggers a notification.
     */
    show(options: ShowOptions): void;
}
