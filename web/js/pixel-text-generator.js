document.addEventListener('DOMContentLoaded', async () => {
    const textInput = document.getElementById('textInput');
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');
    const saveButton = document.getElementById('saveButton');
    const printButton = document.getElementById('printButton');

    const fontSize = 32;
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
        const text = textInput.value || 'Hello World';
        
        // Measure text to set canvas size
        ctx.font = `${fontSize}px ${fontName}`;
        const metrics = ctx.measureText(text);
        const textWidth = Math.ceil(metrics.width);
        const textHeight = fontSize;
        
        // Add padding for centering
        const padding = 20;
        const canvasWidth = Math.max(textWidth + padding * 2, 200);
        const canvasHeight = Math.max(textHeight + padding * 2, 80);
        
        // Set canvas dimensions
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Also set CSS dimensions to match exactly (prevent scaling)
        canvas.style.width = canvasWidth + 'px';
        canvas.style.height = canvasHeight + 'px';

        // Clear canvas and set white background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set font properties for drawing
        ctx.font = `${fontSize}px ${fontName}`;
        ctx.fillStyle = '#000000';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        // Disable all forms of anti-aliasing and set additional properties
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.oImageSmoothingEnabled = false;
        
        // Additional canvas properties to ensure crisp rendering
        if (ctx.imageSmoothingQuality) {
            ctx.imageSmoothingQuality = 'low';
        }
        
        // Draw text centered
        const x = canvas.width / 2;
        const y = canvas.height / 2;
        ctx.fillText(text, x, y);

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
        const scaledCanvas = getScaledCanvas(15);
        const link = document.createElement('a');
        link.download = 'pixel-text-art.png';
        link.href = scaledCanvas.toDataURL('image/png');
        link.click();
    }

    function printImage() {
        const scaledCanvas = getScaledCanvas(15);
        const dataUrl = scaledCanvas.toDataURL('image/png');
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

    textInput.addEventListener('input', draw);
    saveButton.addEventListener('click', saveImage);
    printButton.addEventListener('click', printImage);

    // Initial draw after font is loaded
    draw();
});
