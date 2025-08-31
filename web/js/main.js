/**
 * image2pixel - Pixel Art Generator
 * Copyright (c) 2024 image2pixel.app. All Rights Reserved.
 * 
 * This file is part of the image2pixel project and is protected under
 * a Custom Restricted License. Unauthorized commercial use or creation
 * of derivative competing works is prohibited.
 * 
 * This code converts regular images into pixel art with customizable
 * settings for block size and color count. Includes transparency support
 * and anti-aliasing removal functionality.
 */

let originalImage = null;
let processedImage = null;
let selectedPalette = null; // { name: string, colors: [[r,g,b,a], ...] }
let allPalettes = []; // catalog for modal
let palettesLoaded = false;

// Fallback static manifest when fetching package.json is not possible (e.g., opened via file://)
const FALLBACK_PALETTES = [
    // adigunpolack-palettes
    { id: 'AAP-64', path: 'palette/adigunpolack-palettes/aap-64.gpl' },
    { id: 'AAP-Micro12', path: 'palette/adigunpolack-palettes/aap-micro12.gpl' },
    { id: 'AAP-Splendor128', path: 'palette/adigunpolack-palettes/aap-splendor128.gpl' },
    { id: 'AAP-RadiantXV', path: 'palette/adigunpolack-palettes/aap-radiantxv.gpl' },
    { id: 'SimpleJPC-16', path: 'palette/adigunpolack-palettes/simplejpc-16.gpl' },
    // arne-palettes
    { id: 'A64', path: 'palette/arne-palettes/a64.gpl' },
    { id: 'ARNE16', path: 'palette/arne-palettes/arne16.gpl' },
    { id: 'ARNE32', path: 'palette/arne-palettes/arne32.gpl' },
    { id: 'CGArne', path: 'palette/arne-palettes/cg-arne.gpl' },
    { id: 'Copper Tech', path: 'palette/arne-palettes/copper-tech.gpl' },
    { id: 'CPC Boy', path: 'palette/arne-palettes/cpc-boy.gpl' },
    { id: 'Eroge Copper', path: 'palette/arne-palettes/eroge-copper.gpl' },
    { id: 'JMP', path: 'palette/arne-palettes/jmp.gpl' },
    { id: 'Psygnosia', path: 'palette/arne-palettes/psygnosia.gpl' },
    // davitmasia-palettes
    { id: 'Matriax8c', path: 'palette/davitmasia-palettes/matriax8c.gpl' },
    // dawnbringer-palettes
    { id: 'DB16', path: 'palette/dawnbringer-palettes/db16.gpl' },
    { id: 'DB32', path: 'palette/dawnbringer-palettes/db32.gpl' },
    // endesga-palettes
    { id: 'ARQ4', path: 'palette/endesga-palettes/arq4.gpl' },
    { id: 'ARQ16', path: 'palette/endesga-palettes/arq16.gpl' },
    { id: 'EDG16', path: 'palette/endesga-palettes/edg16.gpl' },
    { id: 'EDG32', path: 'palette/endesga-palettes/edg32.gpl' },
    { id: 'EDG8', path: 'palette/endesga-palettes/edg8.gpl' },
    { id: 'EN4', path: 'palette/endesga-palettes/en4.gpl' },
    { id: 'ENOS16', path: 'palette/endesga-palettes/enos16.gpl' },
    { id: 'HEPT32', path: 'palette/endesga-palettes/hept32.gpl' },
    // hardware-palettes
    { id: 'Apple II', path: 'palette/hardware-palettes/apple-ii.gpl' },
    { id: 'Atari 2600 NTSC', path: 'palette/hardware-palettes/atari2600-ntsc.gpl' },
    { id: 'Atari 2600 PAL', path: 'palette/hardware-palettes/atari2600-pal.gpl' },
    { id: 'CGA', path: 'palette/hardware-palettes/cga.gpl' },
    { id: 'CGA0', path: 'palette/hardware-palettes/cga0.gpl' },
    { id: 'CGA0 High', path: 'palette/hardware-palettes/cga0hi.gpl' },
    { id: 'CGA1', path: 'palette/hardware-palettes/cga1.gpl' },
    { id: 'CGA1 High', path: 'palette/hardware-palettes/cga1hi.gpl' },
    { id: 'CGA3rd', path: 'palette/hardware-palettes/cga3rd.gpl' },
    { id: 'CGA3rd High', path: 'palette/hardware-palettes/cga3rdhi.gpl' },
    { id: 'Commodore Plus/4', path: 'palette/hardware-palettes/commodore-plus4.gpl' },
    { id: 'Commodore VIC-20', path: 'palette/hardware-palettes/commodore-vic20.gpl' },
    { id: 'Commodore 64', path: 'palette/hardware-palettes/commodore64.gpl' },
    { id: 'CPC', path: 'palette/hardware-palettes/cpc.gpl' },
    { id: 'Game Boy', path: 'palette/hardware-palettes/gameboy.gpl' },
    { id: 'Game Boy Color Type1', path: 'palette/hardware-palettes/gameboy-color-type1.gpl' },
    { id: 'Master System', path: 'palette/hardware-palettes/master-system.gpl' },
    { id: 'MSX1', path: 'palette/hardware-palettes/msx1.gpl' },
    { id: 'MSX2', path: 'palette/hardware-palettes/msx2.gpl' },
    { id: 'NES', path: 'palette/hardware-palettes/nes.gpl' },
    { id: 'NES NTSC', path: 'palette/hardware-palettes/nes-ntsc.gpl' },
    { id: 'Teletext', path: 'palette/hardware-palettes/teletext.gpl' },
    { id: 'VGA 13h', path: 'palette/hardware-palettes/vga-13h.gpl' },
    { id: 'Virtual Boy', path: 'palette/hardware-palettes/virtualboy.gpl' },
    { id: 'ZX Spectrum', path: 'palette/hardware-palettes/zx-spectrum.gpl' },
    // hyohnoo-palettes
    { id: 'mail24', path: 'palette/hyohnoo-palettes/mail24.gpl' },
    // javierguerrero-palettes
    { id: 'nyx8', path: 'palette/javierguerrero-palettes/nyx8.gpl' },
    // pico8-palette
    { id: 'PICO-8', path: 'palette/pico8-palette/pico-8.gpl' },
    // pinetreepizza-palettes
    { id: 'BubbleGum16', path: 'palette/pinetreepizza-palettes/bubblegum-16.gpl' },
    { id: 'Rosy-42', path: 'palette/pinetreepizza-palettes/rosy-42.gpl' },
    // software-palettes
    { id: 'Google UI', path: 'palette/software-palettes/google-ui.gpl' },
    { id: 'Minecraft', path: 'palette/software-palettes/minecraft.gpl' },
    { id: 'Monokai', path: 'palette/software-palettes/monokai.gpl' },
    { id: 'SmileBASIC', path: 'palette/software-palettes/smile-basic.gpl' },
    { id: 'Solarized', path: 'palette/software-palettes/solarized.gpl' },
    { id: 'Web Safe Colors', path: 'palette/software-palettes/web-safe-colors.gpl' },
    { id: 'Win16', path: 'palette/software-palettes/win16.gpl' },
    { id: 'X11', path: 'palette/software-palettes/x11.gpl' },
    // wplace-palettes
    { id: 'wplace', path: 'palette/wplace-palettes/wplace.gpl' },
    // zughy-palettes
    { id: 'Zughy-32', path: 'palette/zughy-palettes/zughy-32.gpl' }
];

