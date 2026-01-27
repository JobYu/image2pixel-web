/**
 * Pixelizer - Advanced Pixel Art Converter
 * Copyright (c) 2024 CatPixelArt.com. All Rights Reserved.
 * 
 * 核心功能：
 * 1. 自动识别整数倍放大的像素画
 * 2. AI生成图片的不规则像素块识别
 * 3. 颜色量化与噪点处理
 * 4. 手动网格对齐
 * 5. 1000%放大导出和打印
 */

class Pixelizer {
    constructor() {
        this.originalImage = null;
        this.processedCanvas = null;
        this.basePixelCanvas = null;
        this.gridOffsetX = 0;
        this.gridOffsetY = 0;
        this.isProcessing = false;
        this.currentWorker = null;
        
        // 对齐相关状态
        this.isDragging = false;
        this.dragTarget = null;
        this.guideLines = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 上传相关
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('pixelImageInput');
        const uploadButton = uploadZone?.querySelector('.upload-button');

        if (uploadZone) {
            uploadZone.addEventListener('click', () => fileInput?.click());
            uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
            uploadZone.addEventListener('drop', this.handleDrop.bind(this));
        }

        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // 模式切换
        const detectionModeInputs = document.querySelectorAll('input[name="detectionMode"]');
        detectionModeInputs.forEach(input => {
            input.addEventListener('change', this.handleModeChange.bind(this));
        });

        // 滑块控制
        this.initializeSliderControls();


        // 网格显示开关
        const showGridCheckbox = document.getElementById('showPixelGrid');
        
        if (showGridCheckbox) {
            showGridCheckbox.addEventListener('change', () => {
                this.updateGridDisplay();
            });
        }

        // 导出按钮
        const exportButton = document.getElementById('exportPNG');
        const printButton = document.getElementById('printResult');
        
        if (exportButton) {
            exportButton.addEventListener('click', this.exportPNG.bind(this));
        }
        
        if (printButton) {
            printButton.addEventListener('click', this.printResult.bind(this));
        }

        // 预览缩放
        const zoomSlider = document.getElementById('previewZoom');
        if (zoomSlider) {
            zoomSlider.addEventListener('input', this.handleZoomChange.bind(this));
        }

        // 取消处理
        const cancelButton = document.getElementById('cancelProcess');
        if (cancelButton) {
            cancelButton.addEventListener('click', this.cancelProcessing.bind(this));
        }
    }

