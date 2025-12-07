import { BrowserWindow } from 'electron';

export interface DynamicIslandOptions {
    /**
     * Path to a custom icon (PNG/JPG/SVG) or a preset name like 'bluetooth'.
     */
    icon?: string;

    /**
     * Custom sound paths for different notification types.
     * Example: { success: '/path/to/success.mp3', error: '/path/to/error.mp3' }
     */
    sounds?: {
        success?: string;
        error?: string;
        info?: string;
        warning?: string;
        [key: string]: string | undefined;
    };

    /**
     * Enable or disable built-in sound effects. Default: true.
     */
    enableSounds?: boolean;

    /**
     * Enable development mode to show the window boundary. Default: false.
     */
    devMode?: boolean;

    /**
     * Enable debug logging. Default: false.
     */
    debug?: boolean;

    /**
     * Default sizing configuration.
     */
    sizing?: SizingConfig;

    /**
     * Default icon size (width and height) in pixels.
     */
    iconSize?: number;

    /**
     * Default icon width in pixels.
     */
    iconWidth?: number;

    /**
     * Default icon height in pixels.
     */
    iconHeight?: number;

    /**
     * Default gap between icon and text in pixels.
     */
    iconGap?: number;
}

export interface SizingConfig {
    /**
     * Sizing mode: 'fixed' or 'dynamic'. Default: 'fixed'.
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
     * Override detected notch height in pixels.
     */
    notchHeight?: number;

    /**
     * Fine-tune vertical position in pixels.
     */
    verticalOffset?: number;
}

export interface ShowOptions {
    /**
     * Notification type. Determines default color and icon.
     */
    type?: 'success' | 'error' | 'info' | 'warning';

    /**
     * The message text to display.
     */
    message: string;

    /**
     * Path to a custom icon or a preset name.
     */
    icon?: string;

    /**
     * Size of the icon (width and height) in pixels.
     */
    iconSize?: number;

    /**
     * Width of the icon in pixels. Overrides iconSize.
     */
    iconWidth?: number;

    /**
     * Height of the icon in pixels. Overrides iconSize.
     */
    iconHeight?: number;

    /**
     * Gap between icon and text in pixels.
     */
    iconGap?: number;

    /**
     * Override sizing configuration for this notification.
     */
    sizing?: SizingConfig;

    /**
     * Duration in milliseconds before auto-hiding. Default: 4500.
     */
    duration?: number;

    /**
     * Font family for the message text.
     */
    fontFamily?: string;

    /**
     * Font size for the message text (e.g., '14px').
     */
    fontSize?: string;

    /**
     * Custom text color (hex, rgb, or name).
     */
    color?: string;

    /**
     * Animation type for the icon.
     */
    animation?: 'pulse' | 'bounce' | 'spin' | 'wobble' | 'fade' | 'slide';

    /**
     * Path to a custom sound file to play.
     */
    soundFile?: string;

    /**
     * Override devMode for this notification.
     */
    devMode?: boolean;
}

export class DynamicIsland {
    constructor(options?: DynamicIslandOptions);

    /**
     * The Electron BrowserWindow instance.
     */
    window: BrowserWindow | null;

    /**
     * Initializes the Dynamic Island. Should be called after the app is ready.
     */
    init(): void;

    /**
     * Triggers a notification.
     */
    show(options: ShowOptions): void;
}
