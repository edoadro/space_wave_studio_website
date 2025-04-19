/**
 * Image Loader Module - Space Wave Studio
 * Handles loading, optimization and gallery image presentation
 */

export class ArtworkManager {
    constructor() {
        this.artworks = [];
        this.loadingComplete = false;
    }

    /**
     * Load artworks from a JSON manifest file
     * @param {string} jsonPath - Path to the JSON manifest containing artwork data
     * @returns {Promise} - Promise that resolves when all artworks are loaded
     */
    async loadArtworksFromManifest(jsonPath) {
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load artwork manifest (${response.status})`);
            }
            this.artworks = await response.json();
            this.loadingComplete = true;
            return this.artworks;
        } catch (error) {
            console.error('Error loading artworks:', error);
            this.loadingComplete = false;
            throw error;
        }
    }

    /**
     * Render artworks to a gallery container
     * @param {HTMLElement} container - The gallery container element
     * @param {Object} options - Display options including filtering and sorting
     */
    renderGallery(container, options = {}) {
        if (!this.loadingComplete || !this.artworks.length) {
            container.innerHTML = '<div class="loading-message">Loading artworks...</div>';
            return;
        }

        // Apply filters if provided
        let displayArtworks = [...this.artworks];
        if (options.filter) {
            displayArtworks = displayArtworks.filter(options.filter);
        }

        // Apply sorting if provided
        if (options.sort) {
            displayArtworks.sort(options.sort);
        }

        // Clear the container
        container.innerHTML = '';

        // Create gallery items
        displayArtworks.forEach(artwork => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            
            const artworkBox = document.createElement('div');
            artworkBox.className = 'artwork-box';
            
            // Create image with lazy loading
            const img = document.createElement('img');
            img.loading = 'lazy'; // Native lazy loading
            img.src = artwork.thumbnailUrl;
            img.alt = artwork.title;
            img.dataset.fullImage = artwork.imageUrl;
            
            // Add click event for full image view
            img.addEventListener('click', () => this.openFullView(artwork));
            
            // Append image to box
            artworkBox.appendChild(img);
            galleryItem.appendChild(artworkBox);
            
            // Add sold label if artwork is sold
            const soldLabel = document.createElement('div');
            soldLabel.className = 'sold-label';
            soldLabel.textContent = artwork.sold ? 'SOLD' : '';
            galleryItem.appendChild(soldLabel);
            
            // Add the gallery item to the container
            container.appendChild(galleryItem);
        });
    }

    /**
     * Open full view of an artwork
     * @param {Object} artwork - Artwork object with all metadata
     */
    openFullView(artwork) {
        // Create modal for full view
        const modal = document.createElement('div');
        modal.className = 'artwork-modal';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'artwork-modal-content';
        
        // Add full-size image
        const fullImg = document.createElement('img');
        fullImg.src = artwork.imageUrl;
        fullImg.alt = artwork.title;
        
        // Add artwork info
        const artworkInfo = document.createElement('div');
        artworkInfo.className = 'artwork-info';
        artworkInfo.innerHTML = `
            <h2>${artwork.title}</h2>
            <p class="artwork-date">${artwork.year}</p>
            <p class="artwork-medium">${artwork.medium}</p>
            <p class="artwork-dimensions">${artwork.dimensions}</p>
            ${artwork.description ? `<p class="artwork-description">${artwork.description}</p>` : ''}
            <p class="artwork-status">${artwork.sold ? 'SOLD' : 'Available'}</p>
        `;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'modal-close-button';
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Append elements to modal
        modalContent.appendChild(fullImg);
        modalContent.appendChild(artworkInfo);
        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);
        
        // Add modal to page
        document.body.appendChild(modal);
        
        // Close modal when clicking outside content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
}

// Helper functions for image optimization
export const ImageUtils = {
    /**
     * Preload images for better performance
     * @param {Array} imagePaths - Array of image URLs to preload
     * @returns {Promise} - Promise that resolves when all images are preloaded
     */
    preloadImages(imagePaths) {
        const promises = imagePaths.map(path => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(path);
                img.onerror = () => reject(`Failed to load image: ${path}`);
                img.src = path;
            });
        });
        return Promise.all(promises);
    },
    
    /**
     * Check if the browser supports modern image formats
     * @returns {Object} - Object with boolean flags for supported formats
     */
    getSupportedFormats() {
        const formats = {
            webp: false,
            avif: false
        };
        
        const img = document.createElement('img');
        
        // Test for WebP support
        img.onload = () => { formats.webp = true; };
        img.onerror = () => { formats.webp = false; };
        img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
        
        // Test for AVIF support (more modern format)
        img.onload = () => { formats.avif = true; };
        img.onerror = () => { formats.avif = false; };
        img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK';
        
        return formats;
    }
};