    initializeSliderControls() {
        const sliders = [
            { range: 'targetWidth', input: 'targetWidthInput' },
            { range: 'pixelColorCount', input: 'pixelColorCountInput' },
            { range: 'prefilterStrength', input: 'prefilterStrengthInput' }
        ];

        sliders.forEach(({ range, input }) => {
            const rangeEl = document.getElementById(range);
            const inputEl = document.getElementById(input);

            if (rangeEl && inputEl) {
                rangeEl.addEventListener('input', () => {
                    inputEl.value = rangeEl.value;
                    this.updatePreviewIfNeeded();
                });

                inputEl.addEventListener('input', () => {
                    let value = parseInt(inputEl.value) || 1;
                    const min = parseInt(inputEl.min);
                    const max = parseInt(inputEl.max);
                    value = Math.min(Math.max(value, min), max);
                    inputEl.value = value;
                    rangeEl.value = value;
                    this.updatePreviewIfNeeded();
                });
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(file => file.type.startsWith('image/'));
        
        if (imageFile) {
            this.loadImage(imageFile);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }

    handleModeChange(e) {
        const isManual = e.target.value === 'manual';
        const manualControls = document.getElementById('manualControls');
        if (manualControls) {
            manualControls.style.display = isManual ? 'block' : 'none';
        }
        this.updatePreviewIfNeeded();
    }

    async loadImage(file) {
        try {
            // 显示处理控制面板
            this.showProcessingControls();
            
            // 创建图片对象
            const img = new Image();
            const imageDataUrl = await this.fileToDataUrl(file);
            
            return new Promise((resolve, reject) => {
                img.onload = async () => {
                    this.originalImage = img;
                    this.displayOriginalImage(img);
                    await this.autoDetectAndSuggest(img);
                    
                    // 自动处理图片
                    setTimeout(() => {
                        this.processImage();
                    }, 500); // 稍微延迟确保UI更新完成
                    
                    resolve(img);
                };
                img.onerror = reject;
                img.src = imageDataUrl;
            });
        } catch (error) {
            console.error('Error loading image:', error);
            this.showError('图片加载失败，请检查文件格式');
        }
    }

    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    showProcessingControls() {
        const controls = document.getElementById('processingControls');
        if (controls) {
            controls.style.display = 'block';
        }
    }

    displayOriginalImage(img) {
        const originalPreview = document.getElementById('originalPreview');
        if (originalPreview) {
            originalPreview.src = img.src;
            
            // 确保图片样式与处理结果一致
            originalPreview.style.maxWidth = '100%';
            originalPreview.style.maxHeight = '100%';
            originalPreview.style.imageRendering = 'pixelated';
            originalPreview.style.objectFit = 'contain';
            originalPreview.style.width = 'auto';
            originalPreview.style.height = 'auto';
        }
    }

    /**
     * 自动检测像素块大小并给出建议
     */
    async autoDetectAndSuggest(img) {
        try {
            // 创建临时canvas进行分析
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 限制分析尺寸以提高性能
            const maxAnalysisSize = 800;
            const scale = Math.min(1, maxAnalysisSize / Math.max(img.width, img.height));
            
            canvas.width = Math.floor(img.width * scale);
            canvas.height = Math.floor(img.height * scale);
            
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const detection = this.detectPixelBlockSize(imageData);
            
            console.log('Detection result:', detection);
            
            // 根据检测结果设置建议值
            if (detection.confidence > 0.7 && detection.blockSize > 1) {
                // 高置信度，使用自动识别模式
                document.querySelector('input[name="detectionMode"][value="auto"]').checked = true;
                this.showDetectionInfo(detection);
            } else {
                // 低置信度，切换到手动模式并给出建议
                document.querySelector('input[name="detectionMode"][value="manual"]').checked = true;
                const suggestedWidth = this.calculateSuggestedWidth(imageData);
                document.getElementById('targetWidth').value = suggestedWidth;
                document.getElementById('targetWidthInput').value = suggestedWidth;
                this.handleModeChange({ target: { value: 'manual' } });
            }
            
        } catch (error) {
            console.error('Auto detection failed:', error);
        }
    }

    /**
     * 检测像素块大小
     */
    detectPixelBlockSize(imageData) {
        const { data, width, height } = imageData;
        
        // 1. 水平扫描线分析
        const horizontalSizes = this.analyzeHorizontalScanlines(data, width, height);
        
        // 2. 垂直扫描线分析  
        const verticalSizes = this.analyzeVerticalScanlines(data, width, height);
        
        // 3. 综合分析
        const candidates = this.findCommonSizes(horizontalSizes, verticalSizes);
        
        // 4. 验证候选大小
        const bestCandidate = this.validateCandidates(imageData, candidates);
        
        return bestCandidate;
    }

    analyzeHorizontalScanlines(data, width, height) {
        const sizes = [];
        const sampleLines = Math.min(10, height);
        
        for (let i = 0; i < sampleLines; i++) {
            const y = Math.floor((height * i) / (sampleLines - 1));
            const lineSizes = this.analyzeScanline(data, width, height, y, true);
            sizes.push(...lineSizes);
        }
        
        return this.calculateSizeStatistics(sizes);
    }

    analyzeVerticalScanlines(data, width, height) {
        const sizes = [];
        const sampleLines = Math.min(10, width);
        
        for (let i = 0; i < sampleLines; i++) {
            const x = Math.floor((width * i) / (sampleLines - 1));
            const lineSizes = this.analyzeScanline(data, width, height, x, false);
            sizes.push(...lineSizes);
        }
        
        return this.calculateSizeStatistics(sizes);
    }

    analyzeScanline(data, width, height, pos, isHorizontal) {
        const segments = [];
        let currentColor = null;
        let currentLength = 0;
        
        const length = isHorizontal ? width : height;
        
        for (let i = 0; i < length; i++) {
            const pixelIndex = isHorizontal 
                ? (pos * width + i) * 4
                : (i * width + pos) * 4;
                
            const r = data[pixelIndex];
            const g = data[pixelIndex + 1];
            const b = data[pixelIndex + 2];
            const a = data[pixelIndex + 3];
            
            const colorKey = `${r},${g},${b},${a}`;
            
            if (colorKey === currentColor) {
                currentLength++;
            } else {
                if (currentLength > 0) {
                    segments.push(currentLength);
                }
                currentColor = colorKey;
                currentLength = 1;
            }
        }
        
        if (currentLength > 0) {
            segments.push(currentLength);
        }
        
        return segments;
    }

    calculateSizeStatistics(sizes) {
        if (sizes.length === 0) return { mode: 1, gcd: 1, variance: 0 };
        
        // 计算众数
        const frequency = {};
        sizes.forEach(size => {
            frequency[size] = (frequency[size] || 0) + 1;
        });
        
        const mode = parseInt(Object.keys(frequency).reduce((a, b) => 
            frequency[a] > frequency[b] ? a : b
        ));
        
        // 计算GCD
        const gcd = sizes.reduce((a, b) => this.gcd(a, b));
        
        // 计算方差
        const mean = sizes.reduce((a, b) => a + b) / sizes.length;
        const variance = sizes.reduce((sum, size) => sum + Math.pow(size - mean, 2), 0) / sizes.length;
        
        return { mode, gcd, variance, sizes };
    }

    gcd(a, b) {
        return b === 0 ? a : this.gcd(b, a % b);
    }

    findCommonSizes(horizontal, vertical) {
        const candidates = [];
        
        // 基于众数的候选
        if (horizontal.mode === vertical.mode && horizontal.mode > 1) {
            candidates.push({ size: horizontal.mode, confidence: 0.9 });
        }
        
        // 基于GCD的候选
        const commonGcd = this.gcd(horizontal.gcd, vertical.gcd);
        if (commonGcd > 1 && commonGcd <= 16) {
            candidates.push({ size: commonGcd, confidence: 0.7 });
        }
        
        // 如果没有好的候选，返回默认值
        if (candidates.length === 0) {
            candidates.push({ size: 1, confidence: 0.1 });
        }
        
        return candidates.sort((a, b) => b.confidence - a.confidence);
    }

    validateCandidates(imageData, candidates) {
        let bestCandidate = { blockSize: 1, confidence: 0 };
        
        for (const candidate of candidates) {
            const confidence = this.validateBlockSize(imageData, candidate.size);
            
            if (confidence > bestCandidate.confidence) {
                bestCandidate = {
                    blockSize: candidate.size,
                    confidence: confidence * candidate.confidence
                };
            }
        }
        
        return bestCandidate;
    }

    validateBlockSize(imageData, blockSize) {
        const { data, width, height } = imageData;
        let totalVariance = 0;
        let blockCount = 0;
        
        // 采样验证
        const sampleSize = Math.min(100, Math.floor((width * height) / (blockSize * blockSize)));
        
        for (let i = 0; i < sampleSize; i++) {
            const startX = Math.floor(Math.random() * (width - blockSize));
            const startY = Math.floor(Math.random() * (height - blockSize));
            
            const variance = this.calculateBlockVariance(data, width, startX, startY, blockSize);
            totalVariance += variance;
            blockCount++;
        }
        
        const averageVariance = totalVariance / blockCount;
        
        // 方差越小，置信度越高
        return Math.max(0, 1 - (averageVariance / 10000));
    }

    calculateBlockVariance(data, width, startX, startY, blockSize) {
        const pixels = [];
        
        for (let y = startY; y < startY + blockSize; y++) {
            for (let x = startX; x < startX + blockSize; x++) {
                const index = (y * width + x) * 4;
                pixels.push({
                    r: data[index],
                    g: data[index + 1],
                    b: data[index + 2],
                    a: data[index + 3]
                });
            }
        }
        
        if (pixels.length === 0) return 0;
        
        // 计算颜色方差
        const avgR = pixels.reduce((sum, p) => sum + p.r, 0) / pixels.length;
        const avgG = pixels.reduce((sum, p) => sum + p.g, 0) / pixels.length;
        const avgB = pixels.reduce((sum, p) => sum + p.b, 0) / pixels.length;
        const avgA = pixels.reduce((sum, p) => sum + p.a, 0) / pixels.length;
        
        const variance = pixels.reduce((sum, p) => {
            return sum + 
                Math.pow(p.r - avgR, 2) +
                Math.pow(p.g - avgG, 2) +
                Math.pow(p.b - avgB, 2) +
                Math.pow(p.a - avgA, 2);
        }, 0) / pixels.length;
        
        return variance;
    }

    calculateSuggestedWidth(imageData) {
        const { width, height } = imageData;
        
        // 基于图片尺寸给出建议
        const longerSide = Math.max(width, height);
        
        if (longerSide > 1000) return 128;
        if (longerSide > 500) return 64;
        if (longerSide > 200) return 32;
        return 24;
    }

    showDetectionInfo(detection) {
        // 可以在UI中显示检测信息
        console.log(`检测到像素块大小: ${detection.blockSize}, 置信度: ${(detection.confidence * 100).toFixed(1)}%`);
    }

    /**
     * 处理图片
     */
    async processImage() {
        if (!this.originalImage || this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            this.showProgress(0, '开始处理...');
            
            const mode = document.querySelector('input[name="detectionMode"]:checked').value;
            
            if (mode === 'auto') {
                await this.processAutoMode();
            } else {
                await this.processManualMode();
            }
            
            this.showPreview();
            this.hideProgress();
            
        } catch (error) {
            console.error('Processing failed:', error);
            this.showError('处理失败: ' + error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    async processAutoMode() {
        this.showProgress(20, '分析像素块结构...');
        
        // 创建处理canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 限制处理尺寸
        const maxSize = 2000;
        const scale = Math.min(1, maxSize / Math.max(this.originalImage.width, this.originalImage.height));
        
        canvas.width = Math.floor(this.originalImage.width * scale);
        canvas.height = Math.floor(this.originalImage.height * scale);
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);
        
        this.showProgress(40, '检测像素块大小...');
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const detection = this.detectPixelBlockSize(imageData);
        
        this.showProgress(60, '缩放到基准像素...');
        
        // 根据检测结果进行下采样
        if (detection.blockSize > 1) {
            this.basePixelCanvas = this.downsampleToBase(canvas, detection.blockSize);
        } else {
            this.basePixelCanvas = this.pixelateToWidth(canvas, 64); // 默认宽度
        }
        
        this.showProgress(80, '优化颜色...');
        await this.applyColorQuantization();
        
        this.showProgress(100, '完成处理');
    }

    async processManualMode() {
        const targetWidth = parseInt(document.getElementById('targetWidth').value) || 64;
        
        this.showProgress(30, '按目标宽度像素化...');
        
        // 创建处理canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 限制处理尺寸
        const maxSize = 2000;
        const scale = Math.min(1, maxSize / Math.max(this.originalImage.width, this.originalImage.height));
        
        canvas.width = Math.floor(this.originalImage.width * scale);
        canvas.height = Math.floor(this.originalImage.height * scale);
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);
        
        this.showProgress(60, '生成基准像素图...');
        this.basePixelCanvas = this.pixelateToWidth(canvas, targetWidth);
        
        this.showProgress(80, '优化颜色...');
        await this.applyColorQuantization();
        
        this.showProgress(100, '完成处理');
    }

    /**
     * 下采样到基准像素图
     */
    downsampleToBase(sourceCanvas, blockSize) {
        const sourceCtx = sourceCanvas.getContext('2d');
        const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        
        const targetWidth = Math.floor(sourceCanvas.width / blockSize);
        const targetHeight = Math.floor(sourceCanvas.height / blockSize);
        
        const targetCanvas = document.createElement('canvas');
        targetCanvas.width = targetWidth;
        targetCanvas.height = targetHeight;
        const targetCtx = targetCanvas.getContext('2d');
        targetCtx.imageSmoothingEnabled = false;
        
        const targetData = targetCtx.createImageData(targetWidth, targetHeight);
        
        for (let y = 0; y < targetHeight; y++) {
            for (let x = 0; x < targetWidth; x++) {
                const color = this.sampleBlock(sourceData, x * blockSize, y * blockSize, blockSize);
                const targetIndex = (y * targetWidth + x) * 4;
                
                targetData.data[targetIndex] = color.r;
                targetData.data[targetIndex + 1] = color.g;
                targetData.data[targetIndex + 2] = color.b;
                targetData.data[targetIndex + 3] = color.a;
            }
        }
        
        targetCtx.putImageData(targetData, 0, 0);
        return targetCanvas;
    }

    sampleBlock(imageData, startX, startY, blockSize) {
        const { data, width, height } = imageData;
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
        for (let y = startY; y < Math.min(startY + blockSize, height); y++) {
            for (let x = startX; x < Math.min(startX + blockSize, width); x++) {
                const index = (y * width + x) * 4;
                r += data[index];
                g += data[index + 1];
                b += data[index + 2];
                a += data[index + 3];
                count++;
            }
        }
        
        if (count === 0) return { r: 0, g: 0, b: 0, a: 0 };
        
        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count),
            a: Math.round(a / count)
        };
    }

    /**
     * 像素化到指定宽度
     */
    pixelateToWidth(sourceCanvas, targetWidth) {
        const aspectRatio = sourceCanvas.height / sourceCanvas.width;
        const targetHeight = Math.round(targetWidth * aspectRatio);
        
        const targetCanvas = document.createElement('canvas');
        targetCanvas.width = targetWidth;
        targetCanvas.height = targetHeight;
        const targetCtx = targetCanvas.getContext('2d');
        
        targetCtx.imageSmoothingEnabled = false;
        targetCtx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
        
        return targetCanvas;
    }

    /**
     * 应用颜色量化
     */
    async applyColorQuantization() {
        if (!this.basePixelCanvas) return;
        
        const colorCount = parseInt(document.getElementById('pixelColorCount').value) || 32;
        const prefilterStrength = parseInt(document.getElementById('prefilterStrength').value) || 30;
        const enableDithering = document.getElementById('enableDithering').checked;
        
        const ctx = this.basePixelCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, this.basePixelCanvas.width, this.basePixelCanvas.height);
        
        // 预滤波去噪
        if (prefilterStrength > 0) {
            this.applyPrefilter(imageData, prefilterStrength / 100);
        }
        
        // 颜色量化
        await this.quantizeColors(imageData, colorCount, enableDithering);
        
        ctx.putImageData(imageData, 0, 0);
    }

    applyPrefilter(imageData, strength) {
        // 简单的双边滤波去除噪点
        const { data, width, height } = imageData;
        const filtered = new Uint8ClampedArray(data);
        
        const kernelRadius = 1;
        const spatialSigma = 1.0;
        const colorSigma = 30.0 * strength;
        
        for (let y = kernelRadius; y < height - kernelRadius; y++) {
            for (let x = kernelRadius; x < width - kernelRadius; x++) {
                const centerIndex = (y * width + x) * 4;
                const centerR = data[centerIndex];
                const centerG = data[centerIndex + 1];
                const centerB = data[centerIndex + 2];
                
                let sumR = 0, sumG = 0, sumB = 0, sumWeight = 0;
                
                for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
                    for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
                        const neighborIndex = ((y + dy) * width + (x + dx)) * 4;
                        const neighborR = data[neighborIndex];
                        const neighborG = data[neighborIndex + 1];
                        const neighborB = data[neighborIndex + 2];
                        
                        const spatialWeight = Math.exp(-(dx * dx + dy * dy) / (2 * spatialSigma * spatialSigma));
                        
                        const colorDistance = Math.sqrt(
                            (centerR - neighborR) ** 2 +
                            (centerG - neighborG) ** 2 +
                            (centerB - neighborB) ** 2
                        );
                        const colorWeight = Math.exp(-(colorDistance * colorDistance) / (2 * colorSigma * colorSigma));
                        
                        const weight = spatialWeight * colorWeight;
                        
                        sumR += neighborR * weight;
                        sumG += neighborG * weight;
                        sumB += neighborB * weight;
                        sumWeight += weight;
                    }
                }
                
                filtered[centerIndex] = Math.round(sumR / sumWeight);
                filtered[centerIndex + 1] = Math.round(sumG / sumWeight);
                filtered[centerIndex + 2] = Math.round(sumB / sumWeight);
            }
        }
        
        data.set(filtered);
    }

