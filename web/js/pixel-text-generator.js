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

        // Split text by graphemes to safely handle complex emojis (e.g., skin tones, ZWJ sequences)
        const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
        const graphemes = Array.from(segmenter.segment(text)).map(s => s.segment);
        const emojiBaseSize = 16;

        // Create an offscreen context to accurately measure native emoji widths
        const emojiMeasureCtx = document.createElement('canvas').getContext('2d');
        emojiMeasureCtx.font = `${emojiBaseSize}px sans-serif`;

        // Measure text width by summing individual characters
        // This is necessary because we render characters individually to handle emojis
        let textWidthRaw = 0;
        for (const char of graphemes) {
            const isEmoji = /\p{Extended_Pictographic}/u.test(char) || /\p{Emoji_Presentation}/u.test(char);
            if (isEmoji) {
                textWidthRaw += emojiMeasureCtx.measureText(char).width * blockSize + blockSize;
            } else {
                textWidthRaw += ctx.measureText(char).width;
            }
        }
        // The font height is roughly the fontSize, but for layout let's follow the block grid
        const textHeightRaw = fontSize;

        // We add enough padding to prevent tall emojis from being clipped by the canvas edges
        const paddingBlocksX = 8;
        const paddingBlocksY = 32;
        const paddingX = paddingBlocksX * blockSize;
        const paddingY = paddingBlocksY * blockSize;

        const minCanvasWidth = textWidthRaw + paddingX;
        const minCanvasHeight = textHeightRaw + paddingY;

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

        // Draw text character by character to detect and transform emojis
        let currentX = startX;
        const baseSize = 12; // Base size for Pixel32 font

        // Dynamic color quantization using the Median Cut algorithm
        function extractDynamicPalette(imgData, maxColors) {
            let pixels = [];
            for (let i = 0; i < imgData.data.length; i += 4) {
                if (imgData.data[i + 3] > 20) {
                    pixels.push([imgData.data[i], imgData.data[i + 1], imgData.data[i + 2]]);
                }
            }
            if (pixels.length === 0) return [[0, 0, 0]];

            let buckets = [pixels];
            while (buckets.length < maxColors) {
                let maxBucketIdx = -1;
                let globalMaxRange = -1;
                let globalSortIdx = 0;

                for (let i = 0; i < buckets.length; i++) {
                    let pts = buckets[i];
                    if (pts.length <= 1) continue;
                    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
                    for (let p of pts) {
                        if (p[0] < minR) minR = p[0]; if (p[0] > maxR) maxR = p[0];
                        if (p[1] < minG) minG = p[1]; if (p[1] > maxG) maxG = p[1];
                        if (p[2] < minB) minB = p[2]; if (p[2] > maxB) maxB = p[2];
                    }
                    let rRange = maxR - minR, gRange = maxG - minG, bRange = maxB - minB;
                    let maxRange = Math.max(rRange, gRange, bRange);

                    if (maxRange > globalMaxRange) {
                        globalMaxRange = maxRange;
                        maxBucketIdx = i;
                        if (maxRange === rRange) globalSortIdx = 0;
                        else if (maxRange === gRange) globalSortIdx = 1;
                        else globalSortIdx = 2;
                    }
                }

                if (maxBucketIdx === -1) break; // Cannot split further

                let ptsToSplit = buckets[maxBucketIdx];
                ptsToSplit.sort((p1, p2) => p1[globalSortIdx] - p2[globalSortIdx]);
                let mid = Math.floor(ptsToSplit.length / 2);
                buckets.splice(maxBucketIdx, 1, ptsToSplit.slice(0, mid), ptsToSplit.slice(mid));
            }

            return buckets.map(pts => {
                let r = 0, g = 0, b = 0;
                for (let p of pts) { r += p[0]; g += p[1]; b += p[2]; }
                return [Math.round(r / pts.length), Math.round(g / pts.length), Math.round(b / pts.length)];
            });
        }

        function getNearestPaletteColor(r, g, b, palette) {
            let minDist = Infinity;
            let nearest = palette[0];
            for (const p of palette) {
                const dist = (r - p[0]) ** 2 + (g - p[1]) ** 2 + (b - p[2]) ** 2;
                if (dist < minDist) {
                    minDist = dist;
                    nearest = p;
                }
            }
            return nearest;
        }

        for (const char of graphemes) {
            // Check if the character is an emoji
            const isEmoji = /\p{Extended_Pictographic}/u.test(char) || /\p{Emoji_Presentation}/u.test(char);

            if (isEmoji) {
                const activeEmojiSize = 16; // Use 16x16 resolution for emojis
                const emojiNativeWidth = emojiMeasureCtx.measureText(char).width;
                // Scale width appropriately
                const charWidth = (emojiNativeWidth / activeEmojiSize) * activeEmojiSize * blockSize + blockSize;

                // Downsample emoji dynamically using an offscreen canvas
                const offscreen = document.createElement('canvas');
                offscreen.width = Math.ceil(emojiNativeWidth) + 8;
                const bufferHeight = activeEmojiSize + 20; // Extra vertical buffer
                offscreen.height = bufferHeight;
                const oCtx = offscreen.getContext('2d', { willReadFrequently: true });

                oCtx.font = `${activeEmojiSize}px sans-serif`;
                oCtx.textBaseline = 'middle';
                const middleY = Math.floor(bufferHeight / 2);
                oCtx.fillText(char, 4, middleY);

                const imgData = oCtx.getImageData(0, 0, offscreen.width, offscreen.height);
                const data = imgData.data;

                // Extract a custom 16-color palette for this specific emoji
                // By requesting 16 colors, the iterative median cut algorithm guarantees a balance of color fidelity and retro feel
                const dynamicPalette = extractDynamicPalette(imgData, 16);

                for (let y = 0; y < offscreen.height; y++) {
                    for (let x = 0; x < offscreen.width; x++) {
                        const idx = (y * offscreen.width + x) * 4;
                        const a = data[idx + 3];

                        if (a > 20) {
                            const r = data[idx];
                            const g = data[idx + 1];
                            const b = data[idx + 2];

                            const [nr, ng, nb] = getNearestPaletteColor(r, g, b, dynamicPalette);

                            ctx.fillStyle = `rgba(${nr},${ng},${nb}, 1)`;
                            // Map middle of emoji to middle of text line (6px from startY)
                            // We offset x by -4 because it was drawn at x=4 in offscreen
                            const renderX = Math.round(currentX) + (x - 4) * blockSize;
                            const renderY = startY + (6 * blockSize) + (y - middleY) * blockSize;
                            ctx.fillRect(renderX, renderY, blockSize, blockSize);
                        }
                    }
                }

                // Revert to original text color for subsequent normal characters
                ctx.fillStyle = color;
                currentX += charWidth;
            } else {
                ctx.fillText(char, Math.round(currentX), startY);
                currentX += ctx.measureText(char).width;
            }
        }

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
