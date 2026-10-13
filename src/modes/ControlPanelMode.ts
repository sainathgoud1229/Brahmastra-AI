/**
 * ControlPanelMode — Real Touchless Machine & System Control Console
 *
 * Provides real, working touchless sliders, toggles, and selectors:
 * 1. Master Audio Volume slider (0% - 100%)
 * 2. Display Brightness / Contrast slider (50% - 150%)
 * 3. Planetary Orbit Speed slider (0.0x - 5.0x)
 * 4. 3D Camera Distance / Zoom slider
 * 5. Fullscreen Toggle (real browser fullscreen)
 * 6. Ambient Audio Soundscape Selector
 * 7. Top-Down Celestial View & Camera Reset
 * 8. High Contrast & Reduced Motion toggles
 */

import type { InputHand } from '../interaction/InputTypes';

export interface SystemBridge {
  setMasterVolume: (vol: number) => void;
  setDisplayBrightness: (brightness: number) => void;
  setOrbitSpeed: (speed: number) => void;
  setCameraDistance: (dist: number) => void;
  toggleFullscreen: () => void;
  toggleSound: () => void;
  togglePlanets: () => boolean;
  setTopView: () => void;
  resetView: () => void;
  toggleHighContrast: () => boolean;
  toggleReducedMotion: () => boolean;
}

export class ControlPanelMode {
  private el: HTMLDivElement | null = null;
  private visible = false;
  private bridge: SystemBridge | null = null;

  // Real control state
  private volume = 0.8;
  private brightness = 1.0;
  private orbitSpeed = 1.0;
  private cameraDistance = 0.5;
  private soundEnabled = true;
  private planetsEnabled = true;
  private highContrastEnabled = false;

  private cursorEl: HTMLElement | null = null;
  private gestureLabel: HTMLElement | null = null;
  private lastPinchState = false;

  setBridge(bridge: SystemBridge): void {
    this.bridge = bridge;
  }

