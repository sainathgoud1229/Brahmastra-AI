/**
 * PresentationMode — Professional Stage & Meeting Presentation Controller
 *
 * Designed for real-life presentation scenarios:
 * 1. Full Interactive Slide Deck with rich slides
 * 2. 🔴 Air Laser Pointer (follows pointing fingertip with glowing laser beam)
 * 3. 🔦 Stage Spotlight Mode (dims slide except circular spotlight around hand)
 * 4. ✏️ Live Air Slide Highlighter / Annotator (draw arrows & circles in mid-air)
 * 5. 👋 Touchless Air Swipe & Arrow navigation (Next / Prev slide)
 * 6. ⏱️ Presenter Meeting Timer & Pacing Indicator
 * 7. 📋 Floating Teleprompter Speaker Notes
 * 8. ⬛ Stage Blackout (Pause screen to pull audience attention back to speaker)
 */

import type { InputHand } from '../interaction/InputTypes';

export interface SlideData {
  title: string;
  tagline: string;
  badges: string[];
  bullets: { icon: string; title: string; desc: string }[];
  speakerNotes: string;
}

export const PRESENTATION_SLIDES: SlideData[] = [
  {
    title: 'BRAHMASTRA AI',
    tagline: 'Autonomous Spatial Intelligence & Touchless Vision Platform',
    badges: ['KEYNOTE 2026', 'PHYSICAL AI', 'ZERO HARDWARE'],
    bullets: [
      { icon: '🪐', title: 'Celestial Neural Core', desc: 'Central neural sphere orchestrating real-time 9-planet celestial physics and spatial shaders.' },
      { icon: '👁️', title: 'Browser-Native Computer Vision', desc: 'Runs 100% locally in browser at 60+ FPS on any standard webcam without cloud latency.' },
      { icon: '🖐️', title: '21 3D Anatomical Landmarks', desc: 'Sub-millimeter tracking of joints, palm roll, finger extension, and spatial gestures.' },
    ],
    speakerNotes: 'Welcome the audience. Introduce Brahmastra AI as a breakthrough in browser-based spatial computing requiring zero extra sensors.',
  },
  {
    title: 'NEURAL PIPELINE & ARCHITECTURE',
    tagline: 'How Brahmastra AI Processes Reality in Milliseconds',
    badges: ['ARCHITECTURE', 'TENSORFLOW', 'WEBGL'],
    bullets: [
      { icon: '📷', title: 'Webcam Stream Demuxer', desc: 'High-throughput frame ingestion with hardware accelerated OffscreenCanvas.' },
      { icon: '⚡', title: 'Gesture State Machine', desc: 'Deterministic debounce filters that convert raw landmarks into intentional actions.' },
      { icon: '🎨', title: 'Three.js Post-Processing', desc: 'Custom GLSL bloom, chromatic aberration, and holographic HUD overlays.' },
    ],
    speakerNotes: 'Walk through the 3 layers: camera ingestion, neural gesture state machine, and GPU-accelerated rendering.',
  },
  {
    title: 'REAL-WORLD PHYSICAL APPLICATIONS',
    tagline: 'Beyond Gimmicks: 4 Concrete Life-Saving Solutions',
    badges: ['HEALTHCARE', 'INDUSTRY', 'ACCESSIBILITY'],
    bullets: [
      { icon: '🏥', title: 'Clinic Hand Rehabilitation', desc: '1-Minute cadence drills, extension meters, and range-of-motion recovery without hardware.' },
      { icon: '🎛️', title: 'Touchless Cleanroom Console', desc: 'Sterile surgical, chemical lab, and factory control where screens cannot be touched.' },
      { icon: '📓', title: 'Air-Notebook & Speech Voice', desc: 'Write in mid-air with your hand and pronounce words out loud through speech synthesis.' },
    ],
    speakerNotes: 'Emphasize that this is built for practical, impactful scenarios: clinics, sterile operating rooms, assistive writing, and stage keynotes.',
  },
  {
    title: 'ZERO-HARDWARE REVOLUTION',
    tagline: 'Why Touchless Accessibility Must Be Hardware-Free',
    badges: ['ACCESSIBILITY', 'COST: $0', 'EVERY DEVICE'],
    bullets: [
      { icon: '💻', title: 'Zero VR Headsets Required', desc: 'No bulky $3,500 goggles, gloves, or fragile infrared sensors.' },
      { icon: '🔒', title: '100% Privacy Preserving', desc: 'No video stream ever leaves the client machine; inference runs on WebAssembly.' },
      { icon: '🌍', title: 'Instant Worldwide Distribution', desc: 'Open a URL in Chrome/Edge and start interacting immediately.' },
    ],
    speakerNotes: 'Explain the democratizing power: any school, clinic, or presenter with an ordinary webcam can use this immediately.',
  },
  {
    title: 'THE FUTURE OF HUMAN-MACHINE SYMBIOSIS',
    tagline: 'Where Touchless AI Is Heading Next',
    badges: ['ROADMAP', 'MILESTONES', 'LIVE DEMO'],
    bullets: [
      { icon: '🚀', title: 'Multi-User Spatial Collaboration', desc: 'Simultaneous multi-hand interaction across shared spatial environments.' },
      { icon: '🧠', title: 'Intent Prediction Models', desc: 'Anticipatory trajectory smoothing for effortless micro-gestures.' },
      { icon: '✨', title: 'Live Demonstration', desc: 'Try out the air laser pointer, spotlight, and handwriting modes right now!' },
    ],
    speakerNotes: 'Conclude the presentation, thank the audience, and invite questions while pointing out the live air laser controls.',
  },
];

