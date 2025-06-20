// Image Compressor JavaScript
let originalCompressFile = null;
let currentQuality = 80;

// DOM Elements
const compressUploadArea = document.getElementById('compressUploadArea');
const compressFileInput = document.getElementById('compressFileInput');
const compressOptions = document.getElementById('compressOptions');
const compressPreviewImage = document.getElementById('compressPreviewImage');
const originalInfo = document.getElementById('originalInfo');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const estimatedSize = document.getElementById('estimatedSize');
const sizeReduction = document.getElementById('sizeReduction');
const compressBtn = document.getElementById('compressBtn');
const compressDownloadArea = document.getElementById('compressDownloadArea');
const compressDownloadBtn = document.getElementById('compressDownloadBtn');

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeCompressEventListeners();
    trackPageView('compress');
});

function initializeCompressEventListeners() {
    // File upload handling
    compressUploadArea.addEventListener('click', () => compressFileInput.click());
    compressUploadArea.addEventListener('dragover', handleCompressDragOver);
    compressUploadArea.addEventListener('dragleave', handleCompressDragLeave);
    compressUploadArea.addEventListener('drop', handleCompressDrop);
    compressFileInput.addEventListener('change', handleCompressFileSelect);

    // Quality control
    qualitySlider.addEventListener('input', handleQualityChange);

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', handleQualityPreset);
    });

    // Compress button
    compressBtn.addEventListener('click', compressImage);

    // Download button
    compressDownloadBtn.addEventListener('click', downloadCompressedImage);
}

// Drag and Drop Handlers
function handleCompressDragOver(e) {
    e.preventDefault();
    compressUploadArea.classList.add('dragover');
}

function handleCompressDragLeave(e) {
    e.preventDefault();
    compressUploadArea.classList.remove('dragover');
}

function handleCompressDrop(e) {
    e.preventDefault();
    compressUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleCompressFiles(files);
    }
}

// File Selection Handler
function handleCompressFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleCompressFiles(files);
    }
}

// Handle Selected Files
function handleCompressFiles(files) {
    const file = files[0];
    
    // Validate file type (only JPG, PNG, WebP for compression)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Please select a JPG, PNG, or WebP image for compression.');
        return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
    }
    
    originalCompressFile = file;
    displayCompressImagePreview(file);
}

// Display Image Preview
function displayCompressImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            compressPreviewImage.src = e.target.result;
            originalInfo.textContent = `${img.naturalWidth} × ${img.naturalHeight} pixels • ${formatFileSize(file.size)}`;
            
            updateEstimatedSize();
            compressOptions.style.display = 'block';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Handle Quality Change
function handleQualityChange(e) {
    currentQuality = parseInt(e.target.value);
    qualityValue.textContent = `${currentQuality}%`;
    
    // Update preset button states
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.getAttribute('data-quality')) === currentQuality) {
            btn.classList.add('active');
        }
    });
    
    updateEstimatedSize();
}

// Handle Quality Preset
function handleQualityPreset(e) {
    const quality = parseInt(e.target.getAttribute('data-quality'));
    
    // Update slider and current quality
    qualitySlider.value = quality;
    currentQuality = quality;
    qualityValue.textContent = `${quality}%`;
    
    // Update preset button states
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    updateEstimatedSize();
}

// Update Estimated Size
function updateEstimatedSize() {
    if (!originalCompressFile) return;
    
    // Rough estimation based on quality
    const compressionRatio = currentQuality / 100;
    const baseCompressionFactor = originalCompressFile.type === 'image/png' ? 0.7 : 0.8;
    const estimatedBytes = Math.round(originalCompressFile.size * compressionRatio * baseCompressionFactor);
    
    estimatedSize.textContent = formatFileSize(estimatedBytes);
    
    const reduction = Math.round((1 - (estimatedBytes / originalCompressFile.size)) * 100);
    sizeReduction.textContent = `${reduction}% smaller`;
    sizeReduction.style.color = reduction > 0 ? '#059669' : '#dc2626';
}

