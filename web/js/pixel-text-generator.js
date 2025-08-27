document.addEventListener('DOMContentLoaded', async () => {
    const textInput = document.getElementById('textInput');
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');
    const saveButton = document.getElementById('saveButton');
    const printButton = document.getElementById('printButton');
    const showGridCheckbox = document.getElementById('showGrid');

    const baseFontSize = 12; // Original 12x12 pixel font size
    const scaleFactor = 15; // 1500% scale
    const fontSize = baseFontSize * scaleFactor; // 180px for preview
    const MAX_CHARS = 32; // Limit input to <= 32 characters
    const fontName = 'PixelFont';
    let fontLoaded = false;

    // Explicitly load the pixel font
    const pixelFont = new FontFace('PixelFont', 'url(Pixel32ChinesePixelFont-Book.woff)');
    try {
        await pixelFont.load();
        document.fonts.add(pixelFont);
        fontLoaded = true;
    } catch (error) {
        console.warn('Failed to load pixel font:', error);
        fontLoaded = false;
    }

    function draw() {
        const raw = textInput.value || 'Hello World';
        const text = (raw || '').slice(0, MAX_CHARS);
        if (raw !== text) {
            textInput.value = text;
        }
        
        // Ensure we have proper font loaded
        if (!fontLoaded) {
            ctx.font = `${fontSize}px Arial`; // Fallback
        } else {
            ctx.font = `${fontSize}px ${fontName}`;
        }
        
        // Measure text to set canvas size
        const metrics = ctx.measureText(text);
        const textWidth = Math.ceil(metrics.width);
        const textHeight = fontSize;
        
        // Calculate generous padding - ensure enough space for all characters
        const pixelSize = scaleFactor; // 15px per original pixel
        const minPadding = pixelSize * 20; // At least 20 pixels worth of padding (300px)
        const adaptivePadding = textWidth * 0.3; // 30% of text width as padding
        const padding = Math.max(minPadding, adaptivePadding);
        
        // Ensure canvas is wide enough with multiple safety factors
        const safeWidth = Math.max(
            textWidth + padding * 2,  // Basic calculation
            textWidth * 1.8,          // 80% extra space
            600                       // Minimum width
        );
        const canvasWidth = Math.ceil(safeWidth / pixelSize) * pixelSize; // Align to pixel grid
        const canvasHeight = Math.max(textHeight + padding * 2, 400);
        
        // Set canvas dimensions
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Set CSS dimensions to exact pixel values to prevent any browser scaling
        canvas.style.width = canvasWidth + 'px';
        canvas.style.height = canvasHeight + 'px';
        canvas.style.imageRendering = 'pixelated';
        canvas.style.imageRendering = 'crisp-edges';

        // Clear canvas and set white background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set font properties for drawing - reapply after canvas resize
        ctx.font = `${fontSize}px ${fontName}`;
        ctx.fillStyle = '#000000';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        
        // Re-measure text after setting font to ensure accuracy
        const finalMetrics = ctx.measureText(text);
        const finalTextWidth = Math.ceil(finalMetrics.width);
        
        // If the remeasured text is larger than our canvas, expand it with extra safety margin
        const requiredWidth = finalTextWidth * 2; // Double the text width for safety
        if (requiredWidth > canvas.width) {
            const newWidth = Math.ceil(requiredWidth / pixelSize) * pixelSize; // Align to pixel grid
            canvas.width = newWidth;
            canvas.style.width = newWidth + 'px';
            
            // Reapply all settings after canvas resize
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = `${fontSize}px ${fontName}`;
            ctx.fillStyle = '#000000';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
        }

        // Aggressively disable all forms of anti-aliasing
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.oImageSmoothingEnabled = false;
        
        // Set the lowest quality to ensure no smoothing
        if (ctx.imageSmoothingQuality) {
            ctx.imageSmoothingQuality = 'low';
        }
        
        // Additional properties to force pixel-perfect rendering
        ctx.textRenderingOptimization = 'optimizeSpeed';
        if (ctx.fontKerning) {
            ctx.fontKerning = 'none';
        }
        
        // Draw text centered and aligned to pixel grid
        const pixelSize = scaleFactor; // 15px per original pixel
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        
        // Align to nearest pixel grid position
        const x = Math.round(centerX / pixelSize) * pixelSize;
        const y = Math.round(centerY / pixelSize) * pixelSize;
        
        ctx.fillText(text, x, y);

        // Draw grid if enabled
        if (showGridCheckbox.checked) {
            drawGrid();
        }

    }

    function drawGrid() {
        // Each original pixel becomes 15px x 15px when scaled up (12px font * 15 scale / 12 pixels = 15px per pixel)
        const pixelSize = scaleFactor; // 15px per original pixel
        
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3; // Make grid semi-transparent
        
        // Draw vertical lines for each pixel
        for (let x = 0; x <= canvas.width; x += pixelSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal lines for each pixel
        for (let y = 0; y <= canvas.height; y += pixelSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1.0; // Reset alpha
    }

    function getScaledCanvas(scaleFactor) {
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = canvas.width * scaleFactor;
        scaledCanvas.height = canvas.height * scaleFactor;
        const scaledCtx = scaledCanvas.getContext('2d');
        
        // Disable all forms of anti-aliasing for scaling
        scaledCtx.imageSmoothingEnabled = false;
        scaledCtx.webkitImageSmoothingEnabled = false;
        scaledCtx.mozImageSmoothingEnabled = false;
        scaledCtx.msImageSmoothingEnabled = false;
        
        scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
        return scaledCanvas;
    }

    function saveImage() {
        // Canvas is already at 15x scale, so we use it directly for 1500% output
        const link = document.createElement('a');
        link.download = 'pixel-text-art.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function printImage() {
        // Canvas is already at 15x scale, so we use it directly for 1500% output
        const dataUrl = canvas.toDataURL('image/png');
        const windowContent = `<!DOCTYPE html>
            <html>
                <head>
                    <title>Print</title>
                    <style>
                        body { 
                            margin: 0; 
                            padding: 20px; 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            min-height: 100vh; 
                            box-sizing: border-box;
                        }
                        img { 
                            max-width: 100%; 
                            max-height: 100%; 
                            image-rendering: -moz-crisp-edges;
                            image-rendering: -webkit-crisp-edges;
                            image-rendering: pixelated;
                            image-rendering: crisp-edges;
                        }
                    </style>
                </head>
                <body><img src="${dataUrl}"></body>
            </html>`;
        const printWin = window.open('', '', 'width=800,height=600');
        printWin.document.open();
        printWin.document.write(windowContent);
        printWin.document.close();

        printWin.onload = () => {
            printWin.focus();
            printWin.print();
            printWin.close();
        };
    }

    // Enforce maxlength on the input element at DOM level too
    textInput.setAttribute('maxlength', String(MAX_CHARS));
    textInput.addEventListener('input', draw);
    showGridCheckbox.addEventListener('change', draw);
    saveButton.addEventListener('click', saveImage);
    printButton.addEventListener('click', printImage);

    // Initial draw after font is loaded
    draw();
});
