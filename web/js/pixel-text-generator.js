document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('textInput');
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');
    const showGridCheckbox = document.getElementById('showGrid');
    const saveButton = document.getElementById('saveButton');
    const printButton = document.getElementById('printButton');

    const fontSize = 32;
    const fontName = 'PixelFont';
    const gridColor = '#ccc';

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

        if (showGridCheckbox.checked) {
            drawGrid();
        }
    }

    function drawGrid() {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        for (let x = 0; x <= canvas.width; x++) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y <= canvas.height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    function saveImage() {
        const link = document.createElement('a');
        link.download = 'pixel-text-art.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function printImage() {
        const dataUrl = canvas.toDataURL('image/png');
        const windowContent = `<!DOCTYPE html>
            <html>
                <head><title>Print</title></head>
                <body><img src="${dataUrl}"></body>
            </html>`;
        const printWin = window.open('', '', 'width=800,height=600');
        printWin.document.open();
        printWin.document.write(windowContent);
        printWin.document.close();
        printWin.focus();
        printWin.print();
        printWin.close();
    }

    textInput.addEventListener('input', draw);
    showGridCheckbox.addEventListener('change', draw);
    saveButton.addEventListener('click', saveImage);
    printButton.addEventListener('click', printImage);

    // Initial draw
    // Use a small timeout to ensure the font is loaded
    setTimeout(draw, 100);
});