const canvas = document.getElementById('resultCanvas');
const ctx = canvas.getContext('2d');
const saveButton = document.getElementById('saveButton');
const printButton = document.getElementById('printButton');
const paletteButton = document.getElementById('paletteButton');
const selectedPaletteLabel = document.getElementById('selectedPaletteLabel');

// Initialize canvas with default size to match the container
canvas.width = 300;
canvas.height = 300;

// Update button states
function updateButtonStates() {
    const hasImage = processedImage !== null;
    saveButton.disabled = !hasImage;
    printButton.disabled = !hasImage;
}

updateButtonStates();

// Handle file input
document.getElementById('imageInput').addEventListener('change', async function(e) {
    // Clear memory
    originalImage = null;
    processedImage = null;
    updateButtonStates();
    
    // Clear canvas contents
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 1;
    canvas.height = 1;
    
    // Clear containers
    const container = document.getElementById('originalImageContainer');
    const resultContainer = document.querySelector('.result');
    container.innerHTML = '';
    resultContainer.innerHTML = '<h3>Pixel Art</h3>';
    resultContainer.appendChild(canvas);

    // Process new file if one is selected
    const file = e.target.files[0];
    if (!file) return;

    processStaticImage(file);
});

// Process static images
function processStaticImage(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            originalImage = img;
            
            // Create and add the image element
            const container = document.getElementById('originalImageContainer');
            container.innerHTML = '';
            img.id = 'originalImage';
            container.appendChild(img);
            
            processImage();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Handle slider and input changes
['blockSize', 'colorCount'].forEach(id => {
    const slider = document.getElementById(id);
    const input = document.getElementById(`${id}Input`);
    
    // Update number input when slider changes
    slider.addEventListener('input', function() {
        const value = parseInt(this.value);
        input.value = value;
        if (originalImage) processImage();
    });
    
    // Update slider when number input changes
    input.addEventListener('input', function() {
        let value = parseInt(this.value) || 1;
        const min = parseInt(this.min);
        const max = parseInt(this.max);
        value = Math.min(Math.max(value, min), max);
        this.value = value;
        slider.value = value;
        if (originalImage) processImage();
    });
});

document.getElementById('showGrid').addEventListener('change', function() {
    if (originalImage) processImage();
});

// Palette modal interactions
if (paletteButton) {
    paletteButton.addEventListener('click', function() {
        openPaletteModal();
    });
}

function setSelectedPalette(palette) {
    selectedPalette = palette; // can be null for auto
    if (palette) {
        selectedPaletteLabel.textContent = `Using palette: ${palette.name} (${palette.colors.length} colors)`;
    } else {
        selectedPaletteLabel.textContent = '';
    }
    if (originalImage) processImage();
}

function openPaletteModal() {
    const modal = document.getElementById('paletteModal');
    if (!modal) return;
    modal.style.display = 'flex';
    
    if (palettesLoaded) {
        renderPaletteList();
    } else {
        const list = document.getElementById('paletteList');
        if (list) {
            list.innerHTML = '<div style="padding:10px; text-align:left;">Loading palettes...</div>';
        }
    }
}

function closePaletteModal() {
    const modal = document.getElementById('paletteModal');
    if (!modal) return;
    modal.style.display = 'none';
}

document.getElementById('closePaletteModal')?.addEventListener('click', closePaletteModal);
document.getElementById('paletteAutoButton')?.addEventListener('click', function() {
    setSelectedPalette(null);
    closePaletteModal();
});

function renderPaletteList() {
    const list = document.getElementById('paletteList');
    if (!list) return;
    list.innerHTML = '';
    if (!allPalettes.length) {
        const info = document.createElement('div');
        info.style.padding = '8px';
        info.style.textAlign = 'left';
        info.textContent = 'No palettes found. If you opened this file directly, please run it via a local web server to enable loading built-in palettes.';
        list.appendChild(info);
        return;
    }
    allPalettes.forEach(p => {
        const card = document.createElement('div');
        card.className = 'palette-card';

        const header = document.createElement('div');
        header.className = 'palette-card-header';
        const title = document.createElement('div');
        title.textContent = `${p.displayName || p.id}`;
        const applyBtn = document.createElement('button');
        applyBtn.className = 'button';
        applyBtn.textContent = 'Use';
        applyBtn.addEventListener('click', async () => {
            const colors = p.colors || await fetchAndParseGPL(p.path);
            setSelectedPalette({ name: p.displayName || p.id, colors });
            closePaletteModal();
        });
        header.appendChild(title);
        header.appendChild(applyBtn);

        const swatches = document.createElement('div');
        swatches.className = 'swatches';
        const previewColors = (p.colors && p.colors.length ? p.colors : p.previewColors || []).slice(0, 64);
        previewColors.forEach(c => {
            const s = document.createElement('div');
            s.className = 'swatch';
            const [r,g,b,a] = c;
            s.style.background = `rgba(${r},${g},${b},${(a ?? 255)/255})`;
            swatches.appendChild(s);
        });

        card.appendChild(header);
        card.appendChild(swatches);
        list.appendChild(card);
    });
}

async function loadAllPalettes() {
    // Static manifests (package.json) under palette/
    const packageFiles = [
        'palette/adigunpolack-palettes/package.json',
        'palette/arne-palettes/package.json',
        'palette/davitmasia-palettes/package.json',
        'palette/dawnbringer-palettes/package.json',
        'palette/endesga-palettes/package.json',
        'palette/hardware-palettes/package.json',
        'palette/hyohnoo-palettes/package.json',
        'palette/javierguerrero-palettes/package.json',
        'palette/pico8-palette/package.json',
        'palette/pinetreepizza-palettes/package.json',
        'palette/software-palettes/package.json',
        'palette/wplace-palettes/package.json',
        'palette/zughy-palettes/package.json'
    ];

    const results = [];
    for (const pkgPath of packageFiles) {
        try {
            const res = await fetch(pkgPath);
            if (!res.ok) continue;
            const json = await res.json();
            const baseDir = pkgPath.substring(0, pkgPath.lastIndexOf('/'));
            const contributes = json.contributes?.palettes || [];
            for (const item of contributes) {
                const id = item.id;
                const path = `${baseDir}/${item.path.replace(/^\.\//,'')}`;
                // Try to quickly fetch first few colors for preview without blocking UI too much
                let previewColors = [];
                try {
                    const txt = await (await fetch(path)).text();
                    previewColors = parseGPLPreview(txt, 64);
                } catch(e) {}
                results.push({ id, path, displayName: id, previewColors });
            }
        } catch (e) {
            // ignore individual failures
        }
    }
    allPalettes = results;
    if (!allPalettes.length) {
        // fallback to static list without previews
        allPalettes = FALLBACK_PALETTES.map(p => ({ id: p.id, path: p.path, displayName: p.id, previewColors: [] }));
    }
}

function parseGPLPreview(text, limit = 64) {
    const colors = [];
    const lines = text.split(/\r?\n/);
    for (const raw of lines) {
        if (colors.length >= limit) break;
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        if (/^(GIMP Palette|Name:|Columns:|Channels:)/i.test(line)) continue;
        const parts = line.split(/\s+/).filter(Boolean);
        const nums = parts.map(v => parseInt(v, 10)).filter(n => !Number.isNaN(n));
        if (nums.length >= 3) {
            const [r,g,b,a] = [nums[0], nums[1], nums[2], (nums[3] ?? 255)];
            colors.push([clamp255(r), clamp255(g), clamp255(b), clamp255(a)]);
        }
    }
    return colors;
}

async function fetchAndParseGPL(path) {
    const res = await fetch(path);
    const text = await res.text();
    return parseGPL(text);
}

function parseGPL(text) {
    const colors = [];
    let hasRGBA = false;
    const lines = text.split(/\r?\n/);
    for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        if (line.toLowerCase().startsWith('channels:')) {
            if (/rgba/i.test(line)) hasRGBA = true;
            continue;
        }
        if (line.startsWith('#') || /^(gimp palette|name:|columns:)/i.test(line)) continue;
        const parts = line.split(/\s+/).filter(Boolean);
        const nums = parts.map(v => parseInt(v, 10)).filter(n => !Number.isNaN(n));
        if (nums.length >= 3) {
            let r = nums[0], g = nums[1], b = nums[2];
            let a = 255;
            if (hasRGBA && nums.length >= 4) a = nums[3];
            colors.push([clamp255(r), clamp255(g), clamp255(b), clamp255(a)]);
        }
    }
    return colors;
}

