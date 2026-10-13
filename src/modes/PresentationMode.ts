/**
 * PresentationMode — Gesture-Controlled Slide Controller
 *
 * SWIPE → advance/go back slides
 * POINT → laser pointer on screen
 * FIST → pause / black slide
 * OPEN_PALM → resume
 * TWO_FINGER → scroll
 *
 * Works with Google Slides, PowerPoint Online, or any fullscreen browser content.
 */

import type { InputHand } from '../interaction/InputTypes';

export class PresentationMode {
  private el: HTMLDivElement | null = null;
  private visible = false;

  private slideCount = 0;
  private currentSlide = 0;
  private isPaused = false;
  private laserEl: HTMLElement | null = null;
  private gestureStatus: HTMLElement | null = null;
  private slideCounter: HTMLElement | null = null;
  private swipeCooldown = 0;
  private pauseLatch = false;
  private logEl: HTMLElement | null = null;

  build(parent: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.className = 'mode-overlay slides-overlay hidden';
    this.el.innerHTML = `
      <div class="mode-header">
        <span class="mode-icon">🎤</span>
        <div>
          <div class="mode-title">PRESENTATION CONTROLLER</div>
          <div class="mode-sub">Control any presentation with gestures — no clicker needed</div>
        </div>
        <div class="slides-counter" id="slides-counter">SLIDE — / —</div>
      </div>

      <div class="slides-body">

        <!-- GESTURE REFERENCE -->
        <div class="slides-card gesture-ref">
          <div class="rehab-card-title">GESTURE MAP</div>
          <div class="gesture-map-grid">
            <div class="gmap-item"><span class="gmap-icon">👉</span><div><b>SWIPE RIGHT</b><br>Next Slide</div></div>
            <div class="gmap-item"><span class="gmap-icon">👈</span><div><b>SWIPE LEFT</b><br>Previous Slide</div></div>
            <div class="gmap-item"><span class="gmap-icon">☝️</span><div><b>POINT</b><br>Laser Pointer</div></div>
            <div class="gmap-item"><span class="gmap-icon">✊</span><div><b>FIST</b><br>Pause / Black</div></div>
            <div class="gmap-item"><span class="gmap-icon">🖐</span><div><b>OPEN PALM</b><br>Resume Slide</div></div>
            <div class="gmap-item"><span class="gmap-icon">✌️</span><div><b>TWO FINGER</b><br>Scroll Down</div></div>
          </div>
        </div>

        <!-- LIVE STATUS -->
        <div class="slides-card status-card">
          <div class="rehab-card-title">LIVE STATUS</div>
          <div class="slides-gesture-big" id="slides-gesture">STANDBY</div>
          <div class="slides-pause-banner" id="slides-pause" style="display:none">
            ⏸ PRESENTATION PAUSED
          </div>

          <div class="slides-setup">
            <div class="rehab-card-title" style="margin-top:1rem">SLIDE COUNT</div>
            <div class="slides-setup-row">
              <button class="sign-btn" id="slides-dec">−</button>
              <span id="slides-total-display" style="font-size:1.5rem;color:#2ff3ff;padding:0 1rem">10</span>
              <button class="sign-btn" id="slides-inc">+</button>
            </div>
            <div style="margin-top:0.5rem;font-size:0.75rem;color:#2ff3ff88">Set your total slide count</div>
          </div>
        </div>

        <!-- SLIDE NAVIGATOR -->
        <div class="slides-card nav-card">
          <div class="rehab-card-title">SLIDE NAVIGATOR</div>
          <div class="slide-nav">
            <button class="slide-arrow" id="slide-prev">◀</button>
            <div class="slide-display">
              <div class="slide-number" id="slide-number">1</div>
              <div class="slide-total" id="slide-total">/ 10</div>
            </div>
            <button class="slide-arrow" id="slide-next">▶</button>
          </div>
          <div class="slide-progress-wrap">
            <div class="slide-progress-bar" id="slide-progress"></div>
          </div>
        </div>

        <!-- ACTION LOG -->
        <div class="slides-card log-card">
          <div class="rehab-card-title">ACTION LOG</div>
          <div class="slides-log" id="slides-log"></div>
        </div>

        <!-- INSTRUCTIONS -->
        <div class="slides-card instructions-card">
          <div class="rehab-card-title">QUICK START</div>
          <ol class="slides-steps">
            <li>Open your presentation in <b>another browser tab</b> or window</li>
            <li>Go <b>fullscreen</b> in your presentation app (F11 or presentation mode)</li>
            <li>Come back here and use <b>gestures</b> to control it</li>
            <li>The gestures send <b>arrow key presses</b> to the browser</li>
            <li>Works with <b>Google Slides, PowerPoint Online, Canva</b></li>
          </ol>
          <button class="sign-btn" id="slides-fullscreen" style="margin-top:1rem;width:100%">⛶ FOCUS PRESENTATION WINDOW</button>
        </div>

      </div>

      <div class="laser-pointer" id="laser-pointer"></div>
    `;
    parent.append(this.el);

    this.gestureStatus = this.el.querySelector('#slides-gesture');
    this.laserEl = this.el.querySelector('#laser-pointer');
    this.logEl = this.el.querySelector('#slides-log');
    this.slideCounter = this.el.querySelector('#slides-counter');

    this.slideCount = 10;
    this.currentSlide = 1;
    this.updateSlideDisplay();

    this.el.querySelector('#slide-prev')?.addEventListener('click', () => this.prevSlide());
    this.el.querySelector('#slide-next')?.addEventListener('click', () => this.nextSlide());
    this.el.querySelector('#slides-inc')?.addEventListener('click', () => {
      this.slideCount++;
      const el = this.el?.querySelector('#slides-total-display');
      if (el) el.textContent = String(this.slideCount);
      this.updateSlideDisplay();
    });
    this.el.querySelector('#slides-dec')?.addEventListener('click', () => {
      if (this.slideCount > 1) this.slideCount--;
      const el = this.el?.querySelector('#slides-total-display');
      if (el) el.textContent = String(this.slideCount);
      this.updateSlideDisplay();
    });
    this.el.querySelector('#slides-fullscreen')?.addEventListener('click', () => {
      this.log('📋 Focus your presentation window and use gestures');
    });
  }

