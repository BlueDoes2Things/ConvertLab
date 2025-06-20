// Image Resizer JavaScript
let originalImageFile = null;
let originalImageDimensions = { width: 0, height: 0 };

// DOM Elements
const resizeUploadArea = document.getElementById('resizeUploadArea');
const resizeFileInput = document.getElementById('resizeFileInput');
const resizeOptions = document.getElementById('resizeOptions');
const resizePreviewImage = document.getElementById('resizePreviewImage');
const originalDimensions = document.getElementById('originalDimensions');
const originalFileSize = document.getElementById('originalFileSize');
const resizeBtn = document.getElementById('resizeBtn');
const resizeDownloadArea = document.getElementById('resizeDownloadArea');
const resizeDownloadBtn = document.getElementById('resizeDownloadBtn');

// Resize controls
const percentageInputs = document.getElementById('percentageInputs');
const dimensionInputs = document.getElementById('dimensionInputs');
const presetInputs = document.getElementById('presetInputs');
const percentageValue = document.getElementById('percentageValue');
const newWidth = document.getElementById('newWidth');
const newHeight = document.getElementById('newHeight');
const maintainAspectRatio = document.getElementById('maintainAspectRatio');
const calculatedSize = document.getElementById('calculatedSize');

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeResizeEventListeners();
    trackPageView('resize');
});

function initializeResizeEventListeners() {
    // File upload handling
    resizeUploadArea.addEventListener('click', () => resizeFileInput.click());
    resizeUploadArea.addEventListener('dragover', handleResizeDragOver);
    resizeUploadArea.addEventListener('dragleave', handleResizeDragLeave);
    resizeUploadArea.addEventListener('drop', handleResizeDrop);
    resizeFileInput.addEventListener('change', handleResizeFileSelect);

    // Resize method selection
    document.querySelectorAll('input[name="resizeMethod"]').forEach(radio => {
        radio.addEventListener('change', handleResizeMethodChange);
    });

    // Input handlers
    percentageValue.addEventListener('input', updatePercentagePreview);
    newWidth.addEventListener('input', updateDimensionPreview);
    newHeight.addEventListener('input', updateDimensionPreview);
    maintainAspectRatio.addEventListener('change', updateDimensionPreview);

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', handlePresetSelection);
    });

    // Resize button
    resizeBtn.addEventListener('click', resizeImage);

    // Download button
    resizeDownloadBtn.addEventListener('click', downloadResizedImage);
}

// Drag and Drop Handlers
function handleResizeDragOver(e) {
    e.preventDefault();
    resizeUploadArea.classList.add('dragover');
}

function handleResizeDragLeave(e) {
    e.preventDefault();
    resizeUploadArea.classList.remove('dragover');
}

function handleResizeDrop(e) {
    e.preventDefault();
    resizeUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleResizeFiles(files);
    }
}

// File Selection Handler
function handleResizeFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleResizeFiles(files);
    }
}

// Handle Selected Files
function handleResizeFiles(files) {
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
    }
    
    originalImageFile = file;
    displayResizeImagePreview(file);
}

// Display Image Preview
function displayResizeImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        resizePreviewImage.src = e.target.result;
        resizePreviewImage.onload = function() {
            originalImageDimensions.width = this.naturalWidth;
            originalImageDimensions.height = this.naturalHeight;
            
            originalDimensions.textContent = `${this.naturalWidth} × ${this.naturalHeight} pixels`;
            originalFileSize.textContent = formatFileSize(file.size);
            
            // Set initial values
            newWidth.value = this.naturalWidth;
            newHeight.value = this.naturalHeight;
            updateCalculatedSize();
            
            resizeOptions.style.display = 'block';
        };
    };
    reader.readAsDataURL(file);
}

// Handle Resize Method Change
function handleResizeMethodChange(e) {
    const method = e.target.value;
    
    // Hide all input sections
    percentageInputs.style.display = 'none';
    dimensionInputs.style.display = 'none';
    presetInputs.style.display = 'none';
    
    // Show selected method
    if (method === 'percentage') {
        percentageInputs.style.display = 'block';
        updatePercentagePreview();
    } else if (method === 'dimensions') {
        dimensionInputs.style.display = 'block';
        updateDimensionPreview();
    } else if (method === 'preset') {
        presetInputs.style.display = 'block';
        calculatedSize.textContent = 'Select a preset size';
    }
}

// Update Percentage Preview
function updatePercentagePreview() {
    const percentage = parseInt(percentageValue.value) || 100;
    const newW = Math.round(originalImageDimensions.width * percentage / 100);
    const newH = Math.round(originalImageDimensions.height * percentage / 100);
    calculatedSize.textContent = `${newW} × ${newH} pixels`;
}

// Update Dimension Preview
function updateDimensionPreview() {
    const width = parseInt(newWidth.value) || 0;
    const height = parseInt(newHeight.value) || 0;
    
    if (maintainAspectRatio.checked && originalImageDimensions.width > 0) {
        const aspectRatio = originalImageDimensions.width / originalImageDimensions.height;
        
        if (document.activeElement === newWidth) {
            const calculatedHeight = Math.round(width / aspectRatio);
            newHeight.value = calculatedHeight;
            calculatedSize.textContent = `${width} × ${calculatedHeight} pixels`;
        } else if (document.activeElement === newHeight) {
            const calculatedWidth = Math.round(height * aspectRatio);
            newWidth.value = calculatedWidth;
            calculatedSize.textContent = `${calculatedWidth} × ${height} pixels`;
        } else {
            calculatedSize.textContent = `${width} × ${height} pixels`;
        }
    } else {
        calculatedSize.textContent = `${width} × ${height} pixels`;
    }
}

