/**
 * RehabMode — Hand Rehabilitation Tracker
 *
 * Real-time physiotherapy assistant powered by live hand tracking.
 * Features 1-Minute Workout Drills, Reps-per-Minute pace tracking,
 * finger extension telemetry, palm openness gauge, and wrist rotation dial.
 */

import type { InputHand } from '../interaction/InputTypes';

export interface RehabExercise {
  id: string;
  name: string;
  instruction: string;
}

export const REHAB_EXERCISES: RehabExercise[] = [
  { id: 'grip',    name: 'GRIP STRENGTH',   instruction: 'Make a tight FIST → Open PALM wide. Repeat.' },
  { id: 'index',   name: 'INDEX ISOLATION', instruction: 'Extend only your INDEX finger while keeping others folded.' },
  { id: 'wrist',   name: 'WRIST ROTATION',  instruction: 'Rotate wrist LEFT (-90°) → RIGHT (+90°) smoothly.' },
  { id: 'spread',  name: 'FINGER SPREAD',   instruction: 'Spread ALL 5 fingers wide outward, then close tightly.' },
];

interface ExerciseState {
  reps: number;
  phase: 'OPEN' | 'CLOSE' | 'IDLE';
  bestRpm: number;
  drillReps: number;
  wristMin: number;
  wristMax: number;
}

export class RehabMode {
  private el: HTMLDivElement | null = null;
  private visible = false;
  private currentExercise = 0;
  private states: ExerciseState[] = REHAB_EXERCISES.map(() => ({
    reps: 0,
    phase: 'IDLE',
    bestRpm: 0,
    drillReps: 0,
    wristMin: Infinity,
    wristMax: -Infinity,
  }));

  // 1-minute drill state
  private drillActive = false;
  private drillTimeRemaining = 60.0;
  private drillReps = 0;

  private fingerBars: HTMLElement[] = [];
  private fingerLabels: HTMLElement[] = [];
  private wristDial: HTMLElement | null = null;
  private wristValue: HTMLElement | null = null;
  private repDisplay: HTMLElement | null = null;
  private rpmDisplay: HTMLElement | null = null;
  private drillTimerDisplay: HTMLElement | null = null;
  private drillBtn: HTMLButtonElement | null = null;
  private phaseDisplay: HTMLElement | null = null;
  private exerciseInstr: HTMLElement | null = null;
  private palmRing: HTMLElement | null = null;
  private palmPct: HTMLElement | null = null;
  private sessionTime = 0;
  private sessionEl: HTMLElement | null = null;

