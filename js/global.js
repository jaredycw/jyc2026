// ===== main.js - Optimized for Performance =====

// ===== CORE UTILITIES with null checks =====
const dom = {
    themeToggle: document.getElementById('themeToggle'),
    html: document.documentElement,
    hamburger: document.getElementById('hamburger'),
    slideMenu: document.getElementById('slideMenu'),
    headerContainer: document.getElementById('headerContainer'),
    slideMenuCloseText: document.getElementById('slideMenuCloseText'),
    modal: document.getElementById('imageModal'),
    modalImage: document.getElementById('modalImage'),
    modalLoading: document.getElementById('modalLoading'),
    closeBtn: document.getElementById('closeModal'),
    prevBtn: document.getElementById('prevModal'),
    nextBtn: document.getElementById('nextModal'),
    counter: document.getElementById('modalCounter')
};

// Filter out null elements to avoid repeated checks
const validDom = Object.fromEntries(
    Object.entries(dom).filter(([_, value]) => value !== null)
);

// ===== 1. THEME TOGGLE (Optimized) =====
(function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    dom.html.setAttribute('data-theme', savedTheme);

    if (dom.themeToggle) {
        dom.themeToggle.addEventListener('click', () => {
            const newTheme = dom.html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            dom.html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
})();

// ===== 2. SLIDE MENU (Optimized) =====
(function initSlideMenu() {
    if (!dom.hamburger || !dom.slideMenu) return;

    const toggleMenu = () => {
        const isActive = dom.slideMenu.classList.contains('active');
        dom.hamburger.classList.toggle('active');
        dom.slideMenu.classList.toggle('active');
        dom.headerContainer?.classList.toggle('active');
        document.body.style.overflow = isActive ? 'auto' : 'hidden';
    };

    const closeMenu = () => {
        dom.hamburger.classList.remove('active');
        dom.slideMenu.classList.remove('active');
        dom.headerContainer?.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    // Cache menu items query
    const menuItems = document.querySelectorAll('.menu-items a');
    
    // Event listeners with passive where possible
    dom.hamburger.addEventListener('click', toggleMenu);
    menuItems.forEach(link => link.addEventListener('click', closeMenu));
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dom.slideMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    if (dom.slideMenuCloseText) {
        dom.slideMenuCloseText.addEventListener('click', closeMenu);
    }

    dom.slideMenu.addEventListener('click', (e) => {
        if (e.target === dom.slideMenu) closeMenu();
    });
})();

// ===== 3. IMAGE GALLERY (Modularized & Optimized) =====
const ImageGallery = {
    config: {
        dragThreshold: 5,
        swipeThreshold: 50,
        maxVerticalDeviation: 30,
        tapTimeThreshold: 200,
        modalState: {
            currentTrack: null,
            currentImages: [],
            currentIndex: 0
        }
    },

    // Cache frequently used elements
    elements: {
        imageTracks: null,
        cardImages: null
    },

    init() {
        // Cache DOM queries
        this.elements.imageTracks = document.querySelectorAll('.image-track');
        this.elements.cardImages = document.querySelectorAll('.card-post-image');
        
        this.initImageTracks();
        this.initModal();
        this.initImageProtection();
    },

    initImageTracks() {
        this.elements.imageTracks.forEach(track => {
            this.setupTrackEvents(track);
        });
    },

    setupTrackEvents(track) {
        let isDragging = false;
        let startX, scrollLeft, startTime, startY;
        let dragDistance = 0;
        let isHorizontalScroll = false;
        let initialScrollLeft = 0;

        // Shared handler for determining scroll direction
        const getScrollDirection = (currentX, currentY) => {
            const diffX = currentX - startX;
            const diffY = currentY - startY;
            const absDiffX = Math.abs(diffX);
            const absDiffY = Math.abs(diffY);
            
            return {
                diffX,
                diffY,
                absDiffX,
                absDiffY,
                isHorizontal: absDiffX > absDiffY && absDiffX > 5,
                isVertical: absDiffY > absDiffX && absDiffY > 5
            };
        };

        // Mouse events (keep as is)
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
                            (Date.now() - startTime) < this.config.tapTimeThreshold;
            
            if (wasClick) {
                this.handleImageClick(e, track);
            }
            
            isDragging = false;
        });

        track.addEventListener('mouseleave', () => {
            isDragging = false;
            track.classList.remove('dragging');
        });

        // ===== OPTIMIZED TOUCH EVENTS =====
        track.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            isDragging = true;
            track.classList.add('dragging');
            startX = touch.pageX;
            startY = touch.pageY;
            scrollLeft = track.scrollLeft;
            initialScrollLeft = track.scrollLeft;
            startTime = Date.now();
            dragDistance = 0;
            isHorizontalScroll = false;
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const touch = e.touches[0];
            const direction = getScrollDirection(touch.pageX, touch.pageY);
            
            // Determine scroll direction (only once)
            if (!isHorizontalScroll) {
                if (direction.isHorizontal) {
                    isHorizontalScroll = true;
                    e.preventDefault();
                } else if (direction.isVertical) {
                    isDragging = false;
                    track.classList.remove('dragging');
                    return;
                }
            }
            
            // Handle horizontal scrolling
            if (isHorizontalScroll) {
                e.preventDefault();
                const walk = direction.diffX;
                dragDistance = direction.absDiffX;
                track.scrollLeft = scrollLeft - walk;
            }
        }, { passive: false });

        track.addEventListener('touchend', (e) => {
            if (!isDragging) {
                track.classList.remove('dragging');
                return;
            }
            
            track.classList.remove('dragging');
            
            const wasTap = dragDistance <= this.config.dragThreshold && 
                          (Date.now() - startTime) < this.config.tapTimeThreshold;
            const didScroll = Math.abs(track.scrollLeft - initialScrollLeft) > 10;
            
            if (wasTap && !didScroll && e.changedTouches.length > 0) {
                this.handleTouchTap(e, track);
            }
            
            isDragging = false;
            isHorizontalScroll = false;
        });

        track.addEventListener('touchcancel', () => {
            isDragging = false;
            isHorizontalScroll = false;
            track.classList.remove('dragging');
        });
    },

    handleImageClick(e, track) {
        const images = Array.from(track.querySelectorAll('.card-post-image'));
        const clickedIndex = this.findImageIndexAtPosition(images, e.clientX, null);
        
        if (clickedIndex !== -1) {
            this.openModal(track, images, clickedIndex);
        }
    },

    handleTouchTap(e, track) {
        const touch = e.changedTouches[0];
        const images = Array.from(track.querySelectorAll('.card-post-image'));
        const tappedIndex = this.findImageIndexAtPosition(images, touch.clientX, touch.clientY);
        
        if (tappedIndex !== -1) {
            this.openModal(track, images, tappedIndex);
        }
    },

    findImageIndexAtPosition(images, x, y = null) {
        return images.findIndex(img => {
            const rect = img.getBoundingClientRect();
            if (y === null) {
                return x >= rect.left && x <= rect.right;
            }
            return x >= rect.left && x <= rect.right && 
                   y >= rect.top && y <= rect.bottom;
        });
    },

    openModal(track, images, index) {
        Object.assign(this.config.modalState, {
            currentTrack: track,
            currentImages: images,
            currentIndex: index
        });
        
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
            
            const keyActions = {
                'Escape': () => this.closeModal(),
                'ArrowLeft': () => this.navigateModal(-1),
                'ArrowRight': () => this.navigateModal(1)
            };
            
            if (keyActions[e.key]) {
                keyActions[e.key]();
            }
        });

        // Close on background click
        dom.modal.addEventListener('click', (e) => {
            if (e.target === dom.modal || e.target.classList.contains('modal-container')) {
                this.closeModal();
            }
        });

        this.initModalSwipe();
        this.initMobileArrows();
    },

    initModalSwipe() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        const handleTouchStart = (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        };

        const handleTouchMove = (e) => {
            if (!dom.modal.classList.contains('active')) return;
            
            const currentX = e.changedTouches[0].screenX;
            const diffX = currentX - touchStartX;
            const diffY = Math.abs(e.changedTouches[0].screenY - touchStartY);
            
            if (Math.abs(diffX) > 10 && Math.abs(diffX) > diffY) {
                dom.modalImage.style.transform = `translateX(${diffX * 0.3}px) scale(0.98)`;
                dom.modalImage.style.transition = 'none';
            }
        };

        const handleTouchEnd = (e) => {
            if (!dom.modal.classList.contains('active')) return;
            
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            
            const horizontalDistance = touchEndX - touchStartX;
            const verticalDistance = Math.abs(touchEndY - touchStartY);
            
            if (Math.abs(horizontalDistance) > this.config.swipeThreshold && 
                verticalDistance < this.config.maxVerticalDeviation) {
                this.navigateModal(horizontalDistance > 0 ? -1 : 1);
            }
            
            // Reset image position
            dom.modalImage.style.transform = '';
            dom.modalImage.style.transition = '';
        };

        dom.modal.addEventListener('touchstart', handleTouchStart, { passive: true });
        dom.modal.addEventListener('touchmove', handleTouchMove.bind(this), { passive: true });
        dom.modal.addEventListener('touchend', handleTouchEnd.bind(this));
        dom.modal.addEventListener('touchcancel', () => {
            dom.modalImage.style.transform = '';
            dom.modalImage.style.transition = '';
        });
    },

    initMobileArrows() {
        if (!dom.prevBtn || !dom.nextBtn) return;
        
        const updateArrows = () => {
            const isMobile = window.innerWidth <= 768;
            const style = isMobile ? {
                display: 'flex',
                width: '40px',
                height: '40px',
                fontSize: '30px'
            } : {
                display: '',
                width: '',
                height: '',
                fontSize: ''
            };
            
            Object.assign(dom.prevBtn.style, style);
            Object.assign(dom.nextBtn.style, style);
        };

        // Debounce resize events for performance
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateArrows, 100);
        });
        
        updateArrows();
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
        this.elements.cardImages.forEach(img => {
            img.addEventListener('dragstart', (e) => e.preventDefault());
            
            // Orientation detection (optimized)
            if (img.complete) {
                this.setImageOrientation(img);
            } else {
                img.addEventListener('load', () => this.setImageOrientation(img), { once: true });
            }
        });
    },

    setImageOrientation(img) {
        const { width, height } = img;
        const orientation = width > height ? 'landscape' : height > width ? 'portrait' : 'square';
        img.setAttribute('data-orientation', orientation);
    }
};

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ImageGallery.init();
}, { once: true });