function clamp255(v) { return Math.max(0, Math.min(255, v|0)); }

// Add ColorBox class for median cut quantization
class ColorBox {
    constructor(pixels, level = 0) {
        this.pixels = pixels;
        this.level = level;
        this.computeMinMax();
    }

    computeMinMax() {
        let minR = 255, minG = 255, minB = 255, minA = 255;
        let maxR = 0, maxG = 0, maxB = 0, maxA = 0;

        for (const pixel of this.pixels) {
            minR = Math.min(minR, pixel[0]);
            minG = Math.min(minG, pixel[1]);
            minB = Math.min(minB, pixel[2]);
            minA = Math.min(minA, pixel[3]);
            maxR = Math.max(maxR, pixel[0]);
            maxG = Math.max(maxG, pixel[1]);
            maxB = Math.max(maxB, pixel[2]);
            maxA = Math.max(maxA, pixel[3]);
        }

        this.minR = minR; this.minG = minG; this.minB = minB; this.minA = minA;
        this.maxR = maxR; this.maxG = maxG; this.maxB = maxB; this.maxA = maxA;
        
        const rangeR = maxR - minR;
        const rangeG = maxG - minG;
        const rangeB = maxB - minB;
        const rangeA = maxA - minA;
        
        this.largestRange = Math.max(rangeR, rangeG, rangeB, rangeA);
        
        if (rangeR === this.largestRange) this.splitChannel = 0;
        else if (rangeG === this.largestRange) this.splitChannel = 1;
        else if (rangeB === this.largestRange) this.splitChannel = 2;
        else this.splitChannel = 3;
    }

