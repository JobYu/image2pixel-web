document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('textInput');
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');
    const saveButton = document.getElementById('saveButton');
    const printButton = document.getElementById('printButton');

    const fontSize = 32;
    const fontName = 'PixelFont';

    function draw() {
        const text = textInput.value;
        
        // Measure text to set canvas size
        ctx.font = `${fontSize}px ${fontName}`;
        const metrics = ctx.measureText(text);
        const textWidth = Math.ceil(metrics.width);
        const textHeight = fontSize; 
        
        canvas.width = textWidth > 0 ? textWidth : 200;
        canvas.height = textHeight + (fontSize / 2);

        // Clear canvas and set background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f9f9f9';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set font properties for drawing
        ctx.font = `${fontSize}px ${fontName}`;
        ctx.fillStyle = '#000';
        ctx.textBaseline = 'top';

        // Disable image smoothing to get sharp pixels
        ctx.imageSmoothingEnabled = false;
        
        // Draw text
        ctx.fillText(text, 0, 0);

    }

    function getScaledCanvas(scaleFactor) {
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = canvas.width * scaleFactor;
        scaledCanvas.height = canvas.height * scaleFactor;
        const scaledCtx = scaledCanvas.getContext('2d');
        scaledCtx.imageSmoothingEnabled = false;
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
                <head><title>Print</title></head>
                <body><img src="${dataUrl}" style="width: 100%;"></body>
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

    // Initial draw
    // Use document.fonts.ready to ensure the font is loaded
    document.fonts.ready.then(() => {
        draw();
    });
});
