const { ipcRenderer } = require('electron');

const notch = document.getElementById('notch');
const iconEl = document.getElementById('icon');
const messageEl = document.getElementById('message');

let hideTimeout;

// Icons
const icons = {
    // USB-C Port (Connect/Success)
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="10" rx="5"></rect><line x1="8" y1="12" x2="16" y2="12"></line></svg>`,

    // Crisp X (Disconnect/Error)
    x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,

    // Bluetooth (Minimal Line Art)
    bluetooth: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"></polyline></svg>`,

    // Warning (Triangle)
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,

    // Info (Circle i)
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
};

// Advanced Audio Engine (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const soundBuffers = {};

// 1. Create Static Graph (Once) to prevent lag
// Filter -> Gain -> Destination
const lowPassFilter = audioCtx.createBiquadFilter();
lowPassFilter.type = 'lowpass';
lowPassFilter.frequency.value = 2000; // Soften harshness

const masterGain = audioCtx.createGain();
masterGain.gain.value = 0.15; // 15% Volume

// Connect the permanent graph
lowPassFilter.connect(masterGain);
masterGain.connect(audioCtx.destination);

async function loadSound(name, url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        soundBuffers[name] = audioBuffer;
    } catch (e) {
        console.error(`Failed to load sound ${name}:`, e);
    }
}

// Preload Buffers
loadSound('success', './sounds/success.wav');
loadSound('error', './sounds/error.mp3');

function playPolishedSound(bufferName) {
    if (!soundBuffers[bufferName]) return;

    // Resume context if suspended (Chrome/Electron policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    // Create Source (Lightweight)
    const source = audioCtx.createBufferSource();
    source.buffer = soundBuffers[bufferName];

    // Pitch Randomization
    source.playbackRate.value = 0.98 + Math.random() * 0.04;

    // Connect to existing graph
    source.connect(lowPassFilter);

    // Play
    source.start(0);
}