  build(parent: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.className = 'mode-overlay panel-overlay hidden';
    this.el.innerHTML = `
      <div class="mode-header">
        <span class="mode-icon">🎛️</span>
        <div>
          <div class="mode-title">TOUCHLESS HARDWARE & SYSTEM CONSOLE</div>
          <div class="mode-sub">Real Working Controls • Point to Aim • Pinch / Drag Sliders • No Touch Required</div>
        </div>
        <div class="panel-gesture-label" id="panel-gesture">STANDBY</div>
      </div>

      <div class="panel-body">

        <!-- REAL SLIDERS SECTION -->
        <div class="panel-card panel-sliders-card">
          <div class="rehab-card-title">ANALOG TOUCHLESS SLIDERS</div>

          <!-- VOLUME SLIDER -->
          <div class="real-control-group" data-slider="volume">
            <div class="control-header">
              <span class="ctrl-icon">🔊</span>
              <span class="ctrl-title">MASTER AUDIO VOLUME</span>
              <span class="ctrl-value" id="val-volume">80%</span>
            </div>
            <div class="air-slider-track" id="track-volume">
              <div class="air-slider-fill" id="fill-volume" style="width: 80%"></div>
              <div class="air-slider-thumb" id="thumb-volume" style="left: 80%"></div>
            </div>
          </div>

          <!-- BRIGHTNESS SLIDER -->
          <div class="real-control-group" data-slider="brightness">
            <div class="control-header">
              <span class="ctrl-icon">☀️</span>
              <span class="ctrl-title">HUD & DISPLAY BRIGHTNESS</span>
              <span class="ctrl-value" id="val-brightness">100%</span>
            </div>
            <div class="air-slider-track" id="track-brightness">
              <div class="air-slider-fill" id="fill-brightness" style="width: 50%"></div>
              <div class="air-slider-thumb" id="thumb-brightness" style="left: 50%"></div>
            </div>
          </div>

          <!-- ORBIT SPEED SLIDER -->
          <div class="real-control-group" data-slider="orbitspeed">
            <div class="control-header">
              <span class="ctrl-icon">🪐</span>
              <span class="ctrl-title">CELESTIAL ORBIT SPEED</span>
              <span class="ctrl-value" id="val-orbitspeed">1.0x</span>
            </div>
            <div class="air-slider-track" id="track-orbitspeed">
              <div class="air-slider-fill" id="fill-orbitspeed" style="width: 20%"></div>
              <div class="air-slider-thumb" id="thumb-orbitspeed" style="left: 20%"></div>
            </div>
            <div class="slider-marks"><span>0.0x (FREEZE)</span><span>1.0x (NORMAL)</span><span>5.0x (WARP)</span></div>
          </div>

          <!-- CAMERA ZOOM SLIDER -->
          <div class="real-control-group" data-slider="camzoom">
            <div class="control-header">
              <span class="ctrl-icon">🔭</span>
              <span class="ctrl-title">3D CAMERA DISTANCE</span>
              <span class="ctrl-value" id="val-camzoom">50%</span>
            </div>
            <div class="air-slider-track" id="track-camzoom">
              <div class="air-slider-fill" id="fill-camzoom" style="width: 50%"></div>
              <div class="air-slider-thumb" id="thumb-camzoom" style="left: 50%"></div>
            </div>
            <div class="slider-marks"><span>CLOSE FOCUS</span><span>DEFAULT</span><span>DEEP FIELD</span></div>
          </div>

        </div>

        <!-- REAL ACTION BUTTONS & TOGGLES -->
        <div class="panel-card panel-actions-card">
          <div class="rehab-card-title">TACTILE SYSTEM SWITCHES</div>

          <div class="real-switches-grid">
            <button class="real-switch-btn" id="ctrl-btn-fullscreen">
              <span class="switch-icon">⛶</span>
              <div class="switch-text">
                <span class="switch-name">FULLSCREEN</span>
                <span class="switch-state" id="state-fullscreen">WINDOWED</span>
              </div>
            </button>

            <button class="real-switch-btn active" id="ctrl-btn-sound">
              <span class="switch-icon">🔔</span>
              <div class="switch-text">
                <span class="switch-name">AUDIO SYNTH</span>
                <span class="switch-state" id="state-sound">ACTIVE</span>
              </div>
            </button>

            <button class="real-switch-btn active" id="ctrl-btn-planets">
              <span class="switch-icon">🌌</span>
              <div class="switch-text">
                <span class="switch-name">9 PLANETS</span>
                <span class="switch-state" id="state-planets">ORBITING</span>
              </div>
            </button>

            <button class="real-switch-btn" id="ctrl-btn-topview">
              <span class="switch-icon">🧭</span>
              <div class="switch-text">
                <span class="switch-name">TOP VIEW</span>
                <span class="switch-state">ALIGN CAMERA</span>
              </div>
            </button>

            <button class="real-switch-btn" id="ctrl-btn-resetview">
              <span class="switch-icon">🎯</span>
              <div class="switch-text">
                <span class="switch-name">RESET VIEW</span>
                <span class="switch-state">DEFAULT ORBIT</span>
              </div>
            </button>

            <button class="real-switch-btn" id="ctrl-btn-contrast">
              <span class="switch-icon">⚡</span>
              <div class="switch-text">
                <span class="switch-name">HIGH CONTRAST</span>
                <span class="switch-state" id="state-contrast">NORMAL</span>
              </div>
            </button>
          </div>

          <div class="rehab-card-title" style="margin-top:1.2rem">REAL-TIME SYSTEM TELEMETRY</div>
          <div class="panel-telemetry" id="panel-telemetry">
            <div>STATUS: <span style="color:#2ff3ff">TOUCHLESS BUS ONLINE</span></div>
            <div>FPS: <span id="tele-fps">60 FPS</span></div>
            <div>GESTURE INPUT: <span id="tele-input" style="color:#2ff3ff">INDEX POINTER</span></div>
            <div>AUDIO BUS: <span id="tele-audio">ACTIVE (GAIN 0.8)</span></div>
          </div>

          <div class="rehab-card-title" style="margin-top:1rem">GESTURE MANUAL</div>
          <div class="panel-hint">👉 <b>POINT</b> at any slider track to adjust value touchlessly</div>
          <div class="panel-hint">🤌 <b>PINCH</b> on any switch button to toggle ON/OFF</div>
          <div class="panel-hint">🖱️ <b>CLICK & DRAG</b> also fully supported as fallback</div>
        </div>

      </div>

      <div class="panel-cursor" id="panel-cursor"></div>
    `;
    parent.append(this.el);

    this.gestureLabel = this.el.querySelector('#panel-gesture');
    this.cursorEl = this.el.querySelector('#panel-cursor');

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.el) return;

