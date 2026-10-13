/**
 * PhotoStudioMode — Hands-Free Touchless Photo Studio & Gesture Camera Shutter
 *
 * Real-world use case:
 * Taking remote photos, selfies, gym form checks, workshop progress, or group photos
 * without touching your laptop/screen or running to press a shutter button.
 *
 * GESTURE SHUTTER CONTROLS:
 *  🖐️ OPEN PALM (4+ fingers up) ──► Starts 3-second audible countdown (3... 2... 1... SNAP!)
 *  ✌️ PEACE SIGN (2 fingers up)  ──► Instant shutter snap!
 *  ✊ FIST                       ──► Cancel active countdown
 *
 * FEATURES:
 *  • Live viewfinder with Sci-Fi brackets, crosshairs, and rule-of-thirds grid
 *  • Real camera flash & procedural shutter sound
 *  • 5 Photo Filters: Normal, Cyber Cyan, Neon Matrix, Mono Noir, Golden Hour
 *  • Optional high-tech Brahmastra AI watermark badge with live timestamp
 *  • Captured Photos Filmstrip Gallery with instant one-click download
 *  • Touchless air-tap or mouse fallback buttons
 */

import type { InputHand } from '../interaction/InputTypes';

export interface PhotoBridge {
  getVideoElement: () => HTMLVideoElement | null;
  isCameraActive: () => boolean;
  toggleCamera: () => Promise<void>;
  getCanvasElement: () => HTMLCanvasElement;
}

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: string;
  filter: string;
}

export type PhotoFilter = 'normal' | 'cyber' | 'neon' | 'noir' | 'golden';

const FILTERS: { id: PhotoFilter; label: string; css: string }[] = [
  { id: 'normal', label: 'NORMAL', css: 'none' },
  { id: 'cyber', label: 'CYBER CYAN', css: 'hue-rotate(170deg) contrast(1.25) saturate(1.4)' },
  { id: 'neon', label: 'NEON MATRIX', css: 'contrast(1.4) saturate(1.8) brightness(1.05)' },
  { id: 'noir', label: 'MONO NOIR', css: 'grayscale(1) contrast(1.5) brightness(0.95)' },
  { id: 'golden', label: 'GOLDEN HOUR', css: 'sepia(0.4) saturate(1.5) brightness(1.05)' },
];

export class PhotoStudioMode {
  private el: HTMLDivElement | null = null;
  private visible = false;
  private bridge: PhotoBridge | null = null;

  // Shutter state
  private countdownActive = false;
  private countdownSeconds = 3;
  private countdownTimer: number | null = null;
  private activeFilter: PhotoFilter = 'normal';
  private showGrid = true;
  private showWatermark = true;
  private photos: CapturedPhoto[] = [];

  // Gesture state debounce
  private lastTriggerTime = 0;
  private palmHoldDuration = 0;
  private peaceHoldDuration = 0;

  // Audio Context for shutter and countdown beeps
  private audioCtx: AudioContext | null = null;

  // UI refs
  private videoPreview: HTMLVideoElement | null = null;
  private fallbackCanvas: HTMLCanvasElement | null = null;
  private countdownEl: HTMLElement | null = null;
  private flashOverlay: HTMLElement | null = null;
  private galleryEl: HTMLElement | null = null;
  private filterSelectEl: HTMLSelectElement | null = null;
  private gestureBadgeEl: HTMLElement | null = null;

  setBridge(bridge: PhotoBridge): void {
    this.bridge = bridge;
  }

