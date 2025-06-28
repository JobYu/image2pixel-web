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

const canvas = document.getElementById('resultCanvas');
const ctx = canvas.getContext('2d');
const saveButton = document.getElementById('saveButton');
const printButton = document.getElementById('printButton');

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
        Math.pow(color1[2] - color2[2], 2) +
        Math.pow(color1[3] - color2[3], 2)
    );
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

    // Apply median cut color quantization
    medianCutQuantization(imageData, colorCount);
    
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

// 页面加载完成后初始化微信二维码功能
document.addEventListener('DOMContentLoaded', initWeChatQR);