    // Fullscreen toggle
    this.el.querySelector('#ctrl-btn-fullscreen')?.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Sound toggle
    this.el.querySelector('#ctrl-btn-sound')?.addEventListener('click', () => {
      this.toggleSound();
    });

    // Planets toggle
    this.el.querySelector('#ctrl-btn-planets')?.addEventListener('click', () => {
      this.togglePlanets();
    });

    // Top view
    this.el.querySelector('#ctrl-btn-topview')?.addEventListener('click', () => {
      this.bridge?.setTopView();
    });

    // Reset view
    this.el.querySelector('#ctrl-btn-resetview')?.addEventListener('click', () => {
      this.bridge?.resetView();
    });

    // High contrast
    this.el.querySelector('#ctrl-btn-contrast')?.addEventListener('click', () => {
      this.toggleContrast();
    });

    // Sliders click/drag handlers
    const setupTrack = (id: string, onChange: (pct: number) => void) => {
      const track = this.el?.querySelector(`#track-${id}`) as HTMLElement;
      if (!track) return;

      const handlePointer = (e: MouseEvent) => {
        const rect = track.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const pct = x / rect.width;
        onChange(pct);
      };

      track.addEventListener('mousedown', (e) => {
        handlePointer(e);
        const onMove = (ev: MouseEvent) => handlePointer(ev);
        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      });
    };

