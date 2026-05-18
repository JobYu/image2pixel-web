/**
 * image2pixel - Pixel Art Generator
 * Copyright (c) 2024 image2pixel.app. All Rights Reserved.
 */

let originalImage = null;
let processedImage = null;
let selectedPalette = null;
let isBlueprintMode = false;
let allPalettes = [];
let palettesLoaded = false;
const CUSTOM_PALETTES_KEY = 'image2pixel_custom_palettes';
let customPalettes = [];

const canvas = document.getElementById('resultCanvas');
const ctx = canvas.getContext('2d');
const saveButton = document.getElementById('saveButton');
const printButton = document.getElementById('printButton');
const paletteButton = document.getElementById('paletteButton');
const selectedPaletteLabel = document.getElementById('selectedPaletteLabel');
const originalInfo = document.getElementById('originalInfo');
const resultInfo = document.getElementById('resultInfo');

// UI Elements
const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
const menuClose = document.getElementById('menuClose');
const menuOverlay = document.getElementById('menuOverlay');

// Initialize
function updateButtonStates() {
    const hasImage = processedImage !== null;
    saveButton.disabled = !hasImage;
    printButton.disabled = !hasImage;
}

updateButtonStates();

// Menu Logic
function toggleMenu(show) {
    if (show) {
        sideMenu.classList.add('open');
        menuOverlay.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    } else {
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

menuToggle?.addEventListener('click', () => toggleMenu(true));
menuClose?.addEventListener('click', () => toggleMenu(false));
menuOverlay?.addEventListener('click', () => toggleMenu(false));

// Handle file input
const imageInputs = ['imageInput', 'imageInputMobile'];
imageInputs.forEach(id => {
    document.getElementById(id)?.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Clear previous state
        originalImage = null;
        processedImage = null;
        updateButtonStates();
        
        const container = document.getElementById('originalImageContainer');
        if (container) container.innerHTML = '<div class="loading">Processing...</div>';

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                originalImage = img;
                if (container) {
                    container.innerHTML = '';
                    img.id = 'originalImage';
                    container.appendChild(img);
                }
                
                // Update info tag
                if (originalInfo) originalInfo.textContent = `${img.width}x${img.height}`;
                
                processImage();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
});

// Sliders and Inputs
['blockSize', 'colorCount'].forEach(id => {
    const slider = document.getElementById(id);
    const input = document.getElementById(`${id}Input`);
    
    slider.addEventListener('input', function() {
        input.value = this.value;
        if (originalImage) processImage();
    });
    
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

// Palette Modal
paletteButton?.addEventListener('click', () => {
    const modal = document.getElementById('paletteModal');
    if (modal) modal.style.display = 'flex';
    renderPaletteList();
});

document.getElementById('closePaletteModal')?.addEventListener('click', () => {
    document.getElementById('paletteModal').style.display = 'none';
});

document.getElementById('paletteAutoButton')?.addEventListener('click', () => {
    selectedPalette = null;
    selectedPaletteLabel.textContent = '';
    document.getElementById('paletteModal').style.display = 'none';
    updateBlueprintCheckboxVisibility();
    if (originalImage) processImage();
});

document.getElementById('uploadPaletteButton')?.addEventListener('click', () => {
    document.getElementById('paletteFileInput').click();
});

document.getElementById('paletteFileInput')?.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const text = await file.text();
        const palette = parsePaletteFile(file.name, text);
        const existingIndex = customPalettes.findIndex(p => p.id === palette.id);
        if (existingIndex >= 0) {
            if (!confirm(`Palette "${palette.id}" already exists. Overwrite?`)) {
                e.target.value = '';
                return;
            }
            customPalettes[existingIndex] = palette;
        } else {
            customPalettes.push(palette);
        }
        saveCustomPalettes();
        renderPaletteList();
    } catch (err) {
        alert('Failed to parse palette file: ' + err.message);
    }
    e.target.value = '';
});

function renderPaletteList() {
    const list = document.getElementById('paletteList');
    if (!list) return;
    list.innerHTML = '';

    function createPaletteCard(p, isCustom) {
        const card = document.createElement('div');
        card.className = 'palette-card';
        card.onclick = () => {
            console.log('[palette click]', p.displayName || p.id, 'colors:', p.colors?.length);
            selectedPalette = { name: p.displayName || p.id, colors: p.colors, meta: p.meta || null };
            selectedPaletteLabel.textContent = `Palette: ${selectedPalette.name}`;
            document.getElementById('paletteModal').style.display = 'none';
            updateBlueprintCheckboxVisibility();
            if (originalImage) {
                console.log('[processImage] triggered with palette:', selectedPalette.name);
                processImage();
            } else {
                console.log('[processImage] skipped: no originalImage');
            }
        };

        if (isCustom) {
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'x';
            deleteBtn.title = 'Delete custom palette';
            deleteBtn.onclick = (ev) => {
                ev.stopPropagation();
                if (confirm(`Delete custom palette "${p.id}"?`)) {
                    deleteCustomPalette(p.id);
                }
            };
            card.appendChild(deleteBtn);
        }

        const title = document.createElement('div');
        title.innerHTML = `<strong>${p.displayName || p.id}</strong><br><small>${p.info?.author || ''}</small>`;

        const swatches = document.createElement('div');
        swatches.className = 'swatches';
        p.colors.slice(0, 32).forEach(c => {
            const s = document.createElement('div');
            s.className = 'swatch';
            s.style.background = `rgb(${c[0]},${c[1]},${c[2]})`;
            swatches.appendChild(s);
        });

        card.appendChild(title);
        card.appendChild(swatches);
        return card;
    }

    if (customPalettes.length > 0) {
        const customTitle = document.createElement('div');
        customTitle.className = 'palette-section-title';
        customTitle.textContent = 'Custom Palettes';
        list.appendChild(customTitle);

        customPalettes.forEach(p => {
            list.appendChild(createPaletteCard(p, true));
        });
    }

    const builtinTitle = document.createElement('div');
    builtinTitle.className = 'palette-section-title';
    builtinTitle.textContent = 'Built-in Palettes';
    list.appendChild(builtinTitle);

    allPalettes.forEach(p => {
        list.appendChild(createPaletteCard(p, false));
    });
}

// Core Image Processing
function processImage() {
    if (!originalImage) return;
    
    const blockSize = parseInt(document.getElementById('blockSize').value) || 6;
    const colorCount = parseInt(document.getElementById('colorCount').value) || 16;
    
    const { width, height } = calculateScaledDimensions(originalImage.width, originalImage.height);
    canvas.width = width;
    canvas.height = height;
    
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(originalImage, 0, 0, width, height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const backgroundColor = detectBackgroundColor(imageData);
    
    // Pixelate
    for (let y = 0; y < canvas.height; y += blockSize) {
        for (let x = 0; x < canvas.width; x += blockSize) {
            let r=0, g=0, b=0, a=0, count=0;
            for (let by=0; by<blockSize && y+by<canvas.height; by++) {
                for (let bx=0; bx<blockSize && x+bx<canvas.width; bx++) {
                    const idx = ((y+by)*canvas.width + (x+bx))*4;
                    r += data[idx]; g += data[idx+1]; b += data[idx+2]; a += data[idx+3];
                    count++;
                }
            }
            r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count); a=Math.round(a/count);
            for (let by=0; by<blockSize && y+by<canvas.height; by++) {
                for (let bx=0; bx<blockSize && x+bx<canvas.width; bx++) {
                    const idx = ((y+by)*canvas.width + (x+bx))*4;
                    data[idx]=r; data[idx+1]=g; data[idx+2]=b; data[idx+3]=a;
                }
            }
        }
    }
    
    removeAntiAliasing(imageData, backgroundColor);

    if (selectedPalette) {
        console.log('[quantize] using fixed palette:', selectedPalette.name, selectedPalette.colors.length, 'colors');
        quantizeToFixedPalette(imageData, selectedPalette.colors);
    } else {
        console.log('[quantize] using median cut, colorCount:', colorCount);
        medianCutQuantization(imageData, colorCount);
    }

    processedImage = imageData;
    ctx.putImageData(imageData, 0, 0);

    if (document.getElementById('showGrid').checked) {
        drawGrid(canvas, blockSize);
    }

    resultInfo.textContent = `${width}x${height}`;
    updateButtonStates();
    updateBlueprintCheckboxVisibility();
}

// Helper Functions
function calculateScaledDimensions(w, h) {
    const max = 800;
    let scale = 1;
    if (w > max || h > max) scale = max / Math.max(w, h);
    return { width: Math.floor(w * scale), height: Math.floor(h * scale) };
}

function detectBackgroundColor(imageData) {
    const d = imageData.data;
    const corners = [0, (imageData.width-1)*4, (imageData.height-1)*imageData.width*4, d.length-4];
    let r=0, g=0, b=0, a=0;
    corners.forEach(i => { r+=d[i]; g+=d[i+1]; b+=d[i+2]; a+=d[i+3]; });
    return [Math.round(r/4), Math.round(g/4), Math.round(b/4), Math.round(a/4)];
}

function removeAntiAliasing(imageData, bg, threshold = 30) {
    const d = imageData.data;
    for (let i=0; i<d.length; i+=4) {
        const dist = Math.sqrt((d[i]-bg[0])**2 + (d[i+1]-bg[1])**2 + (d[i+2]-bg[2])**2);
        if (dist < threshold) { d[i]=bg[0]; d[i+1]=bg[1]; d[i+2]=bg[2]; d[i+3]=bg[3]; }
    }
}

function quantizeToFixedPalette(imageData, palette) {
    const d = imageData.data;
    for (let i=0; i<d.length; i+=4) {
        let minD = Infinity, best = palette[0];
        for (const c of palette) {
            const dist = (d[i]-c[0])**2 + (d[i+1]-c[1])**2 + (d[i+2]-c[2])**2;
            if (dist < minD) { minD = dist; best = c; }
        }
        d[i]=best[0]; d[i+1]=best[1]; d[i+2]=best[2];
    }
}

function medianCutQuantization(imageData, colorCount) {
    // Simplified version for brevity, keeping the core logic from original
    const pixels = [];
    for (let i=0; i<imageData.data.length; i+=4) {
        pixels.push([imageData.data[i], imageData.data[i+1], imageData.data[i+2], imageData.data[i+3]]);
    }
    // ... (Median cut implementation would go here, reusing the logic from original main.js)
    // For now, let's keep the original median cut logic to ensure functionality
}

// Re-importing the Median Cut logic from original main.js to ensure it works
class ColorBox {
    constructor(pixels) {
        this.pixels = pixels;
        this.computeMinMax();
    }
    computeMinMax() {
        let min = [255,255,255,255], max = [0,0,0,0];
        for (const p of this.pixels) {
            for (let i=0; i<4; i++) {
                min[i] = Math.min(min[i], p[i]);
                max[i] = Math.max(max[i], p[i]);
            }
        }
        const ranges = max.map((v, i) => v - min[i]);
        this.largestRange = Math.max(...ranges);
        this.splitChannel = ranges.indexOf(this.largestRange);
    }
    getAverageColor() {
        const sum = this.pixels.reduce((a, b) => a.map((v, i) => v + b[i]), [0,0,0,0]);
        return sum.map(v => Math.round(v / this.pixels.length));
    }
    split() {
        if (this.pixels.length < 2) return null;
        this.pixels.sort((a, b) => a[this.splitChannel] - b[this.splitChannel]);
        const mid = Math.floor(this.pixels.length / 2);
        return [new ColorBox(this.pixels.slice(0, mid)), new ColorBox(this.pixels.slice(mid))];
    }
}

function medianCutQuantization(imageData, colorCount) {
    const pixels = [];
    for (let i=0; i<imageData.data.length; i+=4) {
        pixels.push([imageData.data[i], imageData.data[i+1], imageData.data[i+2], imageData.data[i+3]]);
    }
    let boxes = [new ColorBox(pixels)];
    while (boxes.length < colorCount) {
        let boxToSplit = boxes.reduce((a, b) => a.largestRange > b.largestRange ? a : b);
        boxes = boxes.filter(b => b !== boxToSplit);
        const newBoxes = boxToSplit.split();
        if (newBoxes) boxes.push(...newBoxes); else { boxes.push(boxToSplit); break; }
    }
    const palette = boxes.map(b => b.getAverageColor());
    quantizeToFixedPalette(imageData, palette);
}

function drawGrid(canvas, blockSize) {
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    for (let x=0; x<=canvas.width; x+=blockSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y=0; y<=canvas.height; y+=blockSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
}

function saveImage() {
    if (!processedImage) return;

    if (isBlueprintMode && selectedPalette && selectedPalette.meta && selectedPalette.meta.codeMap) {
        const blockSize = parseInt(document.getElementById('blockSize').value) || 6;
        const grid = extract1x1Grid(processedImage, blockSize);
        const patternCanvas = renderBeadPattern(grid, selectedPalette.meta);
        if (!patternCanvas) {
            alert('Failed to generate bead pattern');
            return;
        }
        const link = document.createElement('a');
        link.download = `bead-pattern-${selectedPalette.meta.brand || 'unknown'}.png`;
        link.href = patternCanvas.toDataURL();
        link.click();
        return;
    }

    const temp = document.createElement('canvas');
    temp.width = processedImage.width; temp.height = processedImage.height;
    temp.getContext('2d').putImageData(processedImage, 0, 0);
    const link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = temp.toDataURL();
    link.click();
}

function printImage() {
    if (!processedImage) return;
    const win = window.open();
    const temp = document.createElement('canvas');
    temp.width = processedImage.width; temp.height = processedImage.height;
    temp.getContext('2d').putImageData(processedImage, 0, 0);
    win.document.write(`<img src="${temp.toDataURL()}" style="width:100%; image-rendering:pixelated;">`);
    win.document.close();
    win.print();
}

async function loadPalettes() {
    try {
        const [pRes, iRes] = await Promise.all([fetch('palette/palettes.json'), fetch('palette/palette-info.json')]);
        const palettes = await pRes.json();
        const info = await iRes.json();

        // Map info and sort: wplace first, then others alphabetically
        allPalettes = palettes.map(p => ({ ...p, info: info[p.id] || {} }));
        allPalettes.sort((a, b) => {
            if (a.id === 'wplace') return -1;
            if (b.id === 'wplace') return 1;
            return (a.displayName || a.id).localeCompare(b.displayName || b.id);
        });

        // Load bead palettes
        try {
            const beadPkgRes = await fetch('palette/bead-palettes/package.json');
            if (beadPkgRes.ok) {
                const beadPkg = await beadPkgRes.json();
                if (beadPkg.contributes && beadPkg.contributes.palettes) {
                    const beadPalettes = [];
                    for (const bp of beadPkg.contributes.palettes) {
                        try {
                            const res = await fetch(`palette/bead-palettes/${bp.path.replace('./', '')}`);
                            if (res.ok) {
                                const data = await res.json();
                                beadPalettes.push({
                                    id: bp.id,
                                    displayName: bp.id,
                                    colors: data.colors,
                                    meta: data.meta || null,
                                    info: { author: data.meta?.brand || '', description: 'Fuse Bead Palette' },
                                });
                            }
                        } catch (e) {
                            console.warn(`Failed to load bead palette: ${bp.id}`, e);
                        }
                    }
                    allPalettes = [...beadPalettes, ...allPalettes];
                }
            }
        } catch (e) {
            console.warn('Failed to load bead palette package', e);
        }

        palettesLoaded = true;
    } catch (e) { console.error(e); }
    loadCustomPalettes();
}

loadPalettes();

// Custom Palette Persistence
function loadCustomPalettes() {
    try {
        const stored = localStorage.getItem(CUSTOM_PALETTES_KEY);
        if (stored) {
            customPalettes = JSON.parse(stored);
        }
    } catch (e) {
        customPalettes = [];
    }
}

function saveCustomPalettes() {
    try {
        localStorage.setItem(CUSTOM_PALETTES_KEY, JSON.stringify(customPalettes));
    } catch (e) {
        console.error('Failed to save custom palettes:', e);
    }
}

function deleteCustomPalette(id) {
    customPalettes = customPalettes.filter(p => p.id !== id);
    saveCustomPalettes();
    renderPaletteList();
}

// Palette File Parsers
function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length !== 6) return null;
    const n = parseInt(hex, 16);
    if (isNaN(n)) return null;
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function parseGplPalette(text, name) {
    const lines = text.split(/\r?\n/);
    const colors = [];
    const meta = { brand: null, codeMap: {} };
    let lastColorKey = null;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('# META:')) {
            const content = trimmed.substring(7).trim();
            const eqIndex = content.indexOf('=');
            if (eqIndex > 0) {
                const key = content.substring(0, eqIndex).trim();
                const value = content.substring(eqIndex + 1).trim();
                if (key === 'brand') meta.brand = value;
            }
            continue;
        }

        if (trimmed.startsWith('# CODE:')) {
            const code = trimmed.substring(7).trim();
            if (lastColorKey) meta.codeMap[lastColorKey] = code;
            continue;
        }

        if (!trimmed || trimmed.startsWith('#') || trimmed.toLowerCase().startsWith('gimp palette') || trimmed.toLowerCase().startsWith('name:') || trimmed.toLowerCase().startsWith('columns:')) continue;

        const parts = trimmed.split(/\s+/);
        if (parts.length >= 3) {
            const r = Math.min(255, Math.max(0, parseInt(parts[0], 10) || 0));
            const g = Math.min(255, Math.max(0, parseInt(parts[1], 10) || 0));
            const b = Math.min(255, Math.max(0, parseInt(parts[2], 10) || 0));
            colors.push([r, g, b]);
            lastColorKey = `${r},${g},${b}`;
        }
    }
    if (colors.length < 2) throw new Error('Palette must contain at least 2 colors');

    const hasMeta = meta.brand || Object.keys(meta.codeMap).length > 0;
    return {
        id: name.replace(/\.[^.]+$/, ''),
        displayName: name.replace(/\.[^.]+$/, ''),
        colors,
        ...(hasMeta ? { meta } : {}),
    };
}

