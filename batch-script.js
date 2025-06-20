// Batch Image Converter JavaScript
let selectedFiles = [];
let selectedBatchFormat = '';
let convertedFiles = [];

// DOM Elements
const batchUploadArea = document.getElementById('batchUploadArea');
const batchFileInput = document.getElementById('batchFileInput');
const batchPreview = document.getElementById('batchPreview');
const imageGrid = document.getElementById('imageGrid');
const imageCount = document.getElementById('imageCount');
const batchFormatSelection = document.getElementById('batchFormatSelection');
const batchConvertBtn = document.getElementById('batchConvertBtn');
const conversionProgress = document.getElementById('conversionProgress');
const conversionProgressFill = document.getElementById('conversionProgressFill');
const conversionProgressText = document.getElementById('conversionProgressText');
const batchDownloadArea = document.getElementById('batchDownloadArea');
const downloadAllBtn = document.getElementById('downloadAllBtn');

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeBatchEventListeners();
    trackPageView('batch-convert');
});

function initializeBatchEventListeners() {
    // File upload handling
    batchUploadArea.addEventListener('click', () => batchFileInput.click());
    batchUploadArea.addEventListener('dragover', handleBatchDragOver);
    batchUploadArea.addEventListener('dragleave', handleBatchDragLeave);
    batchUploadArea.addEventListener('drop', handleBatchDrop);
    batchFileInput.addEventListener('change', handleBatchFileSelect);

    // Format selection for batch
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', selectBatchFormat);
    });

    // Batch convert button
    batchConvertBtn.addEventListener('click', convertBatchImages);

    // Download all button
    downloadAllBtn.addEventListener('click', downloadAllAsZip);
}

// Batch Drag and Drop Handlers
function handleBatchDragOver(e) {
    e.preventDefault();
    batchUploadArea.classList.add('dragover');
}

function handleBatchDragLeave(e) {
    e.preventDefault();
    batchUploadArea.classList.remove('dragover');
}

function handleBatchDrop(e) {
    e.preventDefault();
    batchUploadArea.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    handleBatchFiles(files);
}

// Batch File Selection Handler
function handleBatchFileSelect(e) {
    const files = Array.from(e.target.files);
    handleBatchFiles(files);
}

// Handle Batch Selected Files
function handleBatchFiles(files) {
    // Filter image files and limit to 20
    const imageFiles = files.filter(file => file.type.startsWith('image/')).slice(0, 20);
    
    if (imageFiles.length === 0) {
        alert('Please select valid image files.');
        return;
    }

    if (imageFiles.length > 20) {
        alert('Maximum 20 images allowed for batch conversion.');
        return;
    }

    // Check file sizes
    const oversizedFiles = imageFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
        alert('Some files are larger than 10MB and will be skipped.');
    }

    selectedFiles = imageFiles.filter(file => file.size <= 10 * 1024 * 1024);
    displayBatchPreview();
    showBatchFormatSelection();
}