  build(parent: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.className = 'mode-overlay photo-overlay hidden';
    this.el.innerHTML = `
      <div class="mode-header">
        <span class="mode-icon">📸</span>
        <div>
          <div class="mode-title">TOUCHLESS AIR-SHUTTER PHOTO STUDIO</div>
          <div class="mode-sub">Show Open Palm 🖐️ for 3s timer • Peace Sign ✌️ for instant snap • Instant photo download</div>
        </div>
        <div class="photo-status-badge" id="photo-status-badge">CAMERA READY</div>
      </div>

      <div class="photo-studio-grid">

        <!-- VIEWFINDER CONTAINER -->
        <div class="viewfinder-wrapper">
          <div class="viewfinder-frame" id="viewfinder-frame">
            <!-- Live video feed element -->
            <video class="viewfinder-video" id="studio-video" autoplay playsinline muted></video>
            
            <!-- Fallback canvas when video not active -->
            <canvas class="viewfinder-canvas" id="studio-canvas" style="display:none;"></canvas>

            <!-- Sci-Fi Camera HUD Overlay -->
            <div class="camera-hud-overlay">
              <div class="hud-corner top-left"></div>
              <div class="hud-corner top-right"></div>
              <div class="hud-corner bottom-left"></div>
              <div class="hud-corner bottom-right"></div>

              <div class="hud-reticle-center">+</div>

              <div class="hud-grid-lines" id="hud-grid-lines">
                <div class="grid-line horizontal-1"></div>
                <div class="grid-line horizontal-2"></div>
                <div class="grid-line vertical-1"></div>
                <div class="grid-line vertical-2"></div>
              </div>

              <!-- Live Shutter Gesture Indicator Overlay -->
              <div class="gesture-hud-badge" id="gesture-hud-badge">
                🖐️ SHOW OPEN PALM TO START 3s COUNTDOWN
              </div>

              <!-- Large Radial Countdown Overlay -->
              <div class="shutter-countdown-box" id="shutter-countdown" style="display:none;">
                <div class="countdown-number" id="countdown-number">3</div>
                <div class="countdown-sub">HOLD POSE...</div>
              </div>

              <!-- Fullscreen Flash Overlay -->
              <div class="camera-flash" id="camera-flash"></div>
            </div>
          </div>

          <!-- VIEWFINDER CONTROLS BAR -->
          <div class="viewfinder-toolbar">
            <div class="tb-group">
              <button class="studio-btn primary-snap-btn" id="btn-snap-now">
                <span class="btn-icon">📸</span> SNAP PHOTO
              </button>
              <button class="studio-btn timer-btn" id="btn-snap-timer">
                <span class="btn-icon">⏱️</span> 3S TIMER
              </button>
              <button class="studio-btn" id="btn-toggle-cam">
                <span class="btn-icon">🎥</span> TOGGLE CAMERA
              </button>
            </div>

            <div class="tb-group">
              <span class="tb-label">FILTER:</span>
              <select class="studio-select" id="studio-filter-select">
                ${FILTERS.map(f => `<option value="${f.id}">${f.label}</option>`).join('')}
              </select>
              <button class="studio-btn" id="btn-toggle-grid">📐 GRID</button>
              <button class="studio-btn" id="btn-toggle-watermark">🏷️ WATERMARK</button>
            </div>
          </div>
        </div>

        <!-- CAPTURED PHOTOS REEL / GALLERY -->
        <div class="photo-gallery-panel">
          <div class="gallery-header">
            <div class="gallery-title">
              <span>🎞️ CAPTURED SHOTS</span>
              <span class="photo-count-badge" id="photo-count-badge">0 PHOTOS</span>
            </div>
            <div class="gallery-actions">
              <button class="studio-btn small-btn" id="btn-download-all">⬇️ DOWNLOAD ALL</button>
              <button class="studio-btn small-btn danger-btn" id="btn-clear-gallery">🧹 CLEAR</button>
            </div>
          </div>

          <div class="photos-filmstrip" id="photos-filmstrip">
            <div class="empty-gallery-notice" id="empty-gallery-notice">
              <div class="empty-icon">📷</div>
              <div class="empty-text">No photos snapped yet.</div>
              <div class="empty-sub">Raise your hand in the air or click SNAP PHOTO!</div>
            </div>
          </div>
        </div>

      </div>
    `;
    parent.append(this.el);

    this.videoPreview = this.el.querySelector('#studio-video') as HTMLVideoElement;
    this.fallbackCanvas = this.el.querySelector('#studio-canvas') as HTMLCanvasElement;
    this.countdownEl = this.el.querySelector('#shutter-countdown');
    this.flashOverlay = this.el.querySelector('#camera-flash');
    this.galleryEl = this.el.querySelector('#photos-filmstrip');
    this.filterSelectEl = this.el.querySelector('#studio-filter-select') as HTMLSelectElement;
    this.gestureBadgeEl = this.el.querySelector('#gesture-hud-badge');

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.el) return;

    // SNAP NOW button
    this.el.querySelector('#btn-snap-now')?.addEventListener('click', () => {
      this.triggerSnapshot();
    });

    // 3S TIMER button
    this.el.querySelector('#btn-snap-timer')?.addEventListener('click', () => {
      this.startCountdown(3);
    });

    // TOGGLE CAMERA button
    this.el.querySelector('#btn-toggle-cam')?.addEventListener('click', () => {
      if (this.bridge) {
        void this.bridge.toggleCamera().then(() => this.syncVideoFeed());
      }
    });