  build(parent: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.className = 'mode-overlay rehab-overlay hidden';
    this.el.innerHTML = `
      <div class="mode-header">
        <span class="mode-icon">🏥</span>
        <div>
          <div class="mode-title">HAND REHABILITATION TRACKER</div>
          <div class="mode-sub">Real-time physiotherapy assistant • 1-Minute Cadence & Mobility Tracking</div>
        </div>
        <div class="mode-session" id="rehab-session">SESSION 00:00</div>
      </div>

      <div class="rehab-body">

        <!-- EXERCISE SELECTOR -->
        <div class="rehab-card exercise-card">
          <div class="rehab-card-title">EXERCISE SELECTION</div>
          <div class="rehab-exercise-tabs" id="rehab-tabs"></div>
          <div class="rehab-instr" id="rehab-instr">—</div>
        </div>

        <!-- FINGER BARS -->
        <div class="rehab-card">
          <div class="rehab-card-title">FINGER EXTENSION LIVE</div>
          <div class="finger-bars" id="finger-bars"></div>
        </div>

        <!-- PALM OPENNESS -->
        <div class="rehab-card palm-card">
          <div class="rehab-card-title">PALM OPENNESS</div>
          <div class="palm-ring-wrap">
            <div class="palm-ring" id="palm-ring">
              <div class="palm-ring-fill" id="palm-ring-fill"></div>
              <div class="palm-pct" id="palm-pct">0%</div>
            </div>
          </div>
        </div>

        <!-- WRIST ROTATION -->
        <div class="rehab-card wrist-card">
          <div class="rehab-card-title">WRIST ROTATION</div>
          <div class="wrist-track">
            <div class="wrist-bar">
              <div class="wrist-indicator" id="wrist-indicator"></div>
            </div>
            <div class="wrist-labels"><span>-90°</span><span>0°</span><span>+90°</span></div>
          </div>
          <div class="wrist-val" id="wrist-val">0°</div>
        </div>

        <!-- 1-MINUTE DRILL & REPS COUNTER -->
        <div class="rehab-card reps-card">
          <div class="rehab-card-title">1-MINUTE DRILL & REPS</div>
          
          <div class="reps-drill-controls">
            <button class="rehab-drill-btn" id="rehab-drill-toggle">▶ START 1-MIN DRILL</button>
            <button class="rehab-drill-btn reset-btn" id="rehab-drill-reset">↺ RESET</button>
          </div>

          <div class="drill-timer-box">
            <span class="drill-timer-label">TIME LEFT:</span>
            <span class="drill-timer-digits" id="rehab-drill-timer">60s</span>
            <div class="drill-progress-track">
              <div class="drill-progress-bar" id="rehab-drill-bar" style="width:100%"></div>
            </div>
          </div>

          <div class="reps-stats-row">
            <div class="stat-col">
              <div class="stat-label">TOTAL REPS</div>
              <div class="reps-big" id="rehab-reps">0</div>
            </div>
            <div class="stat-col">
              <div class="stat-label">SPEED / CADENCE</div>
              <div class="rpm-rate" id="rehab-rpm">0 <span class="rate-unit">REPS/MIN</span></div>
            </div>
          </div>

          <div class="reps-phase" id="rehab-phase">READY — SHOW HAND TO CAMERA</div>
        </div>

        <!-- PROGRESS -->
        <div class="rehab-card progress-card">
          <div class="rehab-card-title">SESSION PERFORMANCE & BEST 1-MIN PACE</div>
          <div class="progress-list" id="rehab-progress-list"></div>
        </div>

      </div>
    `;
    parent.append(this.el);

    this.sessionEl = this.el.querySelector('#rehab-session');
    this.repDisplay = this.el.querySelector('#rehab-reps');
    this.rpmDisplay = this.el.querySelector('#rehab-rpm');
    this.drillTimerDisplay = this.el.querySelector('#rehab-drill-timer');
    this.drillBtn = this.el.querySelector('#rehab-drill-toggle');
    this.phaseDisplay = this.el.querySelector('#rehab-phase');
    this.exerciseInstr = this.el.querySelector('#rehab-instr');
    this.palmRing = this.el.querySelector('#palm-ring');
    this.palmPct = this.el.querySelector('#palm-pct');
    this.wristDial = this.el.querySelector('#wrist-indicator');
    this.wristValue = this.el.querySelector('#wrist-val');

    this.drillBtn?.addEventListener('click', () => this.toggleDrill());
    this.el.querySelector('#rehab-drill-reset')?.addEventListener('click', () => this.resetDrill());

    this.buildFingerBars();
    this.buildExerciseTabs();
    this.updateExercise();
  }

  private toggleDrill(): void {
    if (this.drillActive) {
      // Pause
      this.drillActive = false;
      if (this.drillBtn) {
        this.drillBtn.textContent = '▶ RESUME 1-MIN DRILL';
        this.drillBtn.classList.remove('running');
      }
    } else {
      // Start or Resume
      if (this.drillTimeRemaining <= 0) {
        this.drillTimeRemaining = 60.0;
        this.drillReps = 0;
      }
      this.drillActive = true;
      if (this.drillBtn) {
        this.drillBtn.textContent = '⏸ PAUSE DRILL';
        this.drillBtn.classList.add('running');
      }
      if (this.phaseDisplay) this.phaseDisplay.textContent = '🔥 1-MIN DRILL ACTIVE — MOVE FAST & ACCURATE!';
    }
  }

  private resetDrill(): void {
    this.drillActive = false;
    this.drillTimeRemaining = 60.0;
    this.drillReps = 0;
    if (this.drillBtn) {
      this.drillBtn.textContent = '▶ START 1-MIN DRILL';
      this.drillBtn.classList.remove('running');
    }
    if (this.drillTimerDisplay) this.drillTimerDisplay.textContent = '60s';
    const bar = this.el?.querySelector('#rehab-drill-bar') as HTMLElement;
    if (bar) bar.style.width = '100%';
    const st = this.states[this.currentExercise];
    st.drillReps = 0;
    if (this.phaseDisplay) this.phaseDisplay.textContent = 'DRILL RESET — PRESS START WHEN READY';
  }