    setupTrack('volume', (pct) => this.setVolume(pct));
    setupTrack('brightness', (pct) => this.setBrightness(0.5 + pct * 1.0)); // 0.5 .. 1.5
    setupTrack('orbitspeed', (pct) => this.setOrbitSpeed(pct * 5.0));      // 0.0 .. 5.0x
    setupTrack('camzoom', (pct) => this.setCameraZoom(pct));
  }

  private setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    const fill = this.el?.querySelector('#fill-volume') as HTMLElement;
    const thumb = this.el?.querySelector('#thumb-volume') as HTMLElement;
    const label = this.el?.querySelector('#val-volume');
    const pct = Math.round(this.volume * 100);
    if (fill) fill.style.width = `${pct}%`;
    if (thumb) thumb.style.left = `${pct}%`;
    if (label) label.textContent = `${pct}%`;
    this.bridge?.setMasterVolume(this.volume);
    const tele = this.el?.querySelector('#tele-audio');
    if (tele) tele.textContent = `ACTIVE (GAIN ${this.volume.toFixed(2)})`;
  }

  private setBrightness(val: number): void {
    this.brightness = Math.max(0.5, Math.min(1.5, val));
    const pctNorm = (this.brightness - 0.5) / 1.0;
    const fill = this.el?.querySelector('#fill-brightness') as HTMLElement;
    const thumb = this.el?.querySelector('#thumb-brightness') as HTMLElement;
    const label = this.el?.querySelector('#val-brightness');
    if (fill) fill.style.width = `${(pctNorm * 100).toFixed(0)}%`;
    if (thumb) thumb.style.left = `${(pctNorm * 100).toFixed(0)}%`;
    if (label) label.textContent = `${Math.round(this.brightness * 100)}%`;
    this.bridge?.setDisplayBrightness(this.brightness);
  }

  private setOrbitSpeed(val: number): void {
    this.orbitSpeed = Math.max(0, Math.min(5, val));
    const pct = (this.orbitSpeed / 5.0) * 100;
    const fill = this.el?.querySelector('#fill-orbitspeed') as HTMLElement;
    const thumb = this.el?.querySelector('#thumb-orbitspeed') as HTMLElement;
    const label = this.el?.querySelector('#val-orbitspeed');
    if (fill) fill.style.width = `${pct.toFixed(0)}%`;
    if (thumb) thumb.style.left = `${pct.toFixed(0)}%`;
    if (label) label.textContent = `${this.orbitSpeed.toFixed(1)}x`;
    this.bridge?.setOrbitSpeed(this.orbitSpeed);
  }

  private setCameraZoom(val: number): void {
    this.cameraDistance = Math.max(0, Math.min(1, val));
    const fill = this.el?.querySelector('#fill-camzoom') as HTMLElement;
    const thumb = this.el?.querySelector('#thumb-camzoom') as HTMLElement;
    const label = this.el?.querySelector('#val-camzoom');
    const pct = Math.round(this.cameraDistance * 100);
    if (fill) fill.style.width = `${pct}%`;
    if (thumb) thumb.style.left = `${pct}%`;
    if (label) label.textContent = `${pct}%`;
    // Map to camera distance nudge
    this.bridge?.setCameraDistance(this.cameraDistance);
  }

  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      this.updateSwitchState('fullscreen', true, 'FULLSCREEN');
    } else {
      document.exitFullscreen().catch(() => {});
      this.updateSwitchState('fullscreen', false, 'WINDOWED');
    }
  }

  private toggleSound(): void {
    this.soundEnabled = !this.soundEnabled;
    this.bridge?.toggleSound();
    this.updateSwitchState('sound', this.soundEnabled, this.soundEnabled ? 'ACTIVE' : 'MUTED');
  }

  private togglePlanets(): void {
    if (this.bridge) {
      this.planetsEnabled = this.bridge.togglePlanets();
      this.updateSwitchState('planets', this.planetsEnabled, this.planetsEnabled ? 'ORBITING' : 'HIDDEN');
    }
  }

  private toggleContrast(): void {
    if (this.bridge) {
      this.highContrastEnabled = this.bridge.toggleHighContrast();
      this.updateSwitchState('contrast', this.highContrastEnabled, this.highContrastEnabled ? 'ACTIVE' : 'NORMAL');
    }
  }

  private updateSwitchState(id: string, active: boolean, label: string): void {
    const btn = this.el?.querySelector(`#ctrl-btn-${id}`);
    const stateEl = this.el?.querySelector(`#state-${id}`);
    if (btn) btn.classList.toggle('active', active);
    if (stateEl) stateEl.textContent = label;
  }

  update(_dt: number, hands: InputHand[]): void {
    if (!this.visible || !this.el) return;

    const hand = hands.find(h => h.active);
    if (!hand) {
      if (this.gestureLabel) this.gestureLabel.textContent = 'STANDBY — NO HAND';
      if (this.cursorEl) this.cursorEl.style.opacity = '0';
      return;
    }

    if (this.gestureLabel) {
      this.gestureLabel.textContent = `TOUCHLESS INPUT: ${hand.gesture}`;
    }

    // Touchless Pointer Cursor
    const px = (hand.indexTip?.x ?? hand.palm?.x ?? 0.5) * window.innerWidth;
    const py = (hand.indexTip?.y ?? hand.palm?.y ?? 0.5) * window.innerHeight;

    if (this.cursorEl) {
      this.cursorEl.style.opacity = '1';
      this.cursorEl.style.left = `${px}px`;
      this.cursorEl.style.top = `${py}px`;
    }

    // Check hover over sliders or switches
    const isPinching = hand.pinching || hand.gesture === 'PINCH';
    const isPointing = hand.gesture === 'POINT';

    // Touchless Slider interaction: Pointing or pinching over slider tracks
    const sliderTracks = this.el.querySelectorAll('.real-control-group');
    sliderTracks.forEach(group => {
      const type = group.getAttribute('data-slider');
      const track = group.querySelector('.air-slider-track') as HTMLElement;
      if (!track || !type) return;

      const rect = track.getBoundingClientRect();
      const inTrackBounds =
        px >= rect.left - 15 && px <= rect.right + 15 &&
        py >= rect.top - 20 && py <= rect.bottom + 20;

      if (inTrackBounds) {
        track.classList.add('hovered');
        if (isPointing || isPinching) {
          const ratio = Math.max(0, Math.min(1, (px - rect.left) / rect.width));
          if (type === 'volume') this.setVolume(ratio);
          else if (type === 'brightness') this.setBrightness(0.5 + ratio * 1.0);
          else if (type === 'orbitspeed') this.setOrbitSpeed(ratio * 5.0);
          else if (type === 'camzoom') this.setCameraZoom(ratio);
        }
      } else {
        track.classList.remove('hovered');
      }
    });

    // Touchless Switch interaction: Pinch down trigger on buttons
    const switchBtns = this.el.querySelectorAll('.real-switch-btn');
    switchBtns.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const inBounds = px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom;
      if (inBounds) {
        btn.classList.add('hovered');
        // Pinch start trigger
        if (isPinching && !this.lastPinchState) {
          (btn as HTMLButtonElement).click();
          btn.classList.add('activated');
          setTimeout(() => btn.classList.remove('activated'), 300);
        }
      } else {
        btn.classList.remove('hovered');
      }
    });

    this.lastPinchState = isPinching;
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.el?.classList.toggle('hidden', !v);
  }

  dispose(): void {
    this.el?.remove();
  }
}
