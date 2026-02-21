// ===== main.js - Combined and optimized =====

// ===== CORE UTILITIES =====
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

    dom.slideMenuCloseText.addEventListener('click', closeMenu);

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
    let startX, scrollLeft, startTime, startY;
    let dragDistance = 0;
    let isHorizontalScroll = false;
    let initialScrollLeft = 0;

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

    // ===== FIXED TOUCH EVENTS FOR MOBILE =====
    track.addEventListener('touchstart', (e) => {
        isDragging = true;
        track.classList.add('dragging');
        startX = e.touches[0].pageX;
        startY = e.touches[0].pageY;
        scrollLeft = track.scrollLeft;
        initialScrollLeft = track.scrollLeft;
        startTime = Date.now();
        dragDistance = 0;
        isHorizontalScroll = false;
        
        // Don't prevent default on touchstart - let the browser decide
    });

    track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        const currentX = e.touches[0].pageX;
        const currentY = e.touches[0].pageY;
        const diffX = currentX - startX;
        const diffY = currentY - startY;
        const absDiffX = Math.abs(diffX);
        const absDiffY = Math.abs(diffY);
        
        // Determine scroll direction
        if (!isHorizontalScroll) {
            // If horizontal movement is greater AND track can scroll horizontally
            if (absDiffX > absDiffY && absDiffX > 5) {
                isHorizontalScroll = true;
                // Prevent default ONLY when we're sure it's horizontal scroll
                e.preventDefault();
            }
            // If vertical movement is greater, let the browser handle it
            else if (absDiffY > absDiffX && absDiffY > 5) {
                // This is a vertical scroll - clean up dragging state
                isDragging = false;
                track.classList.remove('dragging');
                return; // Exit without preventing default
            }
        }
        
        // Handle horizontal scrolling
        if (isHorizontalScroll) {
            e.preventDefault(); // Prevent page scroll while horizontally dragging
            
            // Calculate new scroll position
            const walk = diffX;
            dragDistance = absDiffX;
            
            // Apply horizontal scroll
            track.scrollLeft = scrollLeft - walk;
            
            // Update visual feedback
            if (absDiffX > this.config.dragThreshold) {
                // We're definitely scrolling, not tapping
            }
        }
    });

    track.addEventListener('touchend', (e) => {
        if (!isDragging) {
            // Clean up if we already determined it was vertical scroll
            track.classList.remove('dragging');
            return;
        }
        
        track.classList.remove('dragging');
        
        // Calculate if this was a tap (for opening modal)
        const touchEndTime = Date.now();
        const timeDiff = touchEndTime - startTime;
        const wasTap = dragDistance <= this.config.dragThreshold && timeDiff < 200;
        const didScroll = Math.abs(track.scrollLeft - initialScrollLeft) > 10;
        
        // Only open modal if it was a tap AND we didn't scroll
        if (wasTap && !didScroll && e.changedTouches.length > 0) {
            this.handleTouchTap(e, track);
        }
        
        isDragging = false;
        isHorizontalScroll = false;
    });

    // Cancel touch events if they get interrupted
    track.addEventListener('touchcancel', () => {
        isDragging = false;
        isHorizontalScroll = false;
        track.classList.remove('dragging');
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
        dom.modal.addEventListener('click', (e) => {
            if (e.target === dom.modal || e.target.classList.contains('modal-container')) {
                this.closeModal();
            }
        });

        // ===== NEW: Touch swipe navigation for mobile =====
        this.initModalSwipe();
        
        // ===== NEW: Make arrows visible on mobile =====
        this.initMobileArrows();
    },

    initModalSwipe() {
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;
        const minSwipeDistance = 50; // Minimum pixels to consider a swipe
        const maxVerticalDeviation = 30; // Maximum vertical movement allowed for horizontal swipe

        dom.modal.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        dom.modal.addEventListener('touchend', (e) => {
            if (!dom.modal.classList.contains('active')) return;
            
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            
            const horizontalDistance = touchEndX - touchStartX;
            const verticalDistance = Math.abs(touchEndY - touchStartY);
            
            // Only trigger if horizontal swipe and not too much vertical movement
            if (Math.abs(horizontalDistance) > minSwipeDistance && verticalDistance < maxVerticalDeviation) {
                if (horizontalDistance > 0) {
                    // Swipe right → previous image
                    console.log('Swipe right - previous image');
                    this.navigateModal(-1);
                } else {
                    // Swipe left → next image
                    console.log('Swipe left - next image');
                    this.navigateModal(1);
                }
            }
        }, { passive: true });

        // Optional: Add visual feedback during swipe
        dom.modal.addEventListener('touchmove', (e) => {
            if (!dom.modal.classList.contains('active')) return;
            
            const currentX = e.changedTouches[0].screenX;
            const diffX = currentX - touchStartX;
            
            // Only add visual feedback if swiping horizontally
            if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(e.changedTouches[0].screenY - touchStartY)) {
                // Slightly move the image to show swipe direction
                const translateX = diffX * 0.3; // Dampen the movement
                dom.modalImage.style.transform = `translateX(${translateX}px) scale(0.98)`;
                dom.modalImage.style.transition = 'none';
            }
        }, { passive: true });

        // Reset image position
        dom.modal.addEventListener('touchcancel', () => {
            dom.modalImage.style.transform = '';
            dom.modalImage.style.transition = '';
        });

        dom.modal.addEventListener('touchend', () => {
            dom.modalImage.style.transform = '';
            dom.modalImage.style.transition = '';
        });
    },

    initMobileArrows() {
        // Make sure arrows are visible on mobile
        const checkMobile = () => {
            const isMobile = window.innerWidth <= 768;
            
            if (dom.prevBtn && dom.nextBtn) {
                if (isMobile) {
                    // Ensure arrows are visible but maybe smaller
                    dom.prevBtn.style.display = 'flex';
                    dom.nextBtn.style.display = 'flex';
                    
                    // Optional: Adjust position for mobile
                    dom.prevBtn.style.width = '40px';
                    dom.prevBtn.style.height = '40px';
                    dom.prevBtn.style.fontSize = '30px';
                    dom.nextBtn.style.width = '40px';
                    dom.nextBtn.style.height = '40px';
                    dom.nextBtn.style.fontSize = '30px';
                } else {
                    // Reset to default styles
                    dom.prevBtn.style.display = '';
                    dom.nextBtn.style.display = '';
                }
            }
        };

        // Check on load and resize
        checkMobile();
        window.addEventListener('resize', checkMobile);
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