  private buildFingerBars(): void {
    const container = this.el!.querySelector('#finger-bars')!;
    const names = ['THUMB', 'INDEX', 'MIDDLE', 'RING', 'PINKY'];
    for (let i = 0; i < 5; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'finger-col';
      wrap.innerHTML = `
        <div class="finger-track"><div class="finger-fill" id="finger-fill-${i}"></div></div>
        <div class="finger-label">${names[i]}</div>
        <div class="finger-pct" id="finger-pct-${i}">0%</div>
      `;
      container.append(wrap);
      this.fingerBars.push(wrap.querySelector(`#finger-fill-${i}`)!);
      this.fingerLabels.push(wrap.querySelector(`#finger-pct-${i}`)!);
    }
  }

  private buildExerciseTabs(): void {
    const tabs = this.el!.querySelector('#rehab-tabs')!;
    REHAB_EXERCISES.forEach((ex, i) => {
      const btn = document.createElement('button');
      btn.className = 'rehab-tab' + (i === 0 ? ' active' : '');
      btn.textContent = ex.name;
      btn.addEventListener('click', () => {
        this.currentExercise = i;
        tabs.querySelectorAll('.rehab-tab').forEach((t, j) =>
          t.classList.toggle('active', j === i));
        this.updateExercise();
      });
      tabs.append(btn);
    });
  }

  private updateExercise(): void {
    const ex = REHAB_EXERCISES[this.currentExercise];
    if (this.exerciseInstr) this.exerciseInstr.textContent = ex.instruction;
    const st = this.states[this.currentExercise];
    if (this.repDisplay) this.repDisplay.textContent = String(st.reps);
    this.updateCadenceDisplay();
    this.buildProgressList();
  }

  private updateCadenceDisplay(): void {
    const st = this.states[this.currentExercise];
    // Cadence calculated from elapsed session time or active 1-min drill
    let currentRpm = 0;
    if (this.drillActive && (60 - this.drillTimeRemaining) > 1) {
      const elapsedMins = (60 - this.drillTimeRemaining) / 60;
      currentRpm = Math.round(this.drillReps / elapsedMins);
    } else if (this.sessionTime > 5) {
      const elapsedMins = this.sessionTime / 60;
      currentRpm = Math.round(st.reps / Math.max(0.2, elapsedMins));
    }
    if (this.rpmDisplay) {
      this.rpmDisplay.innerHTML = `${currentRpm} <span class="rate-unit">REPS/MIN</span>`;
    }
  }

  private buildProgressList(): void {
    const list = this.el?.querySelector('#rehab-progress-list');
    if (!list) return;
    list.innerHTML = '';
    REHAB_EXERCISES.forEach((ex, i) => {
      const st = this.states[i];
      const row = document.createElement('div');
      row.className = 'progress-row';
      const best = st.bestRpm > 0 ? `${st.bestRpm}/min` : '—';
      row.innerHTML = `
        <span class="progress-name">${ex.name}</span>
        <div class="progress-track">
          <div class="progress-fill" style="width:${Math.min(100, st.reps * 4)}%"></div>
        </div>
        <span class="progress-count">${st.reps} reps <small style="color:#2ff3ff;opacity:0.8">(1-Min Best: ${best})</small></span>
      `;
      list.append(row);
    });
  }