// Compress Image
function compressImage() {
    if (!originalCompressFile) {
        alert('Please select an image first.');
        return;
    }
    
    compressBtn.classList.add('loading');
    compressBtn.textContent = 'Compressing...';
    
    // Create canvas for compression
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Set canvas dimensions
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Determine output format and quality
        let outputType = originalCompressFile.type;
        let quality = currentQuality / 100;
        
        // PNG doesn't support quality parameter, convert to JPEG for compression
        if (originalCompressFile.type === 'image/png' && currentQuality < 100) {
            outputType = 'image/jpeg';
        }
        
        canvas.toBlob(function(blob) {
            if (blob) {
                const compressedFile = new File([blob], getCompressedFileName(originalCompressFile.name, outputType), {
                    type: outputType
                });
                
                showCompressDownloadArea(compressedFile);
                trackCompression(currentQuality, originalCompressFile.size, blob.size);
            } else {
                alert('Compression failed. Please try again.');
            }
            
            compressBtn.classList.remove('loading');
            compressBtn.textContent = 'Compress Image';
        }, outputType, quality);
    };
    
    img.onerror = function() {
        alert('Failed to load image. Please try again.');
        compressBtn.classList.remove('loading');
        compressBtn.textContent = 'Compress Image';
    };
    
    img.src = compressPreviewImage.src;
}

// Show Compress Download Area
function showCompressDownloadArea(compressedFile) {
    const originalSize = formatFileSize(originalCompressFile.size);
    const newSize = formatFileSize(compressedFile.size);
    const savedBytes = originalCompressFile.size - compressedFile.size;
    const savedSize = formatFileSize(savedBytes);
    const savedPercent = Math.round((savedBytes / originalCompressFile.size) * 100);
    
    document.getElementById('originalSize').textContent = originalSize;
    document.getElementById('compressedSize').textContent = newSize;
    document.getElementById('savedSize').textContent = `${savedSize} (${savedPercent}%)`;
    
    compressDownloadArea.style.display = 'block';
    
    // Store compressed file for download
    window.compressedFile = compressedFile;
    
    // Scroll to download area
    compressDownloadArea.scrollIntoView({ behavior: 'smooth' });
}

// Download Compressed Image
function downloadCompressedImage() {
    if (window.compressedFile) {
        const url = URL.createObjectURL(window.compressedFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = window.compressedFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        trackCompressDownload();
    }
}

// Reset Compressor
function resetCompressor() {
    originalCompressFile = null;
    window.compressedFile = null;
    currentQuality = 80;
    
    compressOptions.style.display = 'none';
    compressDownloadArea.style.display = 'none';
    
    // Reset quality slider
    qualitySlider.value = 80;
    qualityValue.textContent = '80%';
    
    // Reset preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-quality') === '80') {
            btn.classList.add('active');
        }
    });
    
    // Reset file input
    compressFileInput.value = '';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility Functions
function getCompressedFileName(originalName, outputType) {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    let extension = originalName.split('.').pop();
    
    // Change extension if format was converted
    if (outputType === 'image/jpeg' && !['jpg', 'jpeg'].includes(extension.toLowerCase())) {
        extension = 'jpg';
    }
    
    return `${nameWithoutExt}_compressed.${extension}`;
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
            page_title: 'Image Compressor',
            page_location: window.location.href
        });
    }
}

function trackCompression(quality, originalSize, compressedSize) {
    const compressionRatio = Math.round((1 - (compressedSize / originalSize)) * 100);
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'image_compression', {
            quality: quality,
            compression_ratio: compressionRatio,
            original_size: originalSize,
            compressed_size: compressedSize,
            value: 1
        });
    }
}

function trackCompressDownload() {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'compress_download', {
            file_type: 'compressed_image',
            value: 1
        });
    }
}