// Handle Preset Selection
function handlePresetSelection(e) {
    const width = parseInt(e.target.getAttribute('data-width'));
    const height = parseInt(e.target.getAttribute('data-height'));
    
    // Remove previous selection
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selection to clicked button
    e.target.classList.add('selected');
    
    calculatedSize.textContent = `${width} × ${height} pixels`;
    
    // Store selected preset
    window.selectedPreset = { width, height };
}

// Update Calculated Size
function updateCalculatedSize() {
    const method = document.querySelector('input[name="resizeMethod"]:checked').value;
    
    if (method === 'percentage') {
        updatePercentagePreview();
    } else if (method === 'dimensions') {
        updateDimensionPreview();
    }
}

// Resize Image
function resizeImage() {
    if (!originalImageFile) {
        alert('Please select an image first.');
        return;
    }
    
    const method = document.querySelector('input[name="resizeMethod"]:checked').value;
    let targetWidth, targetHeight;
    
    // Determine target dimensions based on method
    if (method === 'percentage') {
        const percentage = parseInt(percentageValue.value) || 100;
        targetWidth = Math.round(originalImageDimensions.width * percentage / 100);
        targetHeight = Math.round(originalImageDimensions.height * percentage / 100);
    } else if (method === 'dimensions') {
        targetWidth = parseInt(newWidth.value) || originalImageDimensions.width;
        targetHeight = parseInt(newHeight.value) || originalImageDimensions.height;
    } else if (method === 'preset' && window.selectedPreset) {
        targetWidth = window.selectedPreset.width;
        targetHeight = window.selectedPreset.height;
    } else {
        alert('Please select resize parameters.');
        return;
    }
    
    if (targetWidth <= 0 || targetHeight <= 0) {
        alert('Invalid dimensions. Please enter positive values.');
        return;
    }
    
    resizeBtn.classList.add('loading');
    resizeBtn.textContent = 'Resizing...';
    
    // Create canvas for resizing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Set canvas dimensions to target size
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        // Convert to blob
        canvas.toBlob(function(blob) {
            if (blob) {
                const resizedFile = new File([blob], getResizedFileName(originalImageFile.name), {
                    type: originalImageFile.type
                });
                
                showResizeDownloadArea(resizedFile, targetWidth, targetHeight);
                trackResize(targetWidth, targetHeight);
            } else {
                alert('Resize failed. Please try again.');
            }
            
            resizeBtn.classList.remove('loading');
            resizeBtn.textContent = 'Resize Image';
        }, originalImageFile.type, 0.9);
    };
    
    img.onerror = function() {
        alert('Failed to load image. Please try again.');
        resizeBtn.classList.remove('loading');
        resizeBtn.textContent = 'Resize Image';
    };
    
    img.src = resizePreviewImage.src;
}

// Show Resize Download Area
function showResizeDownloadArea(resizedFile, width, height) {
    const beforeSize = `${originalImageDimensions.width} × ${originalImageDimensions.height} px (${formatFileSize(originalImageFile.size)})`;
    const afterSize = `${width} × ${height} px (${formatFileSize(resizedFile.size)})`;
    
    document.getElementById('beforeSize').textContent = beforeSize;
    document.getElementById('afterSize').textContent = afterSize;
    
    resizeDownloadArea.style.display = 'block';
    
    // Store resized file for download
    window.resizedFile = resizedFile;
    
    // Scroll to download area
    resizeDownloadArea.scrollIntoView({ behavior: 'smooth' });
}

// Download Resized Image
function downloadResizedImage() {
    if (window.resizedFile) {
        const url = URL.createObjectURL(window.resizedFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = window.resizedFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        trackResizeDownload();
    }
}

// Reset Resizer
function resetResizer() {
    originalImageFile = null;
    originalImageDimensions = { width: 0, height: 0 };
    window.resizedFile = null;
    window.selectedPreset = null;
    
    resizeOptions.style.display = 'none';
    resizeDownloadArea.style.display = 'none';
    
    // Reset inputs
    percentageValue.value = 100;
    newWidth.value = '';
    newHeight.value = '';
    maintainAspectRatio.checked = true;
    
    // Reset preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Reset method to percentage
    document.querySelector('input[name="resizeMethod"][value="percentage"]').checked = true;
    handleResizeMethodChange({ target: { value: 'percentage' } });
    
    // Reset file input
    resizeFileInput.value = '';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility Functions
function getResizedFileName(originalName) {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const extension = originalName.split('.').pop();
    return `${nameWithoutExt}_resized.${extension}`;
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
            page_title: 'Image Resizer',
            page_location: window.location.href
        });
    }
}

function trackResize(width, height) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'image_resize', {
            new_width: width,
            new_height: height,
            value: 1
        });
    }
}

function trackResizeDownload() {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'resize_download', {
            file_type: 'resized_image',
            value: 1
        });
    }
}