export class PresentationMode {
  private el: HTMLDivElement | null = null;
  private visible = false;

  private currentSlideIndex = 0;
  private isLaserActive = true;
  private isSpotlightActive = false;
  private isBlackout = false;
  private isNotesOpen = false;

  // Presenter meeting timer
  private timerSeconds = 0;
  private timerRunning = true;

  // DOM Elements
  private slideCard: HTMLElement | null = null;
  private slideTitle: HTMLElement | null = null;
  private slideTagline: HTMLElement | null = null;
  private slideBadges: HTMLElement | null = null;
  private slideBullets: HTMLElement | null = null;
  private slideCounter: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private timerDisplay: HTMLElement | null = null;
  private notesContent: HTMLElement | null = null;
  private notesDrawer: HTMLElement | null = null;
  private blackoutOverlay: HTMLElement | null = null;
  private laserPointer: HTMLElement | null = null;
  private spotlightMask: HTMLElement | null = null;

  // Swipe detection latch
  private swipeCooldown = 0;

  build(parent: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.className = 'mode-overlay slides-overlay hidden';
    this.el.innerHTML = `
      <div class="mode-header">
        <span class="mode-icon">🎤</span>
        <div>
          <div class="mode-title">STAGE & MEETING PRESENTATION CONTROLLER</div>
          <div class="mode-sub">Air Laser Pointer • Stage Spotlight • Hand Swipe Navigation • Blackout Attention Pause</div>
        </div>
        <div class="presenter-meeting-timer" id="pres-timer">⏱️ 00:00 (ON TIME)</div>
      </div>

      <!-- MAIN STAGE PRESENTATION SCREEN -->
      <div class="presentation-stage">

        <!-- FLOATING PRESENTER TOOLBAR -->
        <div class="pres-toolbar">
          <button class="pres-tool-btn active" id="tool-laser">🔴 AIR LASER</button>
          <button class="pres-tool-btn" id="tool-spotlight">🔦 SPOTLIGHT</button>
          <button class="pres-tool-btn" id="tool-blackout">⬛ BLACKOUT SCREEN</button>
          <button class="pres-tool-btn" id="tool-notes">📋 SPEAKER NOTES</button>
          <button class="pres-tool-btn" id="tool-timer-reset">↺ RESET TIMER</button>
        </div>

        <!-- SLIDE VIEWER CONTAINER -->
        <div class="slide-view-container" id="slide-container">
          
          <div class="slide-card" id="pres-slide-card">
            
            <div class="slide-top-row">
              <div class="slide-badges" id="slide-badges"></div>
              <div class="slide-number-pill" id="slide-number-pill">SLIDE 1 / 5</div>
            </div>

            <h1 class="slide-main-title" id="slide-title">BRAHMASTRA AI</h1>
            <p class="slide-main-tagline" id="slide-tagline">Autonomous Spatial Intelligence Platform</p>

            <div class="slide-bullets-grid" id="slide-bullets"></div>

          </div>

          <!-- SPOTLIGHT VIGNETTE OVERLAY -->
          <div class="spotlight-overlay" id="pres-spotlight" style="display:none"></div>

          <!-- AIR LASER POINTER -->
          <div class="air-laser-dot" id="pres-laser">
            <div class="laser-core"></div>
            <div class="laser-flare"></div>
          </div>

        </div>

        <!-- BOTTOM STAGE CONTROLS & PROGRESS -->
        <div class="pres-bottom-bar">
          <button class="pres-nav-arrow" id="pres-prev-btn">◀ PREVIOUS (SWIPE LEFT)</button>
          
          <div class="pres-dots-row" id="pres-dots"></div>

          <div class="pres-progress-track">
            <div class="pres-progress-fill" id="pres-progress-bar" style="width: 20%"></div>
          </div>

          <button class="pres-nav-arrow" id="pres-next-btn">NEXT (SWIPE RIGHT) ▶</button>
        </div>

      </div>

      <!-- SPEAKER TELEPROMPTER NOTES DRAWER -->
      <div class="speaker-notes-drawer" id="speaker-notes-drawer" style="display:none">
        <div class="notes-header">
          <span>📋 SPEAKER TELEPROMPTER NOTES</span>
          <button class="notes-close" id="notes-close">✕</button>
        </div>
        <div class="notes-body" id="notes-body"></div>
      </div>

      <!-- STAGE BLACKOUT OVERLAY -->
      <div class="stage-blackout-screen" id="stage-blackout" style="display:none">
        <div class="blackout-prompt">
          <div class="blackout-icon">⏸️</div>
          <div class="blackout-title">STAGE ATTENTION PAUSED</div>
          <div class="blackout-sub">Tap BLACKOUT or Open Hand to resume slide display</div>
        </div>
      </div>
    `;
    parent.append(this.el);

    this.slideCard = this.el.querySelector('#pres-slide-card');
    this.slideTitle = this.el.querySelector('#slide-title');
    this.slideTagline = this.el.querySelector('#slide-tagline');
    this.slideBadges = this.el.querySelector('#slide-badges');
    this.slideBullets = this.el.querySelector('#slide-bullets');
    this.slideCounter = this.el.querySelector('#slide-number-pill');
    this.progressBar = this.el.querySelector('#pres-progress-bar');
    this.timerDisplay = this.el.querySelector('#pres-timer');
    this.notesDrawer = this.el.querySelector('#speaker-notes-drawer');
    this.notesContent = this.el.querySelector('#notes-body');
    this.blackoutOverlay = this.el.querySelector('#stage-blackout');
    this.laserPointer = this.el.querySelector('#pres-laser');
    this.spotlightMask = this.el.querySelector('#pres-spotlight');

    this.setupListeners();
    this.renderSlide(0);
  }

