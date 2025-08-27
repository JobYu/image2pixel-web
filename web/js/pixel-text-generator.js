document.addEventListener('DOMContentLoaded', async () => {
    const textInput = document.getElementById('textInput');
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');
    const saveButton = document.getElementById('saveButton');
    const printButton = document.getElementById('printButton');
    const showGridCheckbox = document.getElementById('showGrid');

    const baseFontSize = 12; // Original 12x12 pixel font size
    const MAX_CHARS = 32; // Limit input to <= 32 characters
    const fontName = 'PixelFont';
    
    // Fixed preview area dimensions
    const PREVIEW_WIDTH = 800;
    const PREVIEW_HEIGHT = 400;
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
        
        // Calculate optimal scale factor based on text length and preview area
        let scaleFactor = 15; // Start with 1500% (15x)
        let fontSize = baseFontSize * scaleFactor;
        
        // Test font and measure text width
        ctx.font = `${fontSize}px ${fontName}`;
        let metrics = ctx.measureText(text);
        let textWidth = Math.ceil(metrics.width);
        
        // Reduce scale factor if text is too wide for preview area
        const maxTextWidth = PREVIEW_WIDTH * 0.8; // Use 80% of preview width
        while (textWidth > maxTextWidth && scaleFactor > 3) { // Minimum 3x scale
            scaleFactor--;
            fontSize = baseFontSize * scaleFactor;
            ctx.font = `${fontSize}px ${fontName}`;
            metrics = ctx.measureText(text);
            textWidth = Math.ceil(metrics.width);
        }
        
        // Set fixed canvas dimensions
        canvas.width = PREVIEW_WIDTH;
        canvas.height = PREVIEW_HEIGHT;
        
        // Set CSS dimensions to exact pixel values to prevent any browser scaling
        canvas.style.width = PREVIEW_WIDTH + 'px';
        canvas.style.height = PREVIEW_HEIGHT + 'px';
        canvas.style.minWidth = PREVIEW_WIDTH + 'px';
        canvas.style.minHeight = PREVIEW_HEIGHT + 'px';
        canvas.style.maxWidth = PREVIEW_WIDTH + 'px';
        canvas.style.maxHeight = PREVIEW_HEIGHT + 'px';
        canvas.style.imageRendering = 'pixelated';
        canvas.style.imageRendering = 'crisp-edges';
        canvas.style.flex = 'none';
        canvas.style.display = 'block';

        // Clear canvas and set white background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set font properties for drawing
        ctx.font = `${fontSize}px ${fontName}`;
        ctx.fillStyle = '#000000';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

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
        const pixelSize = scaleFactor; // Current scale factor per original pixel
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        
        // Align to nearest pixel grid position
        const x = Math.round(centerX / pixelSize) * pixelSize;
        const y = Math.round(centerY / pixelSize) * pixelSize;
        
        ctx.fillText(text, x, y);

        // Draw grid if enabled
        if (showGridCheckbox.checked) {
            drawGrid(scaleFactor);
        }

    }

    function drawGrid(currentScaleFactor) {
        // Each original pixel becomes scaleFactor px when scaled up
        const pixelSize = currentScaleFactor;
        
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

    function generateHighResCanvas(targetScale) {
        // Generate a high-resolution version of the text for saving/printing
        const text = textInput.value || 'Hello World';
        const fontSize = baseFontSize * targetScale;
        
        // Create new canvas for high-res version
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Measure text at target scale
        tempCtx.font = `${fontSize}px ${fontName}`;
        const metrics = tempCtx.measureText(text);
        const textWidth = Math.ceil(metrics.width);
        const textHeight = fontSize;
        
        // Set canvas size with padding
        const padding = fontSize * 0.5;
        tempCanvas.width = textWidth + padding * 2;
        tempCanvas.height = textHeight + padding * 2;
        
        // Set up rendering context
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        tempCtx.font = `${fontSize}px ${fontName}`;
        tempCtx.fillStyle = '#000000';
        tempCtx.textBaseline = 'middle';
        tempCtx.textAlign = 'center';
        
        // Disable anti-aliasing
        tempCtx.imageSmoothingEnabled = false;
        tempCtx.webkitImageSmoothingEnabled = false;
        tempCtx.mozImageSmoothingEnabled = false;
        tempCtx.msImageSmoothingEnabled = false;
        tempCtx.oImageSmoothingEnabled = false;
        
        // Draw text centered
        const x = tempCanvas.width / 2;
        const y = tempCanvas.height / 2;
        tempCtx.fillText(text, x, y);
        
        return tempCanvas;
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
        // Create a high-quality version at 15x scale for saving
        const highResCanvas = generateHighResCanvas(15);
        const link = document.createElement('a');
        link.download = 'pixel-text-art.png';
        link.href = highResCanvas.toDataURL('image/png');
        link.click();
    }

    function printImage() {
        // Create a high-quality version at 15x scale for printing
        const highResCanvas = generateHighResCanvas(15);
        const dataUrl = highResCanvas.toDataURL('image/png');
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
