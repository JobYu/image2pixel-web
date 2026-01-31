/**
 * image2pixel - Pixel Art Generator
 * Copyright (c) 2024 image2pixel.app. All Rights Reserved.
 */

let originalImage = null;
let processedImage = null;
let selectedPalette = null;
let allPalettes = [];
let palettesLoaded = false;

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
    if (palettesLoaded) renderPaletteList();
});

document.getElementById('closePaletteModal')?.addEventListener('click', () => {
    document.getElementById('paletteModal').style.display = 'none';
});

document.getElementById('paletteAutoButton')?.addEventListener('click', () => {
    selectedPalette = null;
    selectedPaletteLabel.textContent = '';
    document.getElementById('paletteModal').style.display = 'none';
    if (originalImage) processImage();
});

function renderPaletteList() {
    const list = document.getElementById('paletteList');
    if (!list) return;
    list.innerHTML = '';
    
    allPalettes.forEach(p => {
        const card = document.createElement('div');
        card.className = 'palette-card';
        card.onclick = () => {
            selectedPalette = { name: p.displayName || p.id, colors: p.colors };
            selectedPaletteLabel.textContent = `Palette: ${selectedPalette.name}`;
            document.getElementById('paletteModal').style.display = 'none';
            if (originalImage) processImage();
        };

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
        list.appendChild(card);
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
        quantizeToFixedPalette(imageData, selectedPalette.colors);
    } else {
        medianCutQuantization(imageData, colorCount);
    }
    
    processedImage = imageData;
    ctx.putImageData(imageData, 0, 0);

    if (document.getElementById('showGrid').checked) {
        drawGrid(canvas, blockSize);
    }

    resultInfo.textContent = `${width}x${height}`;
    updateButtonStates();
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

// Load Palettes
async function loadPalettes() {
    try {
        const [pRes, iRes] = await Promise.all([fetch('palette/palettes.json'), fetch('palette/palette-info.json')]);
        const palettes = await pRes.json();
        const info = await iRes.json();
        allPalettes = palettes.map(p => ({ ...p, info: info[p.id] || {} }));
        palettesLoaded = true;
    } catch (e) { console.error(e); }
}

loadPalettes();