// Display Batch Preview
function displayBatchPreview() {
    imageGrid.innerHTML = '';
    imageCount.textContent = selectedFiles.length;

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageItem = document.createElement('div');
            imageItem.className = 'batch-image-item';
            imageItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <div class="batch-image-info">
                    <span class="batch-image-name">${file.name}</span>
                    <span class="batch-image-size">${formatFileSize(file.size)}</span>
                    <button class="remove-btn" onclick="removeImage(${index})">×</button>
                </div>
            `;
            imageGrid.appendChild(imageItem);
        };
        reader.readAsDataURL(file);
    });

    batchPreview.style.display = 'block';
}

// Remove Image from Batch
function removeImage(index) {
    selectedFiles.splice(index, 1);
    if (selectedFiles.length === 0) {
        batchPreview.style.display = 'none';
        batchFormatSelection.style.display = 'none';
    } else {
        displayBatchPreview();
    }
}

// Show Batch Format Selection
function showBatchFormatSelection() {
    batchFormatSelection.style.display = 'block';
}

// Batch Format Selection Handler
function selectBatchFormat(e) {
    // Remove previous selection
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selection to clicked button
    e.target.classList.add('selected');
    selectedBatchFormat = e.target.getAttribute('data-format');
    
    // Enable convert button
    batchConvertBtn.disabled = false;
}

// Convert Batch Images
async function convertBatchImages() {
    if (selectedFiles.length === 0 || !selectedBatchFormat) {
        alert('Please select images and output format.');
        return;
    }

    batchConvertBtn.disabled = true;
    conversionProgress.style.display = 'block';
    convertedFiles = [];

    let processedCount = 0;
    const totalFiles = selectedFiles.length;

    for (let i = 0; i < selectedFiles.length; i++) {
        try {
            const convertedFile = await convertSingleImage(selectedFiles[i], selectedBatchFormat);
            convertedFiles.push(convertedFile);
        } catch (error) {
            console.error(`Failed to convert ${selectedFiles[i].name}:`, error);
        }

        processedCount++;
        const progress = Math.round((processedCount / totalFiles) * 100);
        updateConversionProgress(progress);
    }

    showBatchDownloadArea();
    trackBatchConversion(selectedBatchFormat, selectedFiles.length);
}

// Convert Single Image (Promise-based)
function convertSingleImage(file, format) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function() {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);

            const mimeType = getMimeType(format);
            const quality = format === 'jpeg' ? 0.9 : undefined;

            canvas.toBlob(function(blob) {
                if (blob) {
                    const convertedFile = new File([blob], getConvertedFileName(file.name, format), {
                        type: mimeType
                    });
                    resolve(convertedFile);
                } else {
                    reject(new Error('Conversion failed'));
                }
            }, mimeType, quality);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        
        const reader = new FileReader();
        reader.onload = e => img.src = e.target.result;
        reader.readAsDataURL(file);
    });
}

// Update Conversion Progress
function updateConversionProgress(progress) {
    conversionProgressFill.style.width = `${progress}%`;
    conversionProgressText.textContent = `${progress}% Complete`;
}

// Show Batch Download Area
function showBatchDownloadArea() {
    conversionProgress.style.display = 'none';
    batchDownloadArea.style.display = 'block';
    batchDownloadArea.scrollIntoView({ behavior: 'smooth' });
}

// Download All as ZIP
async function downloadAllAsZip() {
    if (convertedFiles.length === 0) return;

    try {
        // Create a simple ZIP-like structure using JSZip library
        // For now, we'll download individual files
        // In a real implementation, you'd use JSZip library
        
        for (let i = 0; i < convertedFiles.length; i++) {
            const file = convertedFiles[i];
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        trackBatchDownload();
    } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed. Please try again.');
    }
}

// Reset Batch Converter
function resetBatchConverter() {
    selectedFiles = [];
    selectedBatchFormat = '';
    convertedFiles = [];
    
    batchPreview.style.display = 'none';
    batchFormatSelection.style.display = 'none';
    conversionProgress.style.display = 'none';
    batchDownloadArea.style.display = 'none';
    
    // Reset format buttons
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Reset file input
    batchFileInput.value = '';
    batchConvertBtn.disabled = true;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility Functions (reused from main script)
function getMimeType(format) {
    const mimeTypes = {
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff'
    };
    return mimeTypes[format] || 'image/jpeg';
}

function getConvertedFileName(originalName, format) {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const extensions = {
        'jpeg': 'jpg',
        'png': 'png',
        'webp': 'webp',
        'gif': 'gif',
        'bmp': 'bmp',
        'tiff': 'tiff'
    };
    return `${nameWithoutExt}_converted.${extensions[format]}`;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Analytics and Tracking
function trackPageView(page) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_title: `Batch Image Converter`,
            page_location: window.location.href
        });
    }
}

function trackBatchConversion(format, count) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'batch_conversion', {
            format: format,
            image_count: count,
            value: count
        });
    }
}

function trackBatchDownload() {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'batch_download', {
            file_type: 'batch_converted_images',
            value: convertedFiles.length
        });
    }
}