  update(dt: number, hands: InputHand[]): void {
    if (!this.visible || !this.el) return;

    this.sessionTime += dt;
    const mins = Math.floor(this.sessionTime / 60);
    const secs = Math.floor(this.sessionTime % 60);
    if (this.sessionEl)
      this.sessionEl.textContent = `SESSION ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Update 1-minute drill timer
    if (this.drillActive) {
      this.drillTimeRemaining = Math.max(0, this.drillTimeRemaining - dt);
      if (this.drillTimerDisplay) {
        this.drillTimerDisplay.textContent = `${Math.ceil(this.drillTimeRemaining)}s`;
      }
      const bar = this.el.querySelector('#rehab-drill-bar') as HTMLElement;
      if (bar) {
        bar.style.width = `${((this.drillTimeRemaining / 60) * 100).toFixed(1)}%`;
      }

      if (this.drillTimeRemaining <= 0) {
        // Drill finished!
        this.drillActive = false;
        const st = this.states[this.currentExercise];
        if (this.drillReps > st.bestRpm) {
          st.bestRpm = this.drillReps;
        }
        if (this.drillBtn) {
          this.drillBtn.textContent = '🏆 COMPLETED! START AGAIN';
          this.drillBtn.classList.remove('running');
        }
        if (this.phaseDisplay) {
          this.phaseDisplay.textContent = `🎉 1-MIN DRILL FINISHED! YOU COMPLETED ${this.drillReps} REPS!`;
        }
      }
    }

    const hand = hands.find(h => h.active);
    if (!hand) {
      if (this.phaseDisplay && !this.drillActive) {
        this.phaseDisplay.textContent = 'NO HAND — SHOW HAND TO CAMERA';
      }
      return;
    }

    // Finger extension bars
    for (let i = 0; i < 5; i++) {
      const ext = hand.extension?.[i] ?? 0;
      if (this.fingerBars[i]) (this.fingerBars[i] as HTMLElement).style.height = `${(ext * 100).toFixed(0)}%`;
      if (this.fingerLabels[i]) this.fingerLabels[i].textContent = `${(ext * 100).toFixed(0)}%`;
    }

    // Palm openness ring
    const openness = hand.palmOpenness ?? 0;
    const deg = openness * 360;
    if (this.palmRing) {
      (this.palmRing as HTMLElement).style.background =
        `conic-gradient(#2ff3ff ${deg}deg, rgba(47,243,255,0.1) ${deg}deg)`;
    }
    if (this.palmPct) this.palmPct.textContent = `${(openness * 100).toFixed(0)}%`;

    // Wrist rotation
    const roll = hand.palmRoll ?? 0; // radians
    const rollDeg = (roll * 180) / Math.PI;
    const clampedDeg = Math.max(-90, Math.min(90, rollDeg));
    const pct = (clampedDeg + 90) / 180; // 0..1
    if (this.wristDial) (this.wristDial as HTMLElement).style.left = `${(pct * 100).toFixed(1)}%`;
    if (this.wristValue) this.wristValue.textContent = `${rollDeg.toFixed(0)}°`;

    // Rep counting
    const exIdx = this.currentExercise;
    const st = this.states[exIdx];
    const ex = REHAB_EXERCISES[exIdx];
    let repCounted = false;

    if (ex.id === 'grip') {
      const isFist = hand.gesture === 'FIST';
      const isOpen = hand.gesture === 'OPEN_PALM' || (hand.extendedCount ?? 0) >= 4;
      if (st.phase === 'IDLE' || st.phase === 'OPEN') {
        if (isFist) { st.phase = 'CLOSE'; }
      } else if (st.phase === 'CLOSE') {
        if (isOpen) {
          st.phase = 'OPEN';
          st.reps++;
          repCounted = true;
        }
      }
    } else if (ex.id === 'index') {
      const indexExt = hand.extension?.[1] ?? 0;
      const othersDown = (hand.extension?.[2] ?? 0) < 0.4 &&
                         (hand.extension?.[3] ?? 0) < 0.4 &&
                         (hand.extension?.[4] ?? 0) < 0.4;
      if (st.phase === 'IDLE' || st.phase === 'CLOSE') {
        if (indexExt > 0.8 && othersDown) {
          st.phase = 'OPEN';
          st.reps++;
          repCounted = true;
        }
      } else if (st.phase === 'OPEN') {
        if (indexExt < 0.3) { st.phase = 'CLOSE'; }
      }
    } else if (ex.id === 'wrist') {
      if (rollDeg < st.wristMin) st.wristMin = rollDeg;
      if (rollDeg > st.wristMax) st.wristMax = rollDeg;
      const range = st.wristMax - st.wristMin;
      if (range > 60 && st.phase !== 'OPEN') {
        st.phase = 'OPEN';
        st.reps++;
        repCounted = true;
        st.wristMin = Infinity;
        st.wristMax = -Infinity;
      }
    } else if (ex.id === 'spread') {
      const allExt = (hand.extendedCount ?? 0) >= 4;
      const allClose = hand.gesture === 'FIST';
      if (st.phase === 'IDLE' || st.phase === 'CLOSE') {
        if (allExt) { st.phase = 'OPEN'; }
      } else if (st.phase === 'OPEN') {
        if (allClose) {
          st.phase = 'CLOSE';
          st.reps++;
          repCounted = true;
        }
      }
    }

    if (repCounted && this.drillActive) {
      this.drillReps++;
    }

    if (this.repDisplay) this.repDisplay.textContent = String(st.reps);
    if (this.phaseDisplay && !this.drillActive) {
      this.phaseDisplay.textContent =
        st.phase === 'OPEN' ? '▲ HOLD OPEN' :
        st.phase === 'CLOSE' ? '▼ CLOSE HAND' : 'READY — BEGIN REPS';
    }

    this.updateCadenceDisplay();
    this.buildProgressList();
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.el?.classList.toggle('hidden', !v);
  }

  dispose(): void {
    this.el?.remove();
  }
}
