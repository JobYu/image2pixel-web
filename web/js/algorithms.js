/**
 * image2pixel - Advanced Algorithms
 * Implements CIELAB color distance, Floyd-Steinberg dithering,
 * and a Tezumie-inspired dithering pipeline.
 */

// ============================================================
// CIELAB Color Conversion Utilities
// ============================================================

function srgbToLinear(c) {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToLab(r, g, b) {
    const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
    let X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
    let Y = R * 0.2126729 + G * 0.7151522 + B * 0.0721750;
    let Z = R * 0.0193339 + G * 0.1191920 + B * 0.9503041;
    X /= 0.95047; Y /= 1.00000; Z /= 1.08883;
    const f = v => v > 0.008856 ? Math.cbrt(v) : (7.787037 * v + 16 / 116);
    const L = 116 * f(Y) - 16;
    const a = 500 * (f(X) - f(Y));
    const bv = 200 * (f(Y) - f(Z));
    return [L, a, bv];
}

function labDistanceSq(lab1, lab2) {
    return (lab1[0] - lab2[0]) ** 2 + (lab1[1] - lab2[1]) ** 2 + (lab1[2] - lab2[2]) ** 2;
}

function buildLabPalette(palette) {
    return palette.map(c => ({ rgb: c, lab: rgbToLab(c[0], c[1], c[2]) }));
}

function nearestLabColor(r, g, b, labPalette) {
    const srcLab = rgbToLab(r, g, b);
    let minD = Infinity, best = labPalette[0];
    for (const entry of labPalette) {
        const d = labDistanceSq(srcLab, entry.lab);
        if (d < minD) { minD = d; best = entry; }
    }
    return best.rgb;
}

// ============================================================
// Palette Generation (returns palette without modifying imageData)
// ============================================================

function medianCutGetPalette(imageData, colorCount) {
    const pixels = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
        pixels.push([imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]]);
    }

    class ColorBox {
        constructor(px) {
            this.pixels = px;
            let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
            for (const [r, g, b] of px) {
                if (r < minR) minR = r; if (r > maxR) maxR = r;
                if (g < minG) minG = g; if (g > maxG) maxG = g;
                if (b < minB) minB = b; if (b > maxB) maxB = b;
            }
            const rRange = maxR - minR, gRange = maxG - minG, bRange = maxB - minB;
            this.largestRange = Math.max(rRange, gRange, bRange);
            this.splitChannel = rRange >= gRange && rRange >= bRange ? 0 : gRange >= bRange ? 1 : 2;
        }
        getAvg() {
            const n = this.pixels.length;
            let r = 0, g = 0, b = 0;
            for (const p of this.pixels) { r += p[0]; g += p[1]; b += p[2]; }
            return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
        }
        split() {
            if (this.pixels.length < 2) return null;
            const ch = this.splitChannel;
            this.pixels.sort((a, b) => a[ch] - b[ch]);
            const mid = Math.floor(this.pixels.length / 2);
            return [new ColorBox(this.pixels.slice(0, mid)), new ColorBox(this.pixels.slice(mid))];
        }
    }

    let boxes = [new ColorBox(pixels)];
    while (boxes.length < colorCount) {
        let idx = 0;
        for (let i = 1; i < boxes.length; i++) {
            if (boxes[i].largestRange > boxes[idx].largestRange) idx = i;
        }
        const boxToSplit = boxes[idx];
        const newBoxes = boxToSplit.split();
        if (!newBoxes) break;
        boxes.splice(idx, 1, ...newBoxes);
    }
    return boxes.map(b => b.getAvg());
}

// ============================================================
// Block Grid Operations
// ============================================================