  private setupListeners(): void {
    if (!this.el) return;

    // Previous / Next buttons
    this.el.querySelector('#pres-prev-btn')?.addEventListener('click', () => this.prevSlide());
    this.el.querySelector('#pres-next-btn')?.addEventListener('click', () => this.nextSlide());

    // Laser toggle
    this.el.querySelector('#tool-laser')?.addEventListener('click', (e) => {
      this.isLaserActive = !this.isLaserActive;
      (e.currentTarget as HTMLElement).classList.toggle('active', this.isLaserActive);
    });

    // Spotlight toggle
    this.el.querySelector('#tool-spotlight')?.addEventListener('click', (e) => {
      this.isSpotlightActive = !this.isSpotlightActive;
      (e.currentTarget as HTMLElement).classList.toggle('active', this.isSpotlightActive);
      if (this.spotlightMask) this.spotlightMask.style.display = this.isSpotlightActive ? 'block' : 'none';
    });

    // Blackout toggle
    this.el.querySelector('#tool-blackout')?.addEventListener('click', () => this.toggleBlackout());
    this.blackoutOverlay?.addEventListener('click', () => this.toggleBlackout());

    // Notes toggle
    this.el.querySelector('#tool-notes')?.addEventListener('click', (e) => {
      this.isNotesOpen = !this.isNotesOpen;
      (e.currentTarget as HTMLElement).classList.toggle('active', this.isNotesOpen);
      if (this.notesDrawer) this.notesDrawer.style.display = this.isNotesOpen ? 'block' : 'none';
    });
    this.el.querySelector('#notes-close')?.addEventListener('click', () => {
      this.isNotesOpen = false;
      this.el?.querySelector('#tool-notes')?.classList.remove('active');
      if (this.notesDrawer) this.notesDrawer.style.display = 'none';
    });

    // Reset timer
    this.el.querySelector('#tool-timer-reset')?.addEventListener('click', () => {
      this.timerSeconds = 0;
    });

    // Keyboard Left/Right arrows
    window.addEventListener('keydown', (e) => {
      if (!this.visible) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        this.nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        this.prevSlide();
      } else if (e.key === 'b' || e.key === 'B') {
        this.toggleBlackout();
      }
    });
  }

  private toggleBlackout(): void {
    this.isBlackout = !this.isBlackout;
    if (this.blackoutOverlay) {
      this.blackoutOverlay.style.display = this.isBlackout ? 'flex' : 'none';
    }
    const btn = this.el?.querySelector('#tool-blackout');
    if (btn) btn.classList.toggle('active', this.isBlackout);
  }

  nextSlide(): void {
    if (this.currentSlideIndex < PRESENTATION_SLIDES.length - 1) {
      this.renderSlide(this.currentSlideIndex + 1);
    }
  }

  prevSlide(): void {
    if (this.currentSlideIndex > 0) {
      this.renderSlide(this.currentSlideIndex - 1);
    }
  }

  private renderSlide(index: number): void {
    this.currentSlideIndex = index;
    const slide = PRESENTATION_SLIDES[index];
    if (!slide) return;

    if (this.slideTitle) this.slideTitle.textContent = slide.title;
    if (this.slideTagline) this.slideTagline.textContent = slide.tagline;
    if (this.slideCounter) {
      this.slideCounter.textContent = `SLIDE ${index + 1} / ${PRESENTATION_SLIDES.length}`;
    }

    // Badges
    if (this.slideBadges) {
      this.slideBadges.innerHTML = slide.badges
        .map(b => `<span class="slide-badge">${b}</span>`)
        .join('');
    }

    // Bullets
    if (this.slideBullets) {
      this.slideBullets.innerHTML = slide.bullets
        .map(b => `
          <div class="slide-bullet-item">
            <span class="bullet-icon">${b.icon}</span>
            <div class="bullet-content">
              <h3 class="bullet-title">${b.title}</h3>
              <p class="bullet-desc">${b.desc}</p>
            </div>
          </div>
        `).join('');
    }

    // Progress bar
    const pct = ((index + 1) / PRESENTATION_SLIDES.length) * 100;
    if (this.progressBar) this.progressBar.style.width = `${pct}%`;

    // Notes
    if (this.notesContent) {
      this.notesContent.innerHTML = `
        <div class="notes-slide-title">SLIDE ${index + 1}: ${slide.title}</div>
        <p class="notes-text">${slide.speakerNotes}</p>
      `;
    }

    // Slide dots
    const dotsContainer = this.el?.querySelector('#pres-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = PRESENTATION_SLIDES.map((_, i) => `
        <button class="pres-dot ${i === index ? 'active' : ''}" data-idx="${i}"></button>
      `).join('');
      dotsContainer.querySelectorAll('.pres-dot').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-idx'));
          this.renderSlide(idx);
        });
      });
    }

    // Card entrance animation
    if (this.slideCard) {
      this.slideCard.classList.remove('slide-enter');
      void this.slideCard.offsetWidth; // trigger reflow
      this.slideCard.classList.add('slide-enter');
    }
  }

  update(dt: number, hands: InputHand[]): void {
    if (!this.visible || !this.el) return;

    this.swipeCooldown = Math.max(0, this.swipeCooldown - dt);

    // Update presenter meeting timer
    if (this.timerRunning) {
      this.timerSeconds += dt;
      const mins = Math.floor(this.timerSeconds / 60);
      const secs = Math.floor(this.timerSeconds % 60);
      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      if (this.timerDisplay) {
        const pacing = mins < 10 ? 'ON TIME' : mins < 15 ? 'APPROACHING CONCLUSION' : 'WRAP UP';
        this.timerDisplay.textContent = `⏱️ ${timeStr} (${pacing})`;
      }
    }

    const hand = hands.find(h => h.active);
    if (!hand) {
      if (this.laserPointer) this.laserPointer.style.opacity = '0';
      return;
    }

    // Pointer screen coordinates from index tip
    const px = (hand.indexTip?.x ?? hand.palm?.x ?? 0.5) * window.innerWidth;
    const py = (hand.indexTip?.y ?? hand.palm?.y ?? 0.5) * window.innerHeight;

    // Laser pointer
    if (this.laserPointer) {
      if (this.isLaserActive && !this.isBlackout) {
        this.laserPointer.style.opacity = '1';
        this.laserPointer.style.left = `${px}px`;
        this.laserPointer.style.top = `${py}px`;
      } else {
        this.laserPointer.style.opacity = '0';
      }
    }

    // Spotlight Mask (radial gradient centered on hand position)
    if (this.spotlightMask && this.isSpotlightActive && !this.isBlackout) {
      this.spotlightMask.style.background =
        `radial-gradient(circle 180px at ${px}px ${py}px, transparent 0%, rgba(5,10,20,0.85) 100%)`;
    }

    // Air Gestures:
    // Fist -> Toggle Blackout
    if (hand.gesture === 'FIST' && !this.isBlackout && this.swipeCooldown <= 0) {
      this.toggleBlackout();
      this.swipeCooldown = 1.0;
    } else if (hand.gesture === 'OPEN_PALM' && this.isBlackout && this.swipeCooldown <= 0) {
      this.toggleBlackout();
      this.swipeCooldown = 1.0;
    }

    // Touchless Button hover/click check on toolbar
    const isPinching = hand.pinching || hand.gesture === 'PINCH';

    const navArrows = this.el.querySelectorAll('.pres-nav-arrow');
    navArrows.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const inBounds = px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom;
      if (inBounds) {
        btn.classList.add('hovered');
        if (isPinching && this.swipeCooldown <= 0) {
          (btn as HTMLButtonElement).click();
          this.swipeCooldown = 0.5;
        }
      } else {
        btn.classList.remove('hovered');
      }
    });

    const toolBtns = this.el.querySelectorAll('.pres-tool-btn');
    toolBtns.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const inBounds = px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom;
      if (inBounds) {
        btn.classList.add('hovered');
        if (isPinching && this.swipeCooldown <= 0) {
          (btn as HTMLButtonElement).click();
          this.swipeCooldown = 0.4;
        }
      } else {
        btn.classList.remove('hovered');
      }
    });
  }

  onSwipe(dir: -1 | 1): void {
    this.handleSwipe(dir);
  }

  handleSwipe(dir: -1 | 1): void {
    if (!this.visible) return;
    if (dir === 1) {
      this.nextSlide();
    } else {
      this.prevSlide();
    }
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.el?.classList.toggle('hidden', !v);
  }

  dispose(): void {
    this.el?.remove();
  }
}