    getAverageColor() {
        let r = 0, g = 0, b = 0, a = 0;
        for (const pixel of this.pixels) {
            r += pixel[0];
            g += pixel[1];
            b += pixel[2];
            a += pixel[3];
        }
        const count = this.pixels.length;
        return [
            Math.round(r / count),
            Math.round(g / count),
            Math.round(b / count),
            Math.round(a / count)
        ];
    }

    split() {
        if (this.pixels.length < 2) return null;

        const channel = this.splitChannel;
        this.pixels.sort((a, b) => a[channel] - b[channel]);

        const mid = Math.floor(this.pixels.length / 2);
        const box1 = new ColorBox(this.pixels.slice(0, mid), this.level + 1);
        const box2 = new ColorBox(this.pixels.slice(mid), this.level + 1);

        return [box1, box2];
    }
}

// Add median cut quantization function
function medianCutQuantization(imageData, colorCount) {
    const pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
        pixels.push([
            imageData.data[i],
            imageData.data[i + 1],
            imageData.data[i + 2],
            imageData.data[i + 3]
        ]);
    }

    let boxes = [new ColorBox(pixels)];
    
    while (boxes.length < colorCount) {
        let boxToSplit = boxes.reduce((a, b) => 
            a.largestRange > b.largestRange ? a : b
        );
        
        boxes = boxes.filter(box => box !== boxToSplit);
        
        const newBoxes = boxToSplit.split();
        if (newBoxes) {
            boxes.push(...newBoxes);
        } else {
            break;
        }
    }

    const palette = boxes.map(box => box.getAverageColor());

    // Apply palette to image data
    for (let i = 0; i < imageData.data.length; i += 4) {
        const pixel = [
            imageData.data[i],
            imageData.data[i + 1],
            imageData.data[i + 2],
            imageData.data[i + 3]
        ];
        
        let minDistance = Infinity;
        let closestColor = null;
        
        for (const color of palette) {
            const distance = colorDistance(pixel, color);
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = color;
            }
        }
        
        imageData.data[i] = closestColor[0];
        imageData.data[i + 1] = closestColor[1];
        imageData.data[i + 2] = closestColor[2];
        imageData.data[i + 3] = closestColor[3];
    }
}

