/**
 * image2pixel - Pixel Font Generator
 * Copyright (c) 2026 image2pixel.app. All Rights Reserved.
 */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('textCanvas');
    const ctx = canvas.getContext('2d');
    const pixelTextInput = document.getElementById('pixelText');
    const textSizeSlider = document.getElementById('textSize');
    const textSizeInput = document.getElementById('textSizeInput');
    const textColorInput = document.getElementById('textColor');
    const showGridCheckbox = document.getElementById('showGrid');
    const saveButton = document.getElementById('saveButton');
    const printButton = document.getElementById('printButton');
    const resultInfo = document.getElementById('resultInfo');

    // UI Elements for Menu
    const menuToggle = document.getElementById('menuToggle');
    const sideMenu = document.getElementById('sideMenu');
    const menuClose = document.getElementById('menuClose');
    const menuOverlay = document.getElementById('menuOverlay');

    // Initialize
    function toggleMenu(show) {
        if (show) {
            sideMenu.classList.add('open');
            menuOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    menuToggle?.addEventListener('click', () => toggleMenu(true));
    menuClose?.addEventListener('click', () => toggleMenu(false));
    menuOverlay?.addEventListener('click', () => toggleMenu(false));

    function renderText() {
        const text = pixelTextInput.value || '';
        const fontSize = parseInt(textSizeSlider.value);
        const color = textColorInput.value;
        const showGrid = showGridCheckbox.checked;

        // Calculate block size (grid cell size) based on 12x12 base font
        const blockSize = fontSize / 12;

        // Disable smoothing for sharp pixels
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        // Set font to measure
        ctx.font = `${fontSize}px "Pixel32"`;

        // Measure text
        const metrics = ctx.measureText(text);
        // Round up text metrics to next block size to ensure fitting
        const textWidthRaw = metrics.width;
        // The font height is roughly the fontSize, but for layout let's follow the block grid
        const textHeightRaw = fontSize;

        // Calculate visual width/height snapped to blocks
        // We add some padding (e.g., 2 blocks on each side)
        const paddingBlocks = 4;
        const padding = paddingBlocks * blockSize;

        const minCanvasWidth = textWidthRaw + padding;
        const minCanvasHeight = textHeightRaw + padding;

        // Snap canvas dimensions to multiples of block size
        // ensuring an even number of blocks helps with centering if needed, 
        // but primarily we just want grid alignment.
        canvas.width = Math.ceil(minCanvasWidth / blockSize) * blockSize;
        canvas.height = Math.ceil(minCanvasHeight / blockSize) * blockSize;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Reset smoothing after resize
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        // Calculate centered position snapped to grid
        // We calculate the top-left coordinate for the text box
        // and snap it to the nearest block boundary.
        const startXRaw = (canvas.width - textWidthRaw) / 2;
        const startYRaw = (canvas.height - textHeightRaw) / 2;

        const startX = Math.floor(startXRaw / blockSize) * blockSize;
        const startY = Math.floor(startYRaw / blockSize) * blockSize;

        // Draw text
        ctx.fillStyle = color;
        ctx.font = `${fontSize}px "Pixel32"`;

        // Use top-left baseline for predictable grid positioning
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        // Adjust Y slightly because textBaseline 'top' might not match the visual top of pixel glyphs 
        // exactly depending on the font metrics, but for a 12px base pixel font, 
        // usually 'top' or 'alphabetic' with offset aligns well. 
        // Let's try drawing at the snapped start position.
        // Note: measureText might return a width slightly smaller than the visual block width
        // if the last character has whitespace. 
        // For centering, using the snapped start positions is the safest bet for grid alignment.

        // Small correction: The font might render slightly offset. 
        // Pixel32 usually aligns well.
        ctx.fillText(text, startX, startY);

        if (showGrid) {
            drawGrid(canvas, blockSize);
        }

        resultInfo.textContent = `${canvas.width}x${canvas.height}`;
    }

    function drawGrid(canvas, size) {
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= canvas.width; x += size) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += size) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    // Event Listeners
    pixelTextInput.addEventListener('input', renderText);

    textSizeSlider.addEventListener('input', () => {
        textSizeInput.value = textSizeSlider.value;
        renderText();
    });

    textSizeInput.addEventListener('input', () => {
        let value = parseInt(textSizeInput.value) || 12;
        value = Math.min(Math.max(value, 12), 144);
        textSizeSlider.value = value;
        renderText();
    });

    textColorInput.addEventListener('input', renderText);
    showGridCheckbox.addEventListener('change', renderText);

    saveButton.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'pixel-text.png';
        link.href = canvas.toDataURL();
        link.click();
    });

    printButton.addEventListener('click', () => {
        const win = window.open();
        win.document.write(`<img src="${canvas.toDataURL()}" style="width:100%; image-rendering:pixelated;">`);
        win.document.close();
        win.print();
    });

    // Wait for fonts to load with a fallback
    if (document.fonts) {
        document.fonts.load(`${textSizeSlider.value}px "Pixel32"`).then(() => {
            renderText();
        }).catch(err => {
            console.error("Font loading failed:", err);
            renderText(); // Try to render anyway
        });

        document.fonts.ready.then(renderText);
    } else {
        setTimeout(renderText, 500); // Old browser fallback
    }
});