ipcRenderer.on('trigger-notch', async (event, {
    type,
    message,
    icon,
    soundEnabled,
    soundFile,
    devMode,
    iconSize,
    iconWidth,
    iconHeight,
    iconGap,
    sizing,
    duration,
    fontFamily,
    fontSize,
    color,
    animation,
    glow
}) => {
    console.log('[Notch Renderer] Received trigger. Sound enabled:', soundEnabled, 'Sizing:', sizing);
    // Clear existing timeout
    if (hideTimeout) clearTimeout(hideTimeout);

    const container = document.getElementById('notch'); // Assuming 'notch' is the container
    const msgEl = document.getElementById('message');
    const iconContainer = document.getElementById('icon');

    // Select Icon based on Type/Icon param
    let iconSvg = icons.check; // Default
    let isCustomImage = false;

    // Reset Icon Classes
    iconContainer.classList.remove('custom-image');
    iconContainer.classList.remove('animate-pulse', 'animate-bounce', 'animate-spin', 'animate-wobble', 'animate-fade', 'animate-slide', 'no-animation');

    // Determine sizing mode first
    const isDynamicMode = sizing && sizing.type === 'dynamic' && sizing.height;

    if (icon && icon.startsWith('<svg')) {
        // Custom SVG passed directly
        iconSvg = icon;
    } else if (icon && (icon.endsWith('.png') || icon.endsWith('.jpg') || icon.endsWith('.jpeg') || icon.endsWith('.webp'))) {
        // Image Path - generate HTML with proper sizing
        isCustomImage = true;
        let imgSize = '100%';

        // In fixed mode with iconSize, scale the image larger than container to allow clipping
        if (iconSize && !isDynamicMode) {
            imgSize = `${iconSize}px`;
        }

        iconSvg = `<img src="${icon}" style="width: ${imgSize}; height: ${imgSize}; object-fit: contain;">`;
        iconContainer.classList.add('custom-image');
    } else if (icon === 'bluetooth') {
        iconSvg = icons.bluetooth;
    } else if (type === 'error') {
        iconSvg = icons.x;
    } else if (type === 'warning') {
        iconSvg = icons.warning;
    } else if (type === 'info') {
        iconSvg = icons.info;
    }

    // Update Content
    msgEl.textContent = message;
    iconContainer.innerHTML = iconSvg;

    // Apply Text Styling
    if (fontFamily) msgEl.style.fontFamily = fontFamily;
    else msgEl.style.fontFamily = ''; // Reset to CSS default

    if (fontSize) msgEl.style.fontSize = fontSize;
    else msgEl.style.fontSize = ''; // Reset

    if (color) {
        msgEl.style.color = color;
        // Also apply to icon if it's an SVG (inherits currentColor)
        iconContainer.style.color = color;
        // Dynamically update glow to match custom color
        if (!isCustomImage) {
            iconContainer.style.filter = `drop-shadow(0 0 10px ${color}73)`; // 73 = ~45% opacity
        }
    } else {
        msgEl.style.color = '';
        iconContainer.style.color = '';
        iconContainer.style.filter = ''; // Reset to CSS default
    }

    // Reset Classes
    container.className = 'notch expanded';
    container.classList.add(type); // success, disconnect, error

    // Handle Glow Effect
    if (glow === false) {
        // Explicitly disable glow
        iconContainer.style.filter = 'none';
    } else if (color && !isCustomImage) {
        // Custom color glow (already handled above, but ensure it's not overridden)
        // No action needed, the color block above sets it.
    } else {
        // Default class-based glow applies automatically via CSS
        // unless we need to reset a previous manual filter
        if (!color) iconContainer.style.filter = '';
    }

    // Add dynamic mode class for CSS styling
    if (isDynamicMode) {
        container.classList.add('dynamic-mode');
    }

    // ========================================
    // ROBUST SIZING & POSITIONING LOGIC
    // ========================================

    // 1. Unified Spacing System
    // ----------------------------------------
    // These constants define the vertical rhythm of the dynamic island.
    // NOTCH_HEIGHT: The physical height of the hardware notch (default 40px).
    // USER_OFFSET: User-defined vertical adjustment.
    // OPTICAL_OFFSET: Slight upward shift (-2px) to visually balance the content against the bezel.
    const NOTCH_HEIGHT_DEFAULT = 40;
    const NOTCH_HEIGHT = sizing?.notchHeight || NOTCH_HEIGHT_DEFAULT;
    const USER_OFFSET = sizing?.verticalOffset || 0;

    // Optical adjustment: The "visual" bottom of the notch is slightly higher than the physical pixels
    const OPTICAL_OFFSET = -2;

    // Calculate the "Safe Top" where content can start
    // This is the absolute Y-position below the notch where the content area begins.
    const SAFE_TOP = NOTCH_HEIGHT + USER_OFFSET + OPTICAL_OFFSET;

    // Padding buffers for dynamic mode
    // We use asymmetric padding to optically center content below the notch.
    // PADDING_TOP (32px) > PADDING_BOTTOM (20px) because the eye perceives the notch as "heavy".
    const PADDING_TOP = 32;
    const PADDING_BOTTOM = 20;

    // Constraints
    const MIN_CONTAINER_HEIGHT = 100;
    const MAX_CONTAINER_HEIGHT = 300; // Cap expansion to prevent screen takeover

    // 2. Content Sizing
    // ----------------------------------------
    // Default icon size if not provided
    const DEFAULT_ICON_SIZE = 24;

    // Determine width and height separately
    // If iconSize is provided, it sets both (square)
    // If iconWidth/iconHeight are provided, they override
    const iconW = iconWidth || iconSize || DEFAULT_ICON_SIZE;
    // If iconHeight is missing but iconWidth is set, default to square (iconW) to prevent tiny height
    const iconH = iconHeight || iconSize || (iconWidth ? iconWidth : DEFAULT_ICON_SIZE);

    // 3. Mode Handling
    // ----------------------------------------
    if (isDynamicMode) {
        // --- DYNAMIC MODE ---
        // Container expands to fit content (icon + text)
        // Height = Safe Top + Top Padding + Content Height + Bottom Padding

        const calculatedHeight = SAFE_TOP + PADDING_TOP + iconH + PADDING_BOTTOM;

        // Clamp height to safety limits
        const finalHeight = Math.min(Math.max(MIN_CONTAINER_HEIGHT, calculatedHeight), MAX_CONTAINER_HEIGHT);

        // Apply styles
        container.style.height = `${finalHeight}px`;
        container.style.paddingTop = `${SAFE_TOP + PADDING_TOP}px`;
        container.style.paddingBottom = `${PADDING_BOTTOM}px`;
        container.style.alignItems = 'center'; // Vertically center content in the available space

        // Icon Sizing
        iconContainer.style.width = `${iconW}px`;
        iconContainer.style.height = `${iconH}px`;

        // Width Expansion
        if (sizing.width) {
            container.style.maxWidth = 'none';
            container.style.width = 'auto';
            container.style.paddingRight = '24px'; // Add right padding for balance
        } else {
            container.style.maxWidth = '';
            container.style.width = '';
            container.style.paddingRight = '';
        }

        // Border Radius Adjustment for large containers
        if (finalHeight > 120) {
            container.style.borderRadius = '28px'; // Smoother corners for large windows
        } else {
            container.style.borderRadius = '';
        }

        // IPC: Resize Window
        ipcRenderer.send('resize-window', { height: finalHeight });

    } else {
        // --- FIXED MODE ---
        // Container stays at fixed standard size
        // Content is centered within the fixed container

        // Reset dynamic styles
        container.style.height = '';
        container.style.paddingTop = '';
        container.style.paddingBottom = '';
        container.style.alignItems = '';
        container.style.borderRadius = '';
        container.style.maxWidth = '';
        container.style.width = '';
        container.style.paddingRight = '';

        // Icon Sizing in Fixed Mode
        // We allow the icon to be larger than the container (overflow) if desired, 
        // but typically it should be constrained.
        // If iconSize/Width/Height is provided, we use it
        if (iconSize || iconWidth || iconHeight) {
            iconContainer.style.width = `${iconW}px`;
            iconContainer.style.height = `${iconH}px`;
        } else {
            // Default fixed mode icon size
            iconContainer.style.width = '24px';
            iconContainer.style.height = '24px';
        }

        // IPC: Reset Window to Default
        ipcRenderer.send('resize-window', { height: 100 });
    }


    // Apply Custom Gap
    if (iconGap) {
        const content = container.querySelector('.notch-content');
        if (content) content.style.gap = `${iconGap}px`;
    } else {
        const content = container.querySelector('.notch-content');
        if (content) content.style.gap = ''; // Reset
    }

    // Apply Dev Mode
    if (devMode) {
        container.classList.add('dev-mode');
    } else {
        container.classList.remove('dev-mode');
    }

    // Apply Custom Animation
    if (animation) {
        const animationMap = {
            'pulse': 'animate-pulse',
            'bounce': 'animate-bounce',
            'spin': 'animate-spin',
            'wobble': 'animate-wobble',
            'fade': 'animate-fade',
            'slide': 'animate-slide',
            'none': 'no-animation'
        };
        const animClass = animationMap[animation];
        if (animClass) {
            iconContainer.classList.add(animClass);
        }
    }

    // Auto-hide after duration (default 4.5s)
    const hideDelay = duration || 4500;

    hideTimeout = setTimeout(() => {
        // CRITICAL: Handle 'auto' width transition
        // CSS cannot transition from 'auto' to 'px'. We must freeze the current width in pixels first.
        const currentWidth = container.getBoundingClientRect().width;
        container.style.width = `${currentWidth}px`;

        // Force reflow to ensure the browser registers the pixel width
        container.offsetHeight;

        container.classList.remove('expanded');
        container.classList.add('collapsed');

        // Clear inline styles to allow CSS transitions to take over for the collapse animation.
        // We set the explicit pixel width above to ensure a smooth transition from 'auto' to fixed width.

        container.style.height = '';
        container.style.maxWidth = '';
        container.style.paddingTop = '';
        container.style.paddingBottom = '';
        container.style.paddingRight = '';
        container.style.borderRadius = '';
        container.style.alignItems = '';
        container.style.width = ''; // Now transition from [current px] to [collapsed css px]

        // Reset icon size
        iconContainer.style.width = '';
        iconContainer.style.height = '';
    }, hideDelay);

    // Play Sound Effect (Polished)
    if (soundEnabled !== false) {
        if (soundFile) {
            // Play custom sound
            try {
                // Use Audio element for simplicity with custom paths
                const audio = new Audio(soundFile);
                audio.volume = 0.2;
                audio.play().catch(e => console.error('Failed to play custom sound:', e));
            } catch (e) {
                console.error('Error setting up custom sound:', e);
            }
        } else {
            // Play default sound
            if (type === 'success' || type === 'bluetooth-success') {
                playPolishedSound('success');
            } else if (type === 'disconnect' || type === 'error') {
                playPolishedSound('error');
            }
        }
    }
});