function colorDistance(color1, color2) {
    return Math.sqrt(
        Math.pow(color1[0] - color2[0], 2) +
        Math.pow(color1[1] - color2[1], 2) +
        Math.pow(color1[2] - color2[2], 2)
    );
}

// Quantize image to a fixed palette
function quantizeToFixedPalette(imageData, palette) {
    const data = imageData.data;
    const colors = palette;
    for (let i = 0; i < data.length; i += 4) {
        const pr = data[i], pg = data[i+1], pb = data[i+2], pa = data[i+3];
        let minD = Infinity;
        let best = null;
        for (let j = 0; j < colors.length; j++) {
            const c = colors[j];
            const d = (pr - c[0])*(pr - c[0]) + (pg - c[1])*(pg - c[1]) + (pb - c[2])*(pb - c[2]);
            if (d < minD) { minD = d; best = c; }
        }
        data[i] = best[0];
        data[i+1] = best[1];
        data[i+2] = best[2];
        data[i+3] = (best[3] != null ? best[3] : pa);
    }
}

// Add this new function to detect background color
function detectBackgroundColor(imageData) {
    const data = imageData.data;
    const corners = [
        [0, 0],
        [0, imageData.height - 1],
        [imageData.width - 1, 0],
        [imageData.width - 1, imageData.height - 1]
    ];
    
    let r = 0, g = 0, b = 0, a = 0;
    corners.forEach(([x, y]) => {
        const idx = (y * imageData.width + x) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        a += data[idx + 3];
    });
    
    return [
        Math.round(r / 4),
        Math.round(g / 4),
        Math.round(b / 4),
        Math.round(a / 4)
    ];
}

