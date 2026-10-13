/**
 * RehabMode — Hand Rehabilitation Tracker
 *
 * Uses the live GestureEngine data (extension[0..4], palmOpenness, palmRoll)
 * to let patients track daily finger exercises with rep counting and progress.
 */

import type { InputHand } from '../interaction/InputTypes';

export interface RehabExercise {
  id: string;
  name: string;
  instruction: string;
  repTarget: number;
}

export const REHAB_EXERCISES: RehabExercise[] = [
  { id: 'grip',    name: 'GRIP STRENGTH',      instruction: 'Make a FIST → Open PALM. Repeat.',   repTarget: 10 },
  { id: 'index',   name: 'INDEX ISOLATION',    instruction: 'Extend only your INDEX finger fully.', repTarget: 10 },
  { id: 'wrist',   name: 'WRIST ROTATION',     instruction: 'Rotate wrist LEFT → RIGHT slowly.',   repTarget: 10 },
  { id: 'spread',  name: 'FINGER SPREAD',      instruction: 'Spread ALL fingers wide, then close.', repTarget: 10 },
];

interface ExerciseState {
  reps: number;
  phase: 'OPEN' | 'CLOSE' | 'IDLE';
  maxExtension: number[];
  maxWristRange: number;
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
    maxExtension: [0, 0, 0, 0, 0],
    maxWristRange: 0,
    wristMin: Infinity,
    wristMax: -Infinity,
  }));

  private fingerBars: HTMLElement[] = [];
  private fingerLabels: HTMLElement[] = [];
  private wristDial: HTMLElement | null = null;
  private wristValue: HTMLElement | null = null;
  private repDisplay: HTMLElement | null = null;
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
          <div class="mode-sub">Real-time physiotherapy assistant • No hardware required</div>
        </div>
        <div class="mode-session" id="rehab-session">SESSION 00:00</div>
      </div>

      <div class="rehab-body">

        <!-- EXERCISE SELECTOR -->
        <div class="rehab-card exercise-card">
          <div class="rehab-card-title">EXERCISE</div>
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

        <!-- REPS COUNTER -->
        <div class="rehab-card reps-card">
          <div class="rehab-card-title">REPS</div>
          <div class="reps-big" id="rehab-reps">0</div>
          <div class="reps-target" id="rehab-target">/ 10</div>
          <div class="reps-phase" id="rehab-phase">STANDBY</div>
          <div class="reps-bar-wrap"><div class="reps-bar" id="reps-bar"></div></div>
        </div>

        <!-- PROGRESS -->
        <div class="rehab-card progress-card">
          <div class="rehab-card-title">TODAY'S PROGRESS</div>
          <div id="rehab-progress-list" class="progress-list"></div>
        </div>

      </div>
    `;
    parent.append(this.el);

    this.sessionEl = this.el.querySelector('#rehab-session');
    this.exerciseInstr = this.el.querySelector('#rehab-instr');
    this.wristDial = this.el.querySelector('#wrist-indicator');
    this.wristValue = this.el.querySelector('#wrist-val');
    this.repDisplay = this.el.querySelector('#rehab-reps');
    this.phaseDisplay = this.el.querySelector('#rehab-phase');
    this.palmRing = this.el.querySelector('#palm-ring-fill');
    this.palmPct = this.el.querySelector('#palm-pct');

    this.buildFingerBars();
    this.buildExerciseTabs();
    this.updateExercise();
    this.buildProgressList();
  }

  private buildFingerBars(): void {
    const container = this.el!.querySelector('#finger-bars')!;
    const names = ['THUMB', 'INDEX', 'MIDDLE', 'RING', 'PINKY'];
    for (let i = 0; i < 5; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'finger-bar-wrap';
      wrap.innerHTML = `
        <div class="finger-label">${names[i]}</div>
        <div class="finger-track"><div class="finger-fill" id="finger-fill-${i}"></div></div>
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
    const target = this.el!.querySelector('#rehab-target');
    if (target) target.textContent = `/ ${ex.repTarget}`;
    this.updateRepsBar();
    this.buildProgressList();
  }

  private buildProgressList(): void {
    const list = this.el?.querySelector('#rehab-progress-list');
    if (!list) return;
    list.innerHTML = '';
    REHAB_EXERCISES.forEach((ex, i) => {
      const st = this.states[i];
      const pct = Math.min(1, st.reps / ex.repTarget);
      const row = document.createElement('div');
      row.className = 'progress-row';
      row.innerHTML = `
        <span class="progress-name">${ex.name}</span>
        <div class="progress-track"><div class="progress-fill" style="width:${(pct * 100).toFixed(0)}%"></div></div>
        <span class="progress-count">${st.reps}/${ex.repTarget}</span>
      `;
      list.append(row);
    });
  }

  private updateRepsBar(): void {
    const bar = this.el?.querySelector('#reps-bar') as HTMLElement;
    if (!bar) return;
    const ex = REHAB_EXERCISES[this.currentExercise];
    const st = this.states[this.currentExercise];
    bar.style.width = `${Math.min(100, (st.reps / ex.repTarget) * 100).toFixed(0)}%`;
  }

  update(dt: number, hands: InputHand[]): void {
    if (!this.visible || !this.el) return;

    this.sessionTime += dt;
    const mins = Math.floor(this.sessionTime / 60);
    const secs = Math.floor(this.sessionTime % 60);
    if (this.sessionEl)
      this.sessionEl.textContent = `SESSION ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const hand = hands.find(h => h.active);
    if (!hand) {
      if (this.phaseDisplay) this.phaseDisplay.textContent = 'NO HAND — SHOW HAND TO CAMERA';
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

    // Rep counting — grip exercise (FIST → OPEN_PALM)
    const exIdx = this.currentExercise;
    const st = this.states[exIdx];
    const ex = REHAB_EXERCISES[exIdx];

    if (ex.id === 'grip') {
      const isFist = hand.gesture === 'FIST';
      const isOpen = hand.gesture === 'OPEN_PALM' || (hand.extendedCount ?? 0) >= 4;
      if (st.phase === 'IDLE' || st.phase === 'OPEN') {
        if (isFist) { st.phase = 'CLOSE'; }
      } else if (st.phase === 'CLOSE') {
        if (isOpen) { st.phase = 'OPEN'; st.reps++; }
      }
    } else if (ex.id === 'index') {
      const indexExt = hand.extension?.[1] ?? 0;
      const othersDown = (hand.extension?.[2] ?? 0) < 0.4 &&
                         (hand.extension?.[3] ?? 0) < 0.4 &&
                         (hand.extension?.[4] ?? 0) < 0.4;
      if (st.phase === 'IDLE' || st.phase === 'CLOSE') {
        if (indexExt > 0.8 && othersDown) { st.phase = 'OPEN'; st.reps++; }
      } else if (st.phase === 'OPEN') {
        if (indexExt < 0.3) { st.phase = 'CLOSE'; }
      }
    } else if (ex.id === 'wrist') {
      if (rollDeg < st.wristMin) st.wristMin = rollDeg;
      if (rollDeg > st.wristMax) st.wristMax = rollDeg;
      const range = st.wristMax - st.wristMin;
      if (range > 60 && st.phase !== 'OPEN') { st.phase = 'OPEN'; st.reps++; st.wristMin = Infinity; st.wristMax = -Infinity; }
    } else if (ex.id === 'spread') {
      const allExt = (hand.extendedCount ?? 0) >= 4;
      const allClose = hand.gesture === 'FIST';
      if (st.phase === 'IDLE' || st.phase === 'CLOSE') {
        if (allExt) { st.phase = 'OPEN'; }
      } else if (st.phase === 'OPEN') {
        if (allClose) { st.phase = 'CLOSE'; st.reps++; }
      }
    }

    if (this.repDisplay) this.repDisplay.textContent = String(st.reps);
    if (this.phaseDisplay) this.phaseDisplay.textContent =
      st.reps >= ex.repTarget ? '✅ SET COMPLETE!' :
      st.phase === 'OPEN' ? '▲ HOLD OPEN' :
      st.phase === 'CLOSE' ? '▼ CLOSE HAND' : 'READY — BEGIN EXERCISE';
    this.updateRepsBar();
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