function parseJsonPalette(text, name) {
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error('Invalid JSON format');
    }

    let colors = [];
    let paletteName = name.replace(/\.[^.]+$/, '');

    // Array of palette objects: [{id, colors}, ...]
    if (Array.isArray(data) && data[0] && Array.isArray(data[0].colors)) {
        data = data[0];
    }

    // Single palette object
    if (data.id) paletteName = data.id;
    if (data.name) paletteName = data.name;
    if (data.displayName) paletteName = data.displayName;

    if (Array.isArray(data.colors)) {
        const first = data.colors[0];
        if (Array.isArray(first) && first.length >= 3) {
            colors = data.colors.map(c => [
                Math.min(255, Math.max(0, parseInt(c[0]) || 0)),
                Math.min(255, Math.max(0, parseInt(c[1]) || 0)),
                Math.min(255, Math.max(0, parseInt(c[2]) || 0)),
            ]);
        } else if (typeof first === 'string') {
            for (const hex of data.colors) {
                const rgb = hexToRgb(hex);
                if (rgb) colors.push(rgb);
            }
        } else if (first && typeof first === 'object') {
            colors = data.colors.map(c => [
                Math.min(255, Math.max(0, parseInt(c.r ?? c.red ?? c[0]) || 0)),
                Math.min(255, Math.max(0, parseInt(c.g ?? c.green ?? c[1]) || 0)),
                Math.min(255, Math.max(0, parseInt(c.b ?? c.blue ?? c[2]) || 0)),
            ]);
        }
    } else if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        if (Array.isArray(first) && first.length >= 3) {
            colors = data.map(c => [
                Math.min(255, Math.max(0, parseInt(c[0]) || 0)),
                Math.min(255, Math.max(0, parseInt(c[1]) || 0)),
                Math.min(255, Math.max(0, parseInt(c[2]) || 0)),
            ]);
        } else if (typeof first === 'string') {
            for (const hex of data) {
                const rgb = hexToRgb(hex);
                if (rgb) colors.push(rgb);
            }
        }
    }

    if (colors.length < 2) throw new Error('Palette must contain at least 2 colors');
    return { id: paletteName, displayName: paletteName, colors, ...(data.meta ? { meta: data.meta } : {}) };
}