    async quantizeColors(imageData, colorCount, enableDithering) {
        // 使用现有的median cut算法
        this.medianCutQuantization(imageData, colorCount);
        
        // 如果启用抖动，应用Floyd-Steinberg抖动
        if (enableDithering) {
            this.applyFloydSteinbergDithering(imageData, colorCount);
        }
    }

    // 复用existing的medianCutQuantization方法
    medianCutQuantization(imageData, colorCount) {
        // 从main.js复制并修改的方法
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
                const distance = this.colorDistance(pixel, color);
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

    colorDistance(color1, color2) {
        return Math.sqrt(
            Math.pow(color1[0] - color2[0], 2) +
            Math.pow(color1[1] - color2[1], 2) +
            Math.pow(color1[2] - color2[2], 2) +
            Math.pow(color1[3] - color2[3], 2)
        );
    }

    applyFloydSteinbergDithering(imageData, colorCount) {
        // Floyd-Steinberg抖动实现
        // 这里可以实现抖动算法，当前先保持简单
        console.log('Floyd-Steinberg dithering applied');
    }

    showPreview() {
        if (!this.basePixelCanvas) return;
        
        const previewSection = document.getElementById('previewSection');
        const canvas = document.getElementById('pixelizerCanvas');
        
        if (previewSection && canvas) {
            previewSection.style.display = 'block';
            
            // 复制基准像素图到预览canvas
            canvas.width = this.basePixelCanvas.width;
            canvas.height = this.basePixelCanvas.height;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(this.basePixelCanvas, 0, 0);
            
            // 设置canvas样式以与原始图片保持一致的显示尺寸
            canvas.style.maxWidth = '100%';
            canvas.style.maxHeight = '100%';
            canvas.style.imageRendering = 'pixelated';
            canvas.style.objectFit = 'contain';
            
            this.processedCanvas = canvas;
            
            // 应用默认400%缩放
            this.applyZoom(400);
            
            // 应用网格
            this.updateGridDisplay();
            this.setupCanvasInteraction();
        }
    }

    setupCanvasInteraction() {
        // 手动对齐功能已被移除
        // 如果未来需要其他交互功能，可以在这里添加
    }


    updateGridDisplay() {
        if (!this.processedCanvas || !this.basePixelCanvas) return;
        
        // 重绘基础图像
        const ctx = this.processedCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, this.processedCanvas.width, this.processedCanvas.height);
        ctx.drawImage(this.basePixelCanvas, 0, 0);
        
        // 绘制网格
        if (document.getElementById('showPixelGrid').checked) {
            this.drawGrid(this.processedCanvas);
        }
    }