// Add this function to remove AA artifacts
function removeAntiAliasing(imageData, backgroundColor, threshold = 30) {
    if (backgroundColor[3] < 128) {
        return; 
    }

    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const pixel = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
            
            const distance = colorDistance(pixel, backgroundColor);
            if (distance < threshold) {
                data[idx] = backgroundColor[0];
                data[idx + 1] = backgroundColor[1];
                data[idx + 2] = backgroundColor[2];
                data[idx + 3] = backgroundColor[3];
            }
        }
    }
}

// Add this function to calculate scaled dimensions
function calculateScaledDimensions(width, height, maxWidth = 800, maxHeight = 600) {
    let scale = 1;
    
    if (width > maxWidth || height > maxHeight) {
        const widthScale = maxWidth / width;
        const heightScale = maxHeight / height;
        scale = Math.min(widthScale, heightScale);
    }
    
    return {
        width: Math.floor(width * scale),
        height: Math.floor(height * scale)
    };
}

// Modify the processImage function
function processImage() {
    if (!originalImage) return;
    
    const blockSize = parseInt(document.getElementById('blockSize').value) || 8;
    const colorCount = parseInt(document.getElementById('colorCount').value) || 16;
    
    // Calculate scaled dimensions
    const { width, height } = calculateScaledDimensions(originalImage.width, originalImage.height);
    
    // Set canvas size to scaled dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Draw original image with scaling
    ctx.imageSmoothingEnabled = false; // Disable smoothing for pixel art
    ctx.drawImage(originalImage, 0, 0, width, height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Detect background color
    const backgroundColor = detectBackgroundColor(imageData);
    
    // Create pixel blocks
    for (let y = 0; y < canvas.height; y += blockSize) {
        for (let x = 0; x < canvas.width; x += blockSize) {
            let r = 0, g = 0, b = 0, a = 0, count = 0;
            
            // Calculate average color for block
            for (let by = 0; by < blockSize && y + by < canvas.height; by++) {
                for (let bx = 0; bx < blockSize && x + bx < canvas.width; bx++) {
                    const idx = ((y + by) * canvas.width + (x + bx)) * 4;
                    r += data[idx];
                    g += data[idx + 1];
                    b += data[idx + 2];
                    a += data[idx + 3];
                    count++;
                }
            }
            
            // Calculate average
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            a = Math.round(a / count);
            
            // Fill the block with average color
            for (let by = 0; by < blockSize && y + by < canvas.height; by++) {
                for (let bx = 0; bx < blockSize && x + bx < canvas.width; bx++) {
                    const idx = ((y + by) * canvas.width + (x + bx)) * 4;
                    data[idx] = r;
                    data[idx + 1] = g;
                    data[idx + 2] = b;
                    data[idx + 3] = a;
                }
            }
        }
    }
    
    // Apply AA removal *before* quantization
    removeAntiAliasing(imageData, backgroundColor);

    // Apply quantization
    if (selectedPalette && selectedPalette.colors && selectedPalette.colors.length) {
        quantizeToFixedPalette(imageData, selectedPalette.colors);
    } else {
        medianCutQuantization(imageData, colorCount);
    }
    
    // Put processed image back
    processedImage = imageData;

    ctx.putImageData(imageData, 0, 0);

    const showGrid = document.getElementById('showGrid').checked;
    if (showGrid) {
        drawGrid(canvas);
    }

    // After processing is complete
    updateButtonStates();
}

const drawGrid = (canvas) => {
    const blockSize = parseInt(document.getElementById('blockSize').value) || 8;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // Semi-transparent black border
    ctx.lineWidth = 1;
    // Draw borders for each block
    for (let y = 0; y < canvas.height; y += blockSize) {
        for (let x = 0; x < canvas.width; x += blockSize) {
            ctx.strokeRect(x, y, blockSize, blockSize);
        }
    }
}

function saveImage() {
    if (!canvas || !processedImage) return;
    
    const link = document.createElement('a');
    link.download = `pixel-art.png`;
    
    // Use the processed image data instead of the canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = processedImage.width;
    tempCanvas.height = processedImage.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(processedImage, 0, 0);

    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}

function printImage() {
    if (!canvas || !processedImage) return;
    
    // Create a temporary canvas for printing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = processedImage.width;
    tempCanvas.height = processedImage.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(processedImage, 0, 0);
    
    // Check if grid is enabled and draw it on the print canvas
    const showGrid = document.getElementById('showGrid').checked;
    if (showGrid) {
        const blockSize = parseInt(document.getElementById('blockSize').value) || 8;
        tempCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)'; // Slightly darker for printing
        tempCtx.lineWidth = 1;
        
        // Draw grid lines
        for (let y = 0; y < tempCanvas.height; y += blockSize) {
            for (let x = 0; x < tempCanvas.width; x += blockSize) {
                tempCtx.strokeRect(x, y, blockSize, blockSize);
            }
        }
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Pixel Art</title>
            <style>
                @page {
                    size: A4;
                    margin: 0.5cm;
                }
                body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: #f0f0f0;
                }
                img {
                    max-width: 100%;
                    max-height: 100%;
                    border: 1px solid #ccc;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    image-rendering: pixelated;
                    image-rendering: -moz-crisp-edges;
                    image-rendering: crisp-edges;
                    object-fit: contain;
                }
                @media print {
                    @page {
                        size: A4;
                        margin: 0.5cm;
                    }
                    body {
                        background: white;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
                    img {
                        width: 100%;
                        height: 100%;
                        max-width: 100%;
                        max-height: 100%;
                        border: none;
                        box-shadow: none;
                        object-fit: contain;
                        image-rendering: pixelated;
                        image-rendering: -moz-crisp-edges;
                        image-rendering: crisp-edges;
                    }
                }
            </style>
        </head>
        <body>
            <img src="${tempCanvas.toDataURL('image/png')}" alt="Pixel Art">
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Wait for the image to load, then print
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 100);
    };
}

// WeChat QR code mobile support
function initWeChatQR() {
    const wechatContainer = document.querySelector('.wechat-container');
    const wechatTooltip = document.querySelector('.wechat-tooltip');
    
    if (!wechatContainer || !wechatTooltip) return;
    
    // 检测是否为触摸设备
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
        // 手机端点击切换显示
        wechatContainer.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            wechatTooltip.classList.toggle('show');
        });
        
        // 点击外部区域关闭
        document.addEventListener('click', function(e) {
            if (!wechatContainer.contains(e.target)) {
                wechatTooltip.classList.remove('show');
            }
        });
        
        // 防止二维码区域点击事件冒泡
        wechatTooltip.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

function initApp() {
    initWeChatQR();
    // Start loading palettes in background
    loadAllPalettes().then(() => {
        palettesLoaded = true;
        // If modal was opened before palettes loaded, render it now.
        const modal = document.getElementById('paletteModal');
        if (modal && modal.style.display === 'flex') {
            renderPaletteList();
        }
    });
}

// 页面加载完成后初始化微信二维码功能
document.addEventListener('DOMContentLoaded', initApp);