    // Filter selector
    this.filterSelectEl?.addEventListener('change', () => {
      this.setFilter(this.filterSelectEl?.value as PhotoFilter);
    });

    // Grid toggle
    this.el.querySelector('#btn-toggle-grid')?.addEventListener('click', () => {
      this.showGrid = !this.showGrid;
      const grid = this.el?.querySelector('#hud-grid-lines') as HTMLElement;
      if (grid) grid.style.display = this.showGrid ? 'block' : 'none';
      const btn = this.el?.querySelector('#btn-toggle-grid');
      if (btn) btn.classList.toggle('active', this.showGrid);
    });

    // Watermark toggle
    this.el.querySelector('#btn-toggle-watermark')?.addEventListener('click', () => {
      this.showWatermark = !this.showWatermark;
      const btn = this.el?.querySelector('#btn-toggle-watermark');
      if (btn) btn.classList.toggle('active', this.showWatermark);
    });

    // Download all
    const downloadAllBtn = this.el.querySelector('#btn-download-all');
    downloadAllBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.downloadAllPhotos();
    });

    // Clear gallery
    const clearBtn = this.el.querySelector('#btn-clear-gallery');
    clearBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.photos = [];
      this.renderGallery();
    });
  }

  private initAudio(): void {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine'): void {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  private playShutterSound(): void {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      // High-frequency mechanical shutter click
      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1400, now);
      osc1.frequency.exponentialRampToValueAtTime(300, now + 0.08);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.08);

      // Followed by mirror slap 60ms later
      setTimeout(() => {
        if (!this.audioCtx) return;
        const now2 = this.audioCtx.currentTime;
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(440, now2);
        osc2.frequency.exponentialRampToValueAtTime(100, now2 + 0.12);
        gain2.gain.setValueAtTime(0.25, now2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.12);
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.start(now2);
        osc2.stop(now2 + 0.12);
      }, 60);
    } catch {
      // Audio fallback
    }
  }

  private setFilter(filterId: PhotoFilter): void {
    this.activeFilter = filterId;
    const filterDef = FILTERS.find(f => f.id === filterId);
    if (!filterDef || !this.videoPreview) return;
    this.videoPreview.style.filter = filterDef.css;
    if (this.filterSelectEl) this.filterSelectEl.value = filterId;
  }

  private syncVideoFeed(): void {
    const rawVideo = this.bridge?.getVideoElement();
    if (rawVideo && rawVideo.srcObject && this.videoPreview) {
      this.videoPreview.srcObject = rawVideo.srcObject;
      this.videoPreview.style.display = 'block';
      if (this.fallbackCanvas) this.fallbackCanvas.style.display = 'none';
      const status = this.el?.querySelector('#photo-status-badge');
      if (status) {
        status.textContent = 'OPTICAL FEED LIVE';
        status.classList.add('live');
      }
    } else {
      if (this.videoPreview) this.videoPreview.style.display = 'none';
      if (this.fallbackCanvas) this.fallbackCanvas.style.display = 'block';
      const status = this.el?.querySelector('#photo-status-badge');
      if (status) {
        status.textContent = 'CAMERA OFF — CLICK TOGGLE CAMERA';
        status.classList.remove('live');
      }
    }
  }

  startCountdown(seconds = 3): void {
    if (this.countdownActive) return;
    this.countdownActive = true;
    this.countdownSeconds = seconds;

    if (this.countdownEl) this.countdownEl.style.display = 'flex';
    const numberEl = this.el?.querySelector('#countdown-number');
    if (numberEl) numberEl.textContent = String(this.countdownSeconds);

    this.playTone(880, 0.18, 'sine'); // 880Hz beep for countdown

    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownTimer = window.setInterval(() => {
      this.countdownSeconds--;
      if (this.countdownSeconds > 0) {
        if (numberEl) numberEl.textContent = String(this.countdownSeconds);
        this.playTone(880, 0.18, 'sine');
      } else {
        clearInterval(this.countdownTimer!);
        this.countdownTimer = null;
        this.countdownActive = false;
        if (this.countdownEl) this.countdownEl.style.display = 'none';
        this.playTone(1760, 0.25, 'sine'); // High pitch snap alert
        this.triggerSnapshot();
      }
    }, 1000);
  }

  cancelCountdown(): void {
    if (!this.countdownActive) return;
    this.countdownActive = false;
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.countdownEl) this.countdownEl.style.display = 'none';
    this.playTone(330, 0.15, 'sawtooth');
  }

  triggerSnapshot(): void {
    // 1. Fullscreen camera flash
    if (this.flashOverlay) {
      this.flashOverlay.classList.remove('active');
      void this.flashOverlay.offsetWidth; // trigger reflow
      this.flashOverlay.classList.add('active');
    }

    // 2. Play mechanical shutter sound
    this.playShutterSound();

    // 3. Capture frame from video or 3D canvas
    const rawVideo = this.bridge?.getVideoElement();
    const threeCanvas = this.bridge?.getCanvasElement();

    const captureCanvas = document.createElement('canvas');
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;

    if (rawVideo && rawVideo.videoWidth > 0 && rawVideo.videoHeight > 0) {
      captureCanvas.width = rawVideo.videoWidth;
      captureCanvas.height = rawVideo.videoHeight;

      // Apply selected filter to canvas context
      const filterDef = FILTERS.find(f => f.id === this.activeFilter);
      if (filterDef && filterDef.css !== 'none') {
        ctx.filter = filterDef.css;
      }

      // Draw mirrored video frame (natural selfie orientation)
      ctx.save();
      ctx.translate(captureCanvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(rawVideo, 0, 0, captureCanvas.width, captureCanvas.height);
      ctx.restore();
    } else if (threeCanvas) {
      // Fallback: capture current 3D canvas frame
      captureCanvas.width = threeCanvas.width;
      captureCanvas.height = threeCanvas.height;
      ctx.drawImage(threeCanvas, 0, 0);
    } else {
      captureCanvas.width = 1280;
      captureCanvas.height = 720;
      ctx.fillStyle = '#061325';
      ctx.fillRect(0, 0, 1280, 720);
    }

    // 4. Optional high-tech Brahmastra AI Watermark
    if (this.showWatermark) {
      ctx.filter = 'none';
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 8);
      const w = captureCanvas.width;
      const h = captureCanvas.height;

      // Dark translucent badge on bottom right
      ctx.fillStyle = 'rgba(0, 8, 20, 0.75)';
      ctx.fillRect(w - 380, h - 56, 360, 42);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w - 380, h - 56, 360, 42);

      // Watermark text
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 15px "Courier New", monospace';
      ctx.fillText('BRAHMASTRA AI • AIR SHUTTER', w - 365, h - 35);
      ctx.fillStyle = '#ffb340';
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText(`${dateStr} ${timeStr}`, w - 365, h - 20);
    }

    // 5. Convert to image URL & add to gallery
    const dataUrl = captureCanvas.toDataURL('image/png');
    const photo: CapturedPhoto = {
      id: `snap_${Date.now()}`,
      dataUrl,
      timestamp: new Date().toLocaleTimeString(),
      filter: this.activeFilter.toUpperCase(),
    };

    this.photos.unshift(photo);
    this.renderGallery();
  }

  private renderGallery(): void {
    if (!this.galleryEl) return;
    const countBadge = this.el?.querySelector('#photo-count-badge');
    if (countBadge) countBadge.textContent = `${this.photos.length} PHOTOS`;

    if (this.photos.length === 0) {
      this.galleryEl.innerHTML = `
        <div class="empty-gallery-notice" id="empty-gallery-notice">
          <div class="empty-icon">📷</div>
          <div class="empty-text">No photos snapped yet.</div>
          <div class="empty-sub">Raise your hand in the air or click SNAP PHOTO!</div>
        </div>
      `;
      return;
    }

    this.galleryEl.innerHTML = this.photos.map(p => `
      <div class="photo-card" data-id="${p.id}">
        <img class="photo-thumb" src="${p.dataUrl}" alt="Snapshot at ${p.timestamp}" />
        <div class="photo-info-bar">
          <span class="photo-time">${p.timestamp}</span>
          <span class="photo-filter-tag">${p.filter}</span>
        </div>
        <div class="photo-overlay-actions">
          <button class="photo-action-btn download-btn" data-download-id="${p.id}" title="Download Photo">
            ⬇️
          </button>
          <button class="photo-action-btn delete-btn" data-delete-id="${p.id}" title="Delete Photo">
            🗑️
          </button>
        </div>
      </div>
    `).join('');

    // Attach individual download listeners
    this.galleryEl.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-download-id');
        const photo = this.photos.find(p => p.id === id);
        if (photo) this.downloadPhoto(photo);
      });
    });

    // Attach delete listeners
    this.galleryEl.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-delete-id');
        if (id) {
          this.photos = this.photos.filter(p => p.id !== id);
          this.renderGallery();
        }
      });
    });
  }

  private downloadPhoto(photo: CapturedPhoto): void {
    try {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = photo.dataUrl;
      a.download = `brahmastra_${photo.id}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 200);
    } catch (err) {
      console.error('Photo download failed:', err);
    }
  }

  private downloadAllPhotos(): void {
    if (this.photos.length === 0) return;
    const btn = this.el?.querySelector('#btn-download-all') as HTMLElement | null;
    const oldText = btn?.textContent ?? '⬇️ DOWNLOAD ALL';
    if (btn) btn.textContent = '⏳ DOWNLOADING...';

    this.photos.forEach((p, idx) => {
      setTimeout(() => {
        this.downloadPhoto(p);
        if (idx === this.photos.length - 1 && btn) {
          setTimeout(() => {
            btn.textContent = '✅ SAVED ALL!';
            setTimeout(() => {
              if (btn) btn.textContent = oldText;
            }, 1200);
          }, 300);
        }
      }, idx * 250);
    });
  }

  /**
   * Called every animation frame from main.ts
   * Inspects hand gestures in mid-air to trigger camera shutter!
   */
  update(dt: number, hands: InputHand[]): void {
    if (!this.visible || !this.el) return;

    // Check if camera feed needs resyncing
    if (this.videoPreview && !this.videoPreview.srcObject) {
      this.syncVideoFeed();
    }

    const hand = hands.find(h => h.active);
    const now = performance.now();

    if (!hand) {
      this.palmHoldDuration = 0;
      this.peaceHoldDuration = 0;
      if (this.gestureBadgeEl) {
        this.gestureBadgeEl.textContent = '🖐️ SHOW OPEN PALM TO START 3s COUNTDOWN';
        this.gestureBadgeEl.classList.remove('active');
      }
      return;
    }

    const isPalm = hand.gesture === 'OPEN_PALM' || hand.extendedCount >= 4;
    const isPeace = hand.gesture === 'TWO_FINGER' || (hand.extension[1] > 0.7 && hand.extension[2] > 0.7 && hand.extension[3] < 0.3 && hand.extension[4] < 0.3);
    const isFist = hand.gesture === 'FIST' || hand.extendedCount === 0;

    // ── 1. CANCEL COUNTDOWN ON FIST ──
    if (isFist && this.countdownActive) {
      this.cancelCountdown();
      if (this.gestureBadgeEl) {
        this.gestureBadgeEl.textContent = '✊ FIST DETECTED — COUNTDOWN CANCELLED';
      }
      return;
    }

    // ── 2. INSTANT SNAP ON PEACE SIGN ✌️ ──
    if (isPeace) {
      this.peaceHoldDuration += dt;
      if (this.gestureBadgeEl) {
        this.gestureBadgeEl.textContent = '✌️ PEACE SIGN DETECTED — INSTANT SHUTTER!';
        this.gestureBadgeEl.classList.add('active');
      }
      // Trigger after holding peace sign for 0.4s to prevent accidental triggers
      if (this.peaceHoldDuration >= 0.4 && now - this.lastTriggerTime > 2000) {
        this.lastTriggerTime = now;
        this.peaceHoldDuration = 0;
        this.triggerSnapshot();
      }
      return;
    } else {
      this.peaceHoldDuration = 0;
    }

    // ── 3. 3-SECOND COUNTDOWN ON OPEN PALM 🖐️ ──
    if (isPalm && !this.countdownActive) {
      this.palmHoldDuration += dt;
      if (this.gestureBadgeEl) {
        this.gestureBadgeEl.textContent = '🖐️ OPEN PALM DETECTED — HOLD FOR TIMER...';
        this.gestureBadgeEl.classList.add('active');
      }
      // Start 3s countdown once held for 0.5s
      if (this.palmHoldDuration >= 0.5 && now - this.lastTriggerTime > 2500) {
        this.lastTriggerTime = now;
        this.palmHoldDuration = 0;
        this.startCountdown(3);
      }
    } else if (!this.countdownActive) {
      this.palmHoldDuration = 0;
      if (this.gestureBadgeEl) {
        this.gestureBadgeEl.textContent = '🖐️ SHOW OPEN PALM FOR 3s TIMER • ✌️ PEACE FOR INSTANT SNAP';
        this.gestureBadgeEl.classList.remove('active');
      }
    }
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.el?.classList.toggle('hidden', !v);
    if (v) {
      this.syncVideoFeed();
    } else {
      this.cancelCountdown();
    }
  }

  dispose(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.audioCtx) void this.audioCtx.close();
    this.el?.remove();
  }
}