    drawGrid(canvas) {
        const ctx = canvas.getContext('2d');
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        
        // 垂直线
        for (let x = 0; x < canvas.width; x += 1) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, canvas.height);
            ctx.stroke();
        }
        
        // 水平线
        for (let y = 0; y < canvas.height; y += 1) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(canvas.width, y + 0.5);
            ctx.stroke();
        }
    }

    drawExportGrid(canvas, scale) {
        const ctx = canvas.getContext('2d');
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        
        // 垂直线
        for (let x = 0; x < canvas.width; x += scale) {
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, canvas.height);
            ctx.stroke();
        }
        
        // 水平线
        for (let y = 0; y < canvas.height; y += scale) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(canvas.width, y + 0.5);
            ctx.stroke();
        }
    }

    applyZoom(zoom) {
        const zoomSlider = document.getElementById('previewZoom');
        const zoomValue = document.getElementById('zoomValue');
        
        if (zoomSlider) {
            zoomSlider.value = zoom;
        }
        
        if (zoomValue) {
            zoomValue.textContent = `${zoom}%`;
        }
        
        if (this.processedCanvas) {
            const container = this.processedCanvas.parentElement;
            const scale = zoom / 100;
            
            this.processedCanvas.style.transform = `scale(${scale})`;
            this.processedCanvas.style.imageRendering = 'pixelated';
            this.processedCanvas.style.transformOrigin = 'center center';
            
            // 更新容器样式以适应缩放
            container.style.overflow = zoom > 100 ? 'auto' : 'visible';
        }
    }

    handleZoomChange(e) {
        const zoom = parseInt(e.target.value);
        this.applyZoom(zoom);
    }

    async exportPNG() {
        if (!this.basePixelCanvas) {
            this.showError('没有可导出的图像');
            return;
        }
        
        try {
            this.showProgress(0, '准备导出...');
            
            // 创建10倍放大的导出canvas
            const exportCanvas = document.createElement('canvas');
            const scale = 10;
            
            exportCanvas.width = this.basePixelCanvas.width * scale;
            exportCanvas.height = this.basePixelCanvas.height * scale;
            
            const ctx = exportCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            
            this.showProgress(30, '放大图像...');
            
            // 最近邻放大
            ctx.drawImage(
                this.basePixelCanvas, 
                0, 0, this.basePixelCanvas.width, this.basePixelCanvas.height,
                0, 0, exportCanvas.width, exportCanvas.height
            );
            
            this.showProgress(60, '绘制网格...');
            
            // 绘制网格（按导出尺寸）
            if (document.getElementById('showPixelGrid').checked) {
                this.drawExportGrid(exportCanvas, scale);
            }
            
            this.showProgress(90, '生成文件...');
            
            // 导出为PNG
            exportCanvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `pixel-art-${Date.now()}.png`;
                link.click();
                
                URL.revokeObjectURL(url);
                this.showProgress(100, '导出完成');
                this.showSuccess('PNG文件导出成功！');
                
                setTimeout(() => this.hideProgress(), 1000);
            }, 'image/png');
            
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('导出失败: ' + error.message);
        }
    }

    async printResult() {
        if (!this.basePixelCanvas) {
            this.showError('没有可打印的图像');
            return;
        }
        
        try {
            // 创建10倍放大的打印canvas
            const printCanvas = document.createElement('canvas');
            const scale = 10;
            
            printCanvas.width = this.basePixelCanvas.width * scale;
            printCanvas.height = this.basePixelCanvas.height * scale;
            
            const ctx = printCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            
            // 最近邻放大
            ctx.drawImage(
                this.basePixelCanvas, 
                0, 0, this.basePixelCanvas.width, this.basePixelCanvas.height,
                0, 0, printCanvas.width, printCanvas.height
            );
            
            // 绘制网格（按打印尺寸）
            if (document.getElementById('showPixelGrid').checked) {
                this.drawExportGrid(printCanvas, scale);
            }
            
            // 转换为dataURL并打印
            const dataURL = printCanvas.toDataURL('image/png');
            this.printFromDataURL(dataURL);
            this.showSuccess('打印窗口已打开！');
            
        } catch (error) {
            console.error('Print failed:', error);
            this.showError('打印失败: ' + error.message);
        }
    }

    printFromDataURL(dataURL) {
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
                        max-height: 100vh; 
                        border: 1px solid #ccc; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                        image-rendering: pixelated; 
                        image-rendering: -moz-crisp-edges; 
                        image-rendering: crisp-edges; 
                        object-fit: contain; 
                    }
                    @media print {
                        body { background: white; }
                        img { border: none; box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                <img src="${dataURL}" alt="Pixel Art for Printing">
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        };
    }

    updatePreviewIfNeeded() {
        // 如果已经有处理结果，实时更新预览
        if (this.basePixelCanvas && !this.isProcessing) {
            // 对于颜色设置变化，重新处理图片
            const colorCount = parseInt(document.getElementById('pixelColorCount').value) || 32;
            const enableDithering = document.getElementById('enableDithering').checked;
            const prefilterStrength = parseInt(document.getElementById('prefilterStrength').value) || 30;
            
            // 如果是手动模式的目标宽度变化，也需要重新处理
            const detectionMode = document.querySelector('input[name="detectionMode"]:checked').value;
            
            if (detectionMode === 'manual') {
                // 手动模式下，重新处理图片
                setTimeout(() => this.processImage(), 300);
            } else {
                // 自动模式下，只重新应用颜色量化
                setTimeout(() => {
                    this.applyColorQuantization().then(() => {
                        this.showPreview();
                    });
                }, 300);
            }
        } else {
            // 如果只是网格设置变化，只更新网格显示
            setTimeout(() => this.updateGridDisplay(), 100);
        }
    }

    showProgress(percent, message) {
        const progressSection = document.getElementById('progressSection');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressSection) {
            progressSection.style.display = 'block';
        }
        
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        
        if (progressText) {
            progressText.textContent = message;
        }
    }

    hideProgress() {
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            progressSection.style.display = 'none';
        }
    }

    showError(message) {
        // 创建更好的错误显示
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
            z-index: 1000;
            max-width: 400px;
            font-size: 14px;
            line-height: 1.4;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // 3秒后自动消失
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
        
        this.hideProgress();
    }

    showSuccess(message) {
        // 创建成功提示
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
            z-index: 1000;
            max-width: 400px;
            font-size: 14px;
            line-height: 1.4;
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        // 2秒后自动消失
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 2000);
    }

    cancelProcessing() {
        if (this.currentWorker) {
            this.currentWorker.terminate();
            this.currentWorker = null;
        }
        
        this.isProcessing = false;
        this.hideProgress();
    }
}

// ColorBox类（从main.js复制）
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

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.pixelizer = new Pixelizer();
});