function parseHexPalette(text, name) {
    const lines = text.split(/\r?\n/);
    const colors = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') && trimmed.length <= 1) continue;
        const rgb = hexToRgb(trimmed);
        if (rgb) colors.push(rgb);
    }
    if (colors.length < 2) throw new Error('Palette must contain at least 2 colors');
    return { id: name.replace(/\.[^.]+$/, ''), displayName: name.replace(/\.[^.]+$/, ''), colors };
}

function parseTxtPalette(text, name) {
    const lines = text.split(/\r?\n/);
    const colors = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') && trimmed.length <= 1) continue;

        // Try hex
        const rgb = hexToRgb(trimmed);
        if (rgb) {
            colors.push(rgb);
            continue;
        }

        // Try rgb(R, G, B)
        const rgbMatch = trimmed.match(/rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i);
        if (rgbMatch) {
            colors.push([
                Math.min(255, Math.max(0, parseInt(rgbMatch[1]))),
                Math.min(255, Math.max(0, parseInt(rgbMatch[2]))),
                Math.min(255, Math.max(0, parseInt(rgbMatch[3]))),
            ]);
            continue;
        }

        // Try R, G, B (comma-separated)
        const parts = trimmed.split(',').map(s => s.trim());
        if (parts.length >= 3) {
            const r = Math.min(255, Math.max(0, parseInt(parts[0], 10) || 0));
            const g = Math.min(255, Math.max(0, parseInt(parts[1], 10) || 0));
            const b = Math.min(255, Math.max(0, parseInt(parts[2], 10) || 0));
            colors.push([r, g, b]);
        }
    }
    if (colors.length < 2) throw new Error('Palette must contain at least 2 colors');
    return { id: name.replace(/\.[^.]+$/, ''), displayName: name.replace(/\.[^.]+$/, ''), colors };
}

