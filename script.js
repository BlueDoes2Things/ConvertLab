// Image Converter JavaScript
let selectedFormat = '';
let originalFile = null;

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const formatSelection = document.getElementById('formatSelection');
const conversionArea = document.getElementById('conversionArea');
const downloadArea = document.getElementById('downloadArea');
const previewImage = document.getElementById('previewImage');
const imageName = document.getElementById('imageName');
const imageSize = document.getElementById('imageSize');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    trackPageView();
});

function initializeEventListeners() {
    // File upload handling
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Format selection
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', selectFormat);
    });

    // Convert button
    convertBtn.addEventListener('click', convertImage);

    // Download button
    downloadBtn.addEventListener('click', downloadConvertedImage);
}

// Drag and Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFiles(files);
    }
}

// File Selection Handler
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFiles(files);
    }
}

// Handle Selected Files
function handleFiles(files) {
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
    
    originalFile = file;
    displayImagePreview(file);
    showFormatSelection();
}

// Display Image Preview
function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        imageName.textContent = `Name: ${file.name}`;
        imageSize.textContent = `Size: ${formatFileSize(file.size)}`;
        
        conversionArea.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Show Format Selection
function showFormatSelection() {
    formatSelection.style.display = 'block';
}

// Format Selection Handler
function selectFormat(e) {
    // Remove previous selection
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Add selection to clicked button
    e.target.classList.add('selected');
    selectedFormat = e.target.getAttribute('data-format');
    
    // Enable convert button
    convertBtn.disabled = false;
}

// Convert Image
function convertImage() {
    if (!originalFile || !selectedFormat) {
        alert('Please select an image and output format.');
        return;
    }
    
    convertBtn.classList.add('loading');
    convertBtn.textContent = 'Converting...';
    
    // Create canvas for conversion
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        // Set canvas dimensions
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Convert to selected format
        let mimeType = getMimeType(selectedFormat);
        let quality = selectedFormat === 'jpeg' ? 0.9 : undefined;
        
        canvas.toBlob(function(blob) {
            if (blob) {
                const convertedFile = new File([blob], getConvertedFileName(originalFile.name, selectedFormat), {
                    type: mimeType
                });
                
                showDownloadArea(convertedFile);
                trackConversion(selectedFormat);
            } else {
                alert('Conversion failed. Please try again.');
            }
            
            convertBtn.classList.remove('loading');
            convertBtn.textContent = 'Convert Image';
        }, mimeType, quality);
    };
    
    img.onerror = function() {
        alert('Failed to load image. Please try again.');
        convertBtn.classList.remove('loading');
        convertBtn.textContent = 'Convert Image';
    };
    
    img.src = previewImage.src;
}

// Show Download Area
function showDownloadArea(convertedFile) {
    downloadArea.style.display = 'block';
    
    // Store converted file for download
    window.convertedFile = convertedFile;
    
    // Scroll to download area
    downloadArea.scrollIntoView({ behavior: 'smooth' });
}

// Download Converted Image
function downloadConvertedImage() {
    if (window.convertedFile) {
        const url = URL.createObjectURL(window.convertedFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = window.convertedFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        trackDownload();
    }
}

// Reset Converter
function resetConverter() {
    originalFile = null;
    selectedFormat = '';
    window.convertedFile = null;
    
    formatSelection.style.display = 'none';
    conversionArea.style.display = 'none';
    downloadArea.style.display = 'none';
    
    // Reset format buttons
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Reset file input
    fileInput.value = '';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility Functions
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
function trackPageView() {
    // Track page view for analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            page_title: 'Image Converter',
            page_location: window.location.href
        });
    }
}

function trackConversion(format) {
    // Track conversion event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'image_conversion', {
            format: format,
            value: 1
        });
    }
}

function trackDownload() {
    // Track download event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'file_download', {
            file_type: 'converted_image',
            value: 1
        });
    }
}

// Service Worker Registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});

// Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Lazy loading for images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', lazyLoadImages);
