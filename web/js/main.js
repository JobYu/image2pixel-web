let originalImage = null;
let canvas = document.getElementById('resultCanvas');
let ctx = canvas.getContext('2d');

// Handle file input
document.getElementById('imageInput').addEventListener('change', async function(e) {
    // Clear memory
    originalImage = null;
    
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

// Add ColorBox class for median cut quantization
class ColorBox {
    constructor(pixels, level = 0) {
        this.pixels = pixels;
        this.level = level;
        this.computeMinMax();
    }

    computeMinMax() {
        let minR = 255, minG = 255, minB = 255;
        let maxR = 0, maxG = 0, maxB = 0;

        for (const pixel of this.pixels) {
            minR = Math.min(minR, pixel[0]);
            minG = Math.min(minG, pixel[1]);
            minB = Math.min(minB, pixel[2]);
            maxR = Math.max(maxR, pixel[0]);
            maxG = Math.max(maxG, pixel[1]);
            maxB = Math.max(maxB, pixel[2]);
        }

        this.minR = minR; this.minG = minG; this.minB = minB;
        this.maxR = maxR; this.maxG = maxG; this.maxB = maxB;
        
        const rangeR = maxR - minR;
        const rangeG = maxG - minG;
        const rangeB = maxB - minB;
        
        this.largestRange = Math.max(rangeR, rangeG, rangeB);
        this.splitChannel = rangeR === this.largestRange ? 0 : 
                          rangeG === this.largestRange ? 1 : 2;
    }

    getAverageColor() {
        let r = 0, g = 0, b = 0;
        for (const pixel of this.pixels) {
            r += pixel[0];
            g += pixel[1];
            b += pixel[2];
        }
        const count = this.pixels.length;
        return [
            Math.round(r / count),
            Math.round(g / count),
            Math.round(b / count)
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
            imageData.data[i + 2]
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
            imageData.data[i + 2]
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
    }
}

function colorDistance(color1, color2) {
    return Math.sqrt(
        Math.pow(color1[0] - color2[0], 2) +
        Math.pow(color1[1] - color2[1], 2) +
        Math.pow(color1[2] - color2[2], 2)
    );
}

// Process image function
function processImage() {
    if (!originalImage) return;
    
    const blockSize = parseInt(document.getElementById('blockSize').value) || 8;
    const colorCount = parseInt(document.getElementById('colorCount').value) || 16;
    
    // Set canvas size based on original image
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    
    // Draw original image
    ctx.drawImage(originalImage, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Create pixel blocks
    for (let y = 0; y < canvas.height; y += blockSize) {
        for (let x = 0; x < canvas.width; x += blockSize) {
            let r = 0, g = 0, b = 0, count = 0;
            
            // Calculate average color for block
            for (let by = 0; by < blockSize && y + by < canvas.height; by++) {
                for (let bx = 0; bx < blockSize && x + bx < canvas.width; bx++) {
                    const idx = ((y + by) * canvas.width + (x + bx)) * 4;
                    r += data[idx];
                    g += data[idx + 1];
                    b += data[idx + 2];
                    count++;
                }
            }
            
            // Calculate average
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            
            // Fill the block with average color
            for (let by = 0; by < blockSize && y + by < canvas.height; by++) {
                for (let bx = 0; bx < blockSize && x + bx < canvas.width; bx++) {
                    const idx = ((y + by) * canvas.width + (x + bx)) * 4;
                    data[idx] = r;
                    data[idx + 1] = g;
                    data[idx + 2] = b;
                    data[idx + 3] = 255;
                }
            }
        }
    }
    
    // Apply median cut color quantization
    medianCutQuantization(imageData, colorCount);
    
    // Put processed image back
    ctx.putImageData(imageData, 0, 0);
}

function saveImage() {
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
} 