function parsePaletteFile(filename, text) {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
        case 'gpl': return parseGplPalette(text, filename);
        case 'json': return parseJsonPalette(text, filename);
        case 'hex': return parseHexPalette(text, filename);
        case 'txt': return parseTxtPalette(text, filename);
        default: throw new Error(`Unsupported file format: .${ext}`);
    }
}

// --- Bead Blueprint Functions ---

const MIN_CELL_SIZE = 44;
const HEADER_HEIGHT = 32;

function updateBlueprintCheckboxVisibility() {
    const toggle = document.getElementById('blueprintToggle');
    if (!toggle) return;

    const hasCodeMap = selectedPalette && selectedPalette.meta && selectedPalette.meta.codeMap && Object.keys(selectedPalette.meta.codeMap).length > 0;
    const show = hasCodeMap && processedImage !== null;

    toggle.style.display = show ? 'inline-flex' : 'none';
    if (!hasCodeMap) {
        const cb = document.getElementById('blueprintCheckbox');
        if (cb) cb.checked = false;
        isBlueprintMode = false;
    }
}

document.getElementById('blueprintCheckbox')?.addEventListener('change', function() {
    isBlueprintMode = this.checked;
});

function extractShortCode(fullCode) {
    if (!fullCode) return '';
    // Extract numeric part after letter prefix (P01→1, H01→1, S199→199)
    const match = fullCode.match(/([A-Za-z]*)(\d+)/);
    if (match) {
        return String(parseInt(match[2], 10));
    }
    return fullCode;
}

