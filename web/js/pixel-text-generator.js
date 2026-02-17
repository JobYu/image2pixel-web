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

        // Set font
        ctx.font = `${fontSize}px "Pixel32"`;

        // Measure text
        const metrics = ctx.measureText(text);
        const textWidth = Math.ceil(metrics.width) || 100;
        const textHeight = fontSize * 1.2; // Approximate height

        // Update canvas size
        canvas.width = textWidth + 40; // Padding
        canvas.height = textHeight + 40; // Padding

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw text
        ctx.fillStyle = color;
        ctx.font = `${fontSize}px "Pixel32"`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        // Use imageRendering: pixelated for the canvas via CSS if needed
        // But here we draw directly
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        if (showGrid) {
            drawGrid(canvas, 8); // Fixed grid size for visual feedback
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
        let value = parseInt(textSizeInput.value) || 16;
        value = Math.min(Math.max(value, 16), 128);
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