function extractBlockGridAverage(imageData, blockSize) {
    const { width, height } = imageData;
    const d = imageData.data;
    const cols = Math.ceil(width / blockSize);
    const rows = Math.ceil(height / blockSize);
    const grid = [];

    for (let row = 0; row < rows; row++) {
        grid[row] = [];
        for (let col = 0; col < cols; col++) {
            const x0 = col * blockSize, y0 = row * blockSize;
            let r = 0, g = 0, b = 0, count = 0;
            for (let dy = 0; dy < blockSize && y0 + dy < height; dy++) {
                for (let dx = 0; dx < blockSize && x0 + dx < width; dx++) {
                    const idx = ((y0 + dy) * width + (x0 + dx)) * 4;
                    r += d[idx]; g += d[idx + 1]; b += d[idx + 2];
                    count++;
                }
            }
            grid[row][col] = [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
        }
    }
    return { grid, cols, rows };
}

function extractBlockGridNearest(imageData, blockSize) {
    const { width, height } = imageData;
    const d = imageData.data;
    const cols = Math.ceil(width / blockSize);
    const rows = Math.ceil(height / blockSize);
    const grid = [];

    for (let row = 0; row < rows; row++) {
        grid[row] = [];
        for (let col = 0; col < cols; col++) {
            const x0 = col * blockSize, y0 = row * blockSize;
            const cx = Math.min(x0 + Math.floor(blockSize / 2), width - 1);
            const cy = Math.min(y0 + Math.floor(blockSize / 2), height - 1);
            const idx = (cy * width + cx) * 4;
            grid[row][col] = [d[idx], d[idx + 1], d[idx + 2]];
        }
    }
    return { grid, cols, rows };
}

function paintBlockGrid(grid, rows, cols, imageData, blockSize) {
    const { width, height } = imageData;
    const d = imageData.data;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const [r, g, b] = grid[row][col];
            const x0 = col * blockSize, y0 = row * blockSize;
            for (let dy = 0; dy < blockSize && y0 + dy < height; dy++) {
                for (let dx = 0; dx < blockSize && x0 + dx < width; dx++) {
                    const idx = ((y0 + dy) * width + (x0 + dx)) * 4;
                    d[idx] = r; d[idx + 1] = g; d[idx + 2] = b;
                }
            }
        }
    }
}

// ============================================================
// Floyd-Steinberg Dithering on Block Grid
// ============================================================

function floydSteinbergDither(grid, rows, cols, labPalette) {
    const err = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => [0.0, 0.0, 0.0])
    );

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const [or, og, ob] = grid[row][col];
            const [er, eg, eb] = err[row][col];
            const nr = Math.max(0, Math.min(255, or + er));
            const ng = Math.max(0, Math.min(255, og + eg));
            const nb = Math.max(0, Math.min(255, ob + eb));

            const best = nearestLabColor(nr, ng, nb, labPalette);
            grid[row][col] = best;

            const dr = nr - best[0];
            const dg = ng - best[1];
            const db = nb - best[2];

            if (col + 1 < cols) {
                err[row][col + 1][0] += dr * 7 / 16;
                err[row][col + 1][1] += dg * 7 / 16;
                err[row][col + 1][2] += db * 7 / 16;
            }
            if (row + 1 < rows && col - 1 >= 0) {
                err[row + 1][col - 1][0] += dr * 3 / 16;
                err[row + 1][col - 1][1] += dg * 3 / 16;
                err[row + 1][col - 1][2] += db * 3 / 16;
            }
            if (row + 1 < rows) {
                err[row + 1][col][0] += dr * 5 / 16;
                err[row + 1][col][1] += dg * 5 / 16;
                err[row + 1][col][2] += db * 5 / 16;
            }
            if (row + 1 < rows && col + 1 < cols) {
                err[row + 1][col + 1][0] += dr * 1 / 16;
                err[row + 1][col + 1][1] += dg * 1 / 16;
                err[row + 1][col + 1][2] += db * 1 / 16;
            }
        }
    }
}

// ============================================================
// Algorithm Entry Points (called from main.js)
// ============================================================

/**
 * Algorithm: LAB + Floyd-Steinberg Dithering
 * - Averages blocks (same as classic)
 * - Builds or receives palette
 * - Applies FS dithering at block level using LAB color distance
 */
function processWithLabDither(imageData, blockSize, palette) {
    const { grid, rows, cols } = extractBlockGridAverage(imageData, blockSize);
    const labPalette = buildLabPalette(palette);
    floydSteinbergDither(grid, rows, cols, labPalette);
    paintBlockGrid(grid, rows, cols, imageData, blockSize);
}

/**
 * Algorithm: Tezumie Style
 * - Nearest-neighbor center-pixel sampling (preserves sharp edges)
 * - Builds or receives palette
 * - Applies FS dithering at block level using LAB color distance
 * Inspired by Tezumie/Image-to-Pixel: dithering as primary blending tool
 */
function processWithTezumie(imageData, blockSize, palette) {
    const { grid, rows, cols } = extractBlockGridNearest(imageData, blockSize);
    const labPalette = buildLabPalette(palette);
    floydSteinbergDither(grid, rows, cols, labPalette);
    paintBlockGrid(grid, rows, cols, imageData, blockSize);
}