function getContrastColor(r, g, b) {
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 150 ? '#000000' : '#FFFFFF';
}

function extract1x1Grid(imageData, blockSize) {
    const src = imageData.data;
    const w = imageData.width;
    const h = imageData.height;
    const gridW = Math.ceil(w / blockSize);
    const gridH = Math.ceil(h / blockSize);

    const result = new ImageData(gridW, gridH);
    for (let gy = 0; gy < gridH; gy++) {
        for (let gx = 0; gx < gridW; gx++) {
            const srcX = Math.min(gx * blockSize + Math.floor(blockSize / 2), w - 1);
            const srcY = Math.min(gy * blockSize + Math.floor(blockSize / 2), h - 1);
            const srcIdx = (srcY * w + srcX) * 4;

            const dstIdx = (gy * gridW + gx) * 4;
            result.data[dstIdx] = src[srcIdx];
            result.data[dstIdx + 1] = src[srcIdx + 1];
            result.data[dstIdx + 2] = src[srcIdx + 2];
            result.data[dstIdx + 3] = 255;
        }
    }
    return result;
}

function renderBeadPattern(gridImageData, paletteMeta) {
    if (!gridImageData || !paletteMeta || !paletteMeta.codeMap) return null;

    const { width: gridW, height: gridH } = gridImageData;
    const data = gridImageData.data;
    const cellSize = MIN_CELL_SIZE;

    // Font size: 3-digit number width must not exceed 12px
    const fontSize = 7;

    const canvasW = gridW * cellSize;
    const canvasH = gridH * cellSize + HEADER_HEIGHT;

    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = canvasW;
    patternCanvas.height = canvasH;
    const pCtx = patternCanvas.getContext('2d');

    // Draw brand header
    pCtx.fillStyle = '#f5f5f5';
    pCtx.fillRect(0, 0, canvasW, HEADER_HEIGHT);
    pCtx.fillStyle = '#333333';
    pCtx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    pCtx.textAlign = 'left';
    pCtx.textBaseline = 'middle';
    pCtx.fillText(`${paletteMeta.brand || 'Bead'} Pattern`, 12, HEADER_HEIGHT / 2);

    // Build fast lookup: color key → { r, g, b, fullCode }
    const colorEntries = [];
    for (const [key, fullCode] of Object.entries(paletteMeta.codeMap)) {
        const [r, g, b] = key.split(',').map(Number);
        colorEntries.push({ r, g, b, key, fullCode });
    }

    // Nearest-color lookup with cache
    const codeCache = new Map();
    function findCode(r, g, b) {
        const key = `${r},${g},${b}`;
        if (codeCache.has(key)) return codeCache.get(key);

        let minDist = Infinity;
        let bestCode = null;
        for (const entry of colorEntries) {
            const dr = r - entry.r;
            const dg = g - entry.g;
            const db = b - entry.b;
            const dist = dr * dr + dg * dg + db * db;
            if (dist < minDist) {
                minDist = dist;
                bestCode = entry.fullCode;
            }
        }
        codeCache.set(key, bestCode);
        return bestCode;
    }

    // Draw grid cells
    const fontStr = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
            const idx = (y * gridW + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const px = x * cellSize;
            const py = y * cellSize + HEADER_HEIGHT;

            // 1. Fill background color (snap to nearest palette color)
            const fullCode = findCode(r, g, b);
            if (fullCode) {
                const snapKey = Object.entries(paletteMeta.codeMap).find(([, v]) => v === fullCode)?.[0];
                if (snapKey) {
                    const [sr, sg, sb] = snapKey.split(',').map(Number);
                    pCtx.fillStyle = `rgb(${sr},${sg},${sb})`;
                } else {
                    pCtx.fillStyle = `rgb(${r},${g},${b})`;
                }
            } else {
                pCtx.fillStyle = `rgb(${r},${g},${b})`;
            }
            pCtx.fillRect(px, py, cellSize, cellSize);

            // 2. Draw code number
            if (fullCode) {
                const code = extractShortCode(fullCode);
                // Use snapped color for contrast calculation
                const snapKey = Object.entries(paletteMeta.codeMap).find(([, v]) => v === fullCode)?.[0];
                const [cr, cg, cb] = snapKey ? snapKey.split(',').map(Number) : [r, g, b];
                pCtx.fillStyle = getContrastColor(cr, cg, cb);
                pCtx.font = fontStr;
                pCtx.textAlign = 'center';
                pCtx.textBaseline = 'middle';
                pCtx.fillText(code, px + cellSize / 2, py + cellSize / 2);
            }

            // 3. Draw grid border
            pCtx.strokeStyle = 'rgba(0,0,0,0.2)';
            pCtx.lineWidth = 1;
            pCtx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
        }
    }

    return patternCanvas;
}
