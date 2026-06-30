/* ═══════════════════════════════════════════════
   FCUK – Scroll Animation Engine v2
   Optimized for Mobile · Tablet · Desktop
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── Configuration ───
    const CONFIG = {
        totalFrames: 240,
        framesDir: 'frames/',
        filenamePrefix: 'ezgif-frame-',
        filenameExt: '.jpg',
        pad: 3,
        canvasWidth: 1920,
        canvasHeight: 1080,
        // Adaptive canvas scale: lower on mobile for performance
        getCanvasScale: () => {
            const dpr = window.devicePixelRatio || 1;
            const width = window.innerWidth;
            // On small screens (< 768px), cap effective DPR to save GPU memory
            if (width < 768) return Math.min(dpr, 1.5);
            if (width < 1024) return Math.min(dpr, 2);
            return dpr;
        },
        // Batch loading: chunk size for mobile memory
        getBatchSize: () => {
            const width = window.innerWidth;
            if (width < 480) return 20;
            if (width < 768) return 40;
            return 60;
        },
        // Whether to use high smoothing quality
        getHighQualitySmoothing: () => window.innerWidth >= 1024,
    };

    // ─── State ───
    const state = {
        frames: [],
        loadedCount: 0,
        currentFrameIndex: -1,
        currentProgress: 0,
        stageOffsetTop: 0,
        stageScrollHeight: 0,
        isInView: false,
        isInitialized: false,
        animationId: null,
        isPaused: false,
        canvasScale: 1,
    };

    // ─── DOM Refs ───
    const $ = (sel) => document.querySelector(sel);
    const canvas = $('#animationCanvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    const preloader = $('#preloader');
    const loaderFill = $('#loaderFill');
    const loaderText = $('#loaderText');
    const stage = $('#animation-stage');
    const navbar = $('#navbar');
    const menuToggle = $('#menuToggle');
    const navLinks = $('#navLinks');

    // ═══════════════════════════════════════════════
    //  PREVENT SCROLL RESTORATION
    // ═══════════════════════════════════════════════
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);

    // ═══════════════════════════════════════════════
    //  HELPER: Zero-pad
    // ═══════════════════════════════════════════════
    function pad(n) {
        return String(n).padStart(CONFIG.pad, '0');
    }

    // ═══════════════════════════════════════════════
    //  DETECT MOBILE / TOUCH
    // ═══════════════════════════════════════════════
    function isMobile() {
        return window.innerWidth < 768;
    }

    // ═══════════════════════════════════════════════
    //  CANVAS SETUP — adaptive resolution
    // ═══════════════════════════════════════════════
    function setupCanvas() {
        const wrap = canvas.parentElement;
        const rect = wrap.getBoundingClientRect();
        const maxW = rect.width;
        const maxH = rect.height;
        const ratio = CONFIG.canvasWidth / CONFIG.canvasHeight;

        let displayW = maxW;
        let displayH = maxW / ratio;
        if (displayH > maxH) {
            displayH = maxH;
            displayW = maxH * ratio;
        }

        // Adaptive internal resolution based on device
        const dpr = window.devicePixelRatio || 1;
        const targetScale = CONFIG.getCanvasScale();

        // Scale down internal resolution on mobile to save GPU memory
        const scaleFactor = Math.max(1, dpr / targetScale);
        const internalW = Math.round(CONFIG.canvasWidth / scaleFactor);
        const internalH = Math.round(CONFIG.canvasHeight / scaleFactor);

        // Set canvas internal resolution
        canvas.width = Math.max(internalW, Math.round(CONFIG.canvasWidth / 3));
        canvas.height = Math.max(internalH, Math.round(CONFIG.canvasHeight / 3));

        // Set display size
        canvas.style.width = displayW + 'px';
        canvas.style.height = displayH + 'px';

        // Quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = CONFIG.getHighQualitySmoothing() ? 'high' : 'low';

        // Draw black background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // ═══════════════════════════════════════════════
    //  RECALCULATE STAGE DIMENSIONS
    // ═══════════════════════════════════════════════
    function recalcStageDimensions() {
        state.stageOffsetTop = stage.offsetTop;
        state.stageScrollHeight = stage.offsetHeight - window.innerHeight;
    }

    // ═══════════════════════════════════════════════
    //  PRELOAD FRAMES — batched for mobile memory
    // ═══════════════════════════════════════════════
    function preloadFrames() {
        return new Promise((resolve) => {
            const { totalFrames, framesDir, filenamePrefix, filenameExt } = CONFIG;
            state.frames = new Array(totalFrames);
            state.loadedCount = 0;

            const batchSize = CONFIG.getBatchSize();
            let currentBatch = 0;
            let totalBatches = Math.ceil(totalFrames / batchSize);

            function loadBatch() {
                const start = currentBatch * batchSize;
                const end = Math.min(start + batchSize, totalFrames);
                let batchLoaded = 0;
                const batchCount = end - start;

                for (let i = start; i < end; i++) {
                    const img = new Image();
                    const idx = i;

                    img.onload = () => {
                        state.frames[idx] = img;
                        batchLoaded++;
                        onFrameLoaded(resolve);
                        checkBatchComplete();
                    };

                    img.onerror = () => {
                        const fallback = document.createElement('canvas');
                        fallback.width = CONFIG.canvasWidth;
                        fallback.height = CONFIG.canvasHeight;
                        const fctx = fallback.getContext('2d');
                        fctx.fillStyle = '#111111';
                        fctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
                        fctx.fillStyle = '#333333';
                        fctx.font = 'bold 28px Inter, sans-serif';
                        fctx.textAlign = 'center';
                        fctx.textBaseline = 'middle';
                        fctx.fillText('Frame ' + (i + 1), CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2);
                        state.frames[idx] = fallback;
                        batchLoaded++;
                        onFrameLoaded(resolve);
                        checkBatchComplete();
                    };

                    img.src = framesDir + filenamePrefix + pad(i + 1) + filenameExt;
                }

                function checkBatchComplete() {
                    if (batchLoaded >= batchCount) {
                        currentBatch++;
                        if (currentBatch < totalBatches) {
                            if ('requestIdleCallback' in window) {
                                requestIdleCallback(() => loadBatch(), { timeout: 1000 });
                            } else {
                                setTimeout(() => loadBatch(), 50);
                            }
                        }
                    }
                }
            }

            loadBatch();
        });
    }

    function onFrameLoaded(resolve) {
        state.loadedCount++;
        const pct = Math.round((state.loadedCount / CONFIG.totalFrames) * 100);
        if (loaderFill) loaderFill.style.width = pct + '%';
        if (loaderText) loaderText.textContent = 'Loading frames… ' + pct + '%';
        if (state.loadedCount >= CONFIG.totalFrames) {
            resolve();
        }
    }

    // ═══════════════════════════════════════════════
    //  DRAW A FRAME ON CANVAS
    // ═══════════════════════════════════════════════
    function drawFrame(index) {
        const img = state.frames[index];
        if (!img) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    // ═══════════════════════════════════════════════
    //  UPDATE FRAME FROM SCROLL POSITION
    // ═══════════════════════════════════════════════
    function updateFromScroll() {
        const scrollY = window.scrollY;
        const offsetTop = state.stageOffsetTop;
        const scrollHeight = state.stageScrollHeight;

        const scrolledInto = scrollY - offsetTop;

        let progress = 0;
        if (scrollHeight > 0) {
            progress = Math.max(0, Math.min(1, scrolledInto / scrollHeight));
        }

        state.currentProgress = progress;

        const frameIndex = Math.round(progress * (CONFIG.totalFrames - 1));

        if (frameIndex !== state.currentFrameIndex) {
            state.currentFrameIndex = frameIndex;
            drawFrame(frameIndex);
        }
    }

    // ═══════════════════════════════════════════════
    //  RAF LOOP — pauses when stage is out of view
    // ═══════════════════════════════════════════════
    function tick() {
        if (state.isPaused) {
            state.animationId = null;
            return;
        }
        updateFromScroll();
        state.animationId = requestAnimationFrame(tick);
    }

    function startAnimationLoop() {
        if (state.animationId) return;
        state.isPaused = false;
        state.animationId = requestAnimationFrame(tick);
    }

    function stopAnimationLoop() {
        state.isPaused = true;
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }
    }

    // ═══════════════════════════════════════════════
    //  INTERSECTION OBSERVER — pause when hidden
    // ═══════════════════════════════════════════════
    let observer = null;

    function setupIntersectionObserver() {
        observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    state.isInView = entry.isIntersecting;
                    if (entry.isIntersecting) {
                        startAnimationLoop();
                    } else {
                        stopAnimationLoop();
                    }
                }
            },
            {
                root: null,
                rootMargin: '200px 0px',
                threshold: 0,
            }
        );
        observer.observe(stage);
    }

    // ═══════════════════════════════════════════════
    //  MOBILE MENU
    // ═══════════════════════════════════════════════
    function setupMobileMenu() {
        if (!menuToggle || !navLinks) return;

        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('open');
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
            });
        });

        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                navLinks.classList.remove('open');
            }
        });
    }

    // ═══════════════════════════════════════════════
    //  NAVBAR AUTO-HIDE (RAF-throttled)
    // ═══════════════════════════════════════════════
    function setupNavbarAutoHide() {
        if (!navbar) return;

        let lastScrollY = 0;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const sy = window.scrollY;
                    if (sy > lastScrollY && sy > 100) {
                        navbar.style.transform = 'translateY(-100%)';
                    } else {
                        navbar.style.transform = 'translateY(0)';
                    }
                    lastScrollY = sy;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ═══════════════════════════════════════════════
    //  HANDLE RESIZE — debounced via RAF
    // ═══════════════════════════════════════════════
    function handleResize() {
        setupCanvas();
        // Wait for layout to settle after resize
        requestAnimationFrame(() => {
            recalcStageDimensions();
            if (state.currentFrameIndex >= 0) {
                drawFrame(state.currentFrameIndex);
            }
        });
    }

    let resizeTimer = null;

    function debouncedResize() {
        if (resizeTimer) {
            cancelAnimationFrame(resizeTimer);
        }
        resizeTimer = requestAnimationFrame(() => {
            handleResize();
            resizeTimer = null;
        });
    }

    // ═══════════════════════════════════════════════
    //  SCROLL INDICATOR — RAF-throttled
    // ═══════════════════════════════════════════════
    let scrollIndicator = null;

    function setupScrollIndicator() {
        scrollIndicator = document.querySelector('.scroll-indicator');
        if (!scrollIndicator) return;

        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    if (window.scrollY > window.innerHeight * 0.8) {
                        scrollIndicator.style.opacity = '0';
                        scrollIndicator.style.pointerEvents = 'none';
                    } else {
                        scrollIndicator.style.opacity = '1';
                        scrollIndicator.style.pointerEvents = 'auto';
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // ═══════════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════════
    async function init() {
        // 1. Setup canvas (adaptive resolution)
        setupCanvas();

        // 2. Wait for layout, then calc dimensions
        await new Promise((r) => requestAnimationFrame(r));
        recalcStageDimensions();

        // 3. Preload frames (batched to save memory)
        await preloadFrames();

        // 4. Hide preloader
        preloader.classList.add('hidden');

        // 5. Draw first frame
        state.currentFrameIndex = -1;
        updateFromScroll();

        // 6. Set up event listeners
        setupMobileMenu();
        setupNavbarAutoHide();
        setupScrollIndicator();
        setupIntersectionObserver();

        // 7. Resize handling
        window.addEventListener('resize', debouncedResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(debouncedResize, 300);
        });

        // 8. Start animation loop
        startAnimationLoop();

        state.isInitialized = true;
    }

    // ─── Boot ───
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
