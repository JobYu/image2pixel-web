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
    
    // Dynamic preview area dimensions based on screen size
    function getPreviewDimensions() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        if (screenWidth <= 480) {
            // 小手机
            return { width: Math.min(screenWidth - 40, 350), height: 200 };
        } else if (screenWidth <= 768) {
            // 大手机/平板
            return { width: Math.min(screenWidth - 60, 500), height: 280 };
        } else {
            // 桌面
            return { width: Math.min(screenWidth - 100, 800), height: 400 };
        }
    }
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
        
        // Get dynamic preview dimensions
        const dimensions = getPreviewDimensions();
        const PREVIEW_WIDTH = dimensions.width;
        const PREVIEW_HEIGHT = dimensions.height;
        
        // Start with preferred scale factor for best readability
        let scaleFactor = 15; // Start with 1500% (15x) for clarity
        let fontSize = baseFontSize * scaleFactor;
        let lines, lineHeight, totalTextHeight;
        
        // Try to fit text with current scale factor
        do {
            fontSize = baseFontSize * scaleFactor;
            ctx.font = `${fontSize}px ${fontName}`;
            
            // Calculate line wrapping
            const maxLineWidth = PREVIEW_WIDTH * 0.9; // Use 90% of preview width
            lines = wrapText(text, maxLineWidth, ctx);
            
            // Calculate required height for multiple lines
            lineHeight = fontSize * 1.2; // 120% line height
            totalTextHeight = lines.length * lineHeight;
            
            // Check if text fits in preview height (leave some padding)
            const maxAllowedHeight = PREVIEW_HEIGHT * 0.9;
            
            if (totalTextHeight <= maxAllowedHeight || scaleFactor <= 3) {
                // Text fits or we've reached minimum scale
                break;
            }
            
            // Reduce scale factor and try again
            scaleFactor--;
            
        } while (scaleFactor >= 3); // Minimum 3x scale for readability
        
        // Adjust canvas height based on text lines, but respect minimum height
        const minHeight = Math.min(PREVIEW_HEIGHT, 200);
        const requiredHeight = Math.max(totalTextHeight + 60, minHeight); // Add padding
        const canvasHeight = Math.min(requiredHeight, PREVIEW_HEIGHT * 1.5); // Max 1.5x original height
        
        // Set dynamic canvas dimensions
        canvas.width = PREVIEW_WIDTH;
        canvas.height = canvasHeight;
        
        // Set CSS dimensions to exact pixel values to prevent any browser scaling
        canvas.style.width = PREVIEW_WIDTH + 'px';
        canvas.style.height = canvasHeight + 'px';
        canvas.style.minWidth = PREVIEW_WIDTH + 'px';
        canvas.style.minHeight = canvasHeight + 'px';
        canvas.style.maxWidth = PREVIEW_WIDTH + 'px';
        canvas.style.maxHeight = canvasHeight + 'px';
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
        
        // Draw multiple lines of text centered and aligned to pixel grid
        const pixelSize = scaleFactor; // Current scale factor per original pixel
        const startY = Math.floor((canvas.height - totalTextHeight) / 2) + lineHeight / 2;
        
        // Draw each line
        lines.forEach((line, index) => {
            const centerX = Math.floor(canvas.width / 2);
            const lineY = startY + (index * lineHeight);
            
            // Align to nearest pixel grid position
            const x = Math.round(centerX / pixelSize) * pixelSize;
            const y = Math.round(lineY / pixelSize) * pixelSize;
            
            ctx.fillText(line, x, y);
        });

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

    function wrapText(text, maxWidth, context) {
        if (!text) return [''];
        
        const words = text.split('');
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
            const char = words[i];
            const testLine = currentLine + char;
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && currentLine.length > 0) {
                // Current line is full, start a new line
                lines.push(currentLine);
                currentLine = char;
            } else {
                // Add character to current line
                currentLine = testLine;
            }
        }
        
        // Add the last line if it's not empty
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [''];
    }

    function generateHighResCanvas(targetScale) {
        // Generate a high-resolution version of the text for saving/printing
        const text = textInput.value || 'Hello World';
        const fontSize = baseFontSize * targetScale;
        
        // Create new canvas for high-res version
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Set font and calculate wrapping for high-res version
        tempCtx.font = `${fontSize}px ${fontName}`;
        const maxWidth = 800 * (targetScale / 15); // Scale the max width proportionally
        const lines = wrapText(text, maxWidth, tempCtx);
        
        // Calculate dimensions for multiple lines
        const lineHeight = fontSize * 1.2;
        const totalTextHeight = lines.length * lineHeight;
        const maxLineWidth = Math.max(...lines.map(line => tempCtx.measureText(line).width));
        
        // Set canvas size with padding
        const padding = fontSize * 0.5;
        tempCanvas.width = maxLineWidth + padding * 2;
        tempCanvas.height = totalTextHeight + padding * 2;
        
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
        
        // Draw multiple lines centered
        const startY = padding + lineHeight / 2;
        const centerX = tempCanvas.width / 2;
        
        lines.forEach((line, index) => {
            const y = startY + (index * lineHeight);
            tempCtx.fillText(line, centerX, y);
        });
        
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
    
    // Add window resize listener for responsive canvas
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(draw, 150); // Debounce resize events
    });

    // Initial draw after font is loaded
    draw();
});
