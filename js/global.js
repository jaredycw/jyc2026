// ===== main.js - Combined and optimized =====

// ===== CORE UTILITIES =====
const dom = {
    themeToggle: document.getElementById('themeToggle'),
    html: document.documentElement,
    hamburger: document.getElementById('hamburger'),
    slideMenu: document.getElementById('slideMenu'),
    headerContainer: document.getElementById('headerContainer'),
    modal: document.getElementById('imageModal'),
    modalImage: document.getElementById('modalImage'),
    modalLoading: document.getElementById('modalLoading'),
    closeBtn: document.getElementById('closeModal'),
    prevBtn: document.getElementById('prevModal'),
    nextBtn: document.getElementById('nextModal'),
    counter: document.getElementById('modalCounter')
};

// ===== 1. THEME TOGGLE =====
(function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    dom.html.setAttribute('data-theme', savedTheme);

    if (dom.themeToggle) {
        dom.themeToggle.addEventListener('click', () => {
            const currentTheme = dom.html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            dom.html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
})();

// ===== 2. SLIDE MENU =====
(function initSlideMenu() {
    if (!dom.hamburger || !dom.slideMenu) return;

    function toggleMenu() {
        dom.hamburger.classList.toggle('active');
        dom.slideMenu.classList.toggle('active');
        dom.headerContainer?.classList.toggle('active');
        document.body.style.overflow = dom.slideMenu.classList.contains('active') ? 'hidden' : 'auto';
    }

    function closeMenu() {
        dom.hamburger.classList.remove('active');
        dom.slideMenu.classList.remove('active');
        dom.headerContainer?.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Event listeners
    dom.hamburger.addEventListener('click', toggleMenu);
    
    document.querySelectorAll('.menu-items a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dom.slideMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    dom.slideMenu.addEventListener('click', (e) => {
        if (e.target === dom.slideMenu) closeMenu();
    });
})();

// ===== 3. IMAGE SLIDER & MODAL (Modularized) =====
const ImageGallery = {
    config: {
        dragThreshold: 5,
        modalState: {
            currentTrack: null,
            currentImages: [],
            currentIndex: 0
        }
    },

    init() {
        this.initImageTracks();
        this.initModal();
        this.initImageProtection();
    },

    initImageTracks() {
        document.querySelectorAll('.image-track').forEach(track => {
            this.setupTrackEvents(track);
        });
    },

    setupTrackEvents(track) {
        let isDragging = false;
        let startX, scrollLeft, startTime;
        let dragDistance = 0;

        // Mouse events
        track.addEventListener('mousedown', (e) => {
            isDragging = true;
            track.classList.add('dragging');
            startX = e.pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
            startTime = Date.now();
            dragDistance = 0;
            e.preventDefault();
        });

        track.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const x = e.pageX - track.offsetLeft;
            const walk = x - startX;
            dragDistance = Math.abs(walk);
            
            if (dragDistance > this.config.dragThreshold) {
                track.scrollLeft = scrollLeft - walk;
            }
        });

        track.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            
            track.classList.remove('dragging');
            
            const wasClick = dragDistance <= this.config.dragThreshold && 
                            (Date.now() - startTime) < 200;
            
            if (wasClick) {
                this.handleImageClick(e, track);
            }
            
            isDragging = false;
        });

        track.addEventListener('mouseleave', () => {
            isDragging = false;
            track.classList.remove('dragging');
        });

        // Touch events
        track.addEventListener('touchstart', (e) => {
            isDragging = true;
            track.classList.add('dragging');
            startX = e.touches[0].pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
            startTime = Date.now();
            dragDistance = 0;
        });

        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const x = e.touches[0].pageX - track.offsetLeft;
            const walk = x - startX;
            dragDistance = Math.abs(walk);
            
            if (dragDistance > this.config.dragThreshold) {
                track.scrollLeft = scrollLeft - walk;
            }
        });

        track.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            track.classList.remove('dragging');
            
            const wasTap = dragDistance <= this.config.dragThreshold && 
                          (Date.now() - startTime) < 200;
            
            if (wasTap && e.changedTouches.length > 0) {
                this.handleTouchTap(e, track);
            }
            
            isDragging = false;
        });
    },

    handleImageClick(e, track) {
        const images = Array.from(track.querySelectorAll('.card-post-image'));
        const clickedIndex = images.findIndex(img => {
            const rect = img.getBoundingClientRect();
            return e.clientX >= rect.left && e.clientX <= rect.right;
        });

        if (clickedIndex !== -1) {
            this.openModal(track, images, clickedIndex);
        }
    },

    handleTouchTap(e, track) {
        const touch = e.changedTouches[0];
        const images = Array.from(track.querySelectorAll('.card-post-image'));
        const tappedIndex = images.findIndex(img => {
            const rect = img.getBoundingClientRect();
            return touch.clientX >= rect.left && touch.clientX <= rect.right;
        });

        if (tappedIndex !== -1) {
            this.openModal(track, images, tappedIndex);
        }
    },

    openModal(track, images, index) {
        this.config.modalState.currentTrack = track;
        this.config.modalState.currentImages = images;
        this.config.modalState.currentIndex = index;
        
        this.loadModalImage(images[index].src);
        this.updateModalCounter();
        dom.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    loadModalImage(src) {
        dom.modalLoading.style.display = 'block';
        dom.modalImage.style.opacity = '0';
        
        const tempImg = new Image();
        tempImg.onload = () => {
            dom.modalImage.src = src;
            dom.modalLoading.style.display = 'none';
            dom.modalImage.style.opacity = '1';
        };
        tempImg.src = src;
    },

    updateModalCounter() {
        const { currentImages, currentIndex } = this.config.modalState;
        if (currentImages.length > 0 && dom.counter) {
            dom.counter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
        }
    },

    initModal() {
        if (!dom.modal) return;

        // Modal navigation
        dom.closeBtn?.addEventListener('click', () => this.closeModal());
        dom.prevBtn?.addEventListener('click', () => this.navigateModal(-1));
        dom.nextBtn?.addEventListener('click', () => this.navigateModal(1));

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!dom.modal.classList.contains('active')) return;
            
            if (e.key === 'Escape') this.closeModal();
            else if (e.key === 'ArrowLeft') this.navigateModal(-1);
            else if (e.key === 'ArrowRight') this.navigateModal(1);
        });

        // Close on background click
        // Close on background click - Fixed
        dom.modal.addEventListener('click', (e) => {
            // Close if click is on modal background OR on the container (which acts as backdrop)
            if (e.target === dom.modal || e.target.classList.contains('modal-container')) {
                console.log('Background clicked, closing modal');
                this.closeModal();
            }
        });
    },

    navigateModal(direction) {
        const { currentImages, currentIndex } = this.config.modalState;
        if (currentImages.length === 0) return;
        
        const newIndex = (currentIndex + direction + currentImages.length) % currentImages.length;
        this.config.modalState.currentIndex = newIndex;
        
        this.loadModalImage(currentImages[newIndex].src);
        this.updateModalCounter();
    },

    closeModal() {
        dom.modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        this.config.modalState.currentTrack = null;
        this.config.modalState.currentImages = [];
    },

    initImageProtection() {
        document.querySelectorAll('.card-post-image').forEach(img => {
            img.addEventListener('dragstart', (e) => e.preventDefault());
            
            // Orientation detection
            if (img.complete) {
                this.setImageOrientation(img);
            } else {
                img.addEventListener('load', () => this.setImageOrientation(img));
            }
        });
    },

    setImageOrientation(img) {
        const { width, height } = img;
        if (width > height) img.setAttribute('data-orientation', 'landscape');
        else if (height > width) img.setAttribute('data-orientation', 'portrait');
        else img.setAttribute('data-orientation', 'square');
    }
};

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ImageGallery.init();
});