  update(dt: number, hands: InputHand[]): void {
    if (!this.visible || !this.el) return;

    this.swipeCooldown = Math.max(0, this.swipeCooldown - dt);

    const hand = hands.find(h => h.active);
    if (!hand) {
      if (this.gestureStatus) this.gestureStatus.textContent = 'NO HAND — SHOW HAND TO CAMERA';
      if (this.laserEl) this.laserEl.style.opacity = '0';
      return;
    }

    const gesture = hand.gesture;

    if (this.gestureStatus) this.gestureStatus.textContent = gesture;

    // FIST = pause
    if (gesture === 'FIST' && !this.pauseLatch) {
      this.pauseLatch = true;
      this.isPaused = !this.isPaused;
      const banner = this.el.querySelector('#slides-pause') as HTMLElement;
      if (banner) banner.style.display = this.isPaused ? 'block' : 'none';
      this.log(this.isPaused ? '⏸ Presentation PAUSED' : '▶ Presentation RESUMED');
      this.sendKey(this.isPaused ? 'b' : ' ');
    } else if (gesture !== 'FIST') {
      this.pauseLatch = false;
    }

    // OPEN PALM = resume
    if (gesture === 'OPEN_PALM' && this.isPaused) {
      this.isPaused = false;
      const banner = this.el.querySelector('#slides-pause') as HTMLElement;
      if (banner) banner.style.display = 'none';
    }

    // POINT = laser pointer
    const isPointing = gesture === 'POINT';
    if (this.laserEl) {
      this.laserEl.style.opacity = isPointing ? '1' : '0';
      if (isPointing) {
        const tx = (1 - (hand.indexTip?.x ?? hand.palm.x)) * window.innerWidth;
        const ty = (hand.indexTip?.y ?? hand.palm.y) * window.innerHeight;
        this.laserEl.style.left = `${tx}px`;
        this.laserEl.style.top = `${ty}px`;
      }
    }

  }

  /** Called from GestureStateMachine swipe event */
  onSwipe(direction: -1 | 1): void {
    if (!this.visible || this.swipeCooldown > 0) return;
    if (direction > 0) {
      this.nextSlide();
    } else {
      this.prevSlide();
    }
    this.swipeCooldown = 0.8;
  }

  private nextSlide(): void {
    if (this.currentSlide < this.slideCount) {
      this.currentSlide++;
      this.updateSlideDisplay();
      this.log(`▶ Slide ${this.currentSlide} / ${this.slideCount}`);
      this.sendKey('ArrowRight');
    }
  }

  private prevSlide(): void {
    if (this.currentSlide > 1) {
      this.currentSlide--;
      this.updateSlideDisplay();
      this.log(`◀ Slide ${this.currentSlide} / ${this.slideCount}`);
      this.sendKey('ArrowLeft');
    }
  }

  private sendKey(key: string): void {
    // Dispatch keyboard event to control external presentation
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  }

  private updateSlideDisplay(): void {
    const numEl = this.el?.querySelector('#slide-number');
    const totEl = this.el?.querySelector('#slide-total');
    const progEl = this.el?.querySelector('#slide-progress') as HTMLElement;
    if (numEl) numEl.textContent = String(this.currentSlide);
    if (totEl) totEl.textContent = `/ ${this.slideCount}`;
    if (progEl) progEl.style.width = `${((this.currentSlide / this.slideCount) * 100).toFixed(0)}%`;
    if (this.slideCounter) this.slideCounter.textContent = `SLIDE ${this.currentSlide} / ${this.slideCount}`;
  }

  private log(msg: string): void {
    if (!this.logEl) return;
    const line = document.createElement('div');
    line.className = 'panel-log-entry';
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    this.logEl.prepend(line);
    if (this.logEl.children.length > 8) this.logEl.lastElementChild?.remove();
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.el?.classList.toggle('hidden', !v);
    if (!v && this.laserEl) this.laserEl.style.opacity = '0';
  }

  dispose(): void {
    this.el?.remove();
  }
}
