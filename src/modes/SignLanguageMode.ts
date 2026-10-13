/**
 * SignLanguageMode — ASL Finger Spelling Recognition
 *
 * Matches current hand pose against a lookup table of A–Z letter patterns
 * using extension[0..4], palmNormal direction, and pinchDistance.
 * Helps deaf / hearing-impaired people practice sign language.
 */

import type { InputHand } from '../interaction/InputTypes';

interface LetterPattern {
  letter: string;
  // extended[thumb, index, middle, ring, pinky]
  ext: [boolean | null, boolean | null, boolean | null, boolean | null, boolean | null];
  pinch?: boolean; // thumb+index together
  palmFacing?: 'front' | 'back' | 'any';
  description: string;
}

// Simplified ASL static letter patterns
const ASL_PATTERNS: LetterPattern[] = [
  { letter: 'A', ext: [false, false, false, false, false], pinch: false, description: 'Fist, thumb on side' },
  { letter: 'B', ext: [false, true, true, true, true],    description: 'Four fingers up, thumb folded' },
  { letter: 'C', ext: [null, null, null, null, null],     pinch: false, description: 'Curved C shape' },
  { letter: 'D', ext: [null, true, false, false, false],  pinch: true,  description: 'Index up, others circle' },
  { letter: 'E', ext: [false, false, false, false, false], pinch: false, description: 'Fingers bent, thumb under' },
  { letter: 'F', ext: [null, false, true, true, true],    pinch: true,  description: 'Index+thumb circle, others up' },
  { letter: 'G', ext: [true, true, false, false, false],  description: 'Index and thumb point sideways' },
  { letter: 'H', ext: [false, true, true, false, false],  description: 'Index and middle point sideways' },
  { letter: 'I', ext: [false, false, false, false, true], description: 'Pinky only up' },
  { letter: 'K', ext: [true, true, true, false, false],   description: 'Index, middle up with thumb' },
  { letter: 'L', ext: [true, true, false, false, false],  description: 'L shape: index up, thumb out' },
  { letter: 'M', ext: [false, false, false, false, false], description: 'Three fingers over thumb' },
  { letter: 'N', ext: [false, false, false, false, false], description: 'Two fingers over thumb' },
  { letter: 'O', ext: [null, null, null, null, null],     pinch: true,  description: 'Fingers form an O' },
  { letter: 'P', ext: [true, true, true, false, false],   description: 'K shape pointing down' },
  { letter: 'R', ext: [false, true, true, false, false],  description: 'Crossed index and middle' },
  { letter: 'S', ext: [false, false, false, false, false], description: 'Fist with thumb over fingers' },
  { letter: 'T', ext: [true, false, false, false, false],  description: 'Thumb between index and middle' },
  { letter: 'U', ext: [false, true, true, false, false],  description: 'Index and middle up together' },
  { letter: 'V', ext: [false, true, true, false, false],  description: 'Peace / V sign' },
  { letter: 'W', ext: [false, true, true, true, false],   description: 'Three fingers up' },
  { letter: 'X', ext: [false, true, false, false, false], description: 'Index finger bent/hooked' },
  { letter: 'Y', ext: [true, false, false, false, true],  description: 'Thumb and pinky out' },
];

export class SignLanguageMode {
  private el: HTMLDivElement | null = null;
  private visible = false;

  private word = '';
  private lastLetter = '';
  private holdTimer = 0;
  private readonly HOLD_THRESHOLD = 0.8; // seconds to lock a letter
  private letterEl: HTMLElement | null = null;
  private confidenceEl: HTMLElement | null = null;
  private wordEl: HTMLElement | null = null;
  private holdBarEl: HTMLElement | null = null;
  private targetLetterEl: HTMLElement | null = null;
  private practiceMode = false;
  private targetIndex = 0;
  private score = 0;
  private scoreEl: HTMLElement | null = null;
  private fingerStateEl: HTMLElement[] = [];
  private practiceLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXY'.split('');

  build(parent: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.className = 'mode-overlay sign-overlay hidden';
    this.el.innerHTML = `
      <div class="mode-header">
        <span class="mode-icon">🤟</span>
        <div>
          <div class="mode-title">SIGN LANGUAGE STARTER KIT</div>
          <div class="mode-sub">ASL Finger Spelling • A–Z Recognition • Browser-native</div>
        </div>
        <div class="sign-score" id="sign-score">SCORE: 0</div>
      </div>

      <div class="sign-body">

        <!-- LIVE DETECTION -->
        <div class="sign-card detect-card">
          <div class="rehab-card-title">LIVE DETECTION</div>
          <div class="sign-big-letter" id="sign-letter">—</div>
          <div class="sign-confidence" id="sign-confidence">Confidence: —</div>
          <div class="hold-bar-wrap">
            <div class="hold-bar" id="hold-bar"></div>
          </div>
          <div class="sign-hint">Hold gesture steady to lock letter</div>
        </div>

        <!-- FINGER STATE -->
        <div class="sign-card finger-state-card">
          <div class="rehab-card-title">FINGER STATE</div>
          <div class="sign-fingers" id="sign-fingers"></div>
        </div>

        <!-- WORD BUILDER -->
        <div class="sign-card word-card">
          <div class="rehab-card-title">WORD BUILDER</div>
          <div class="sign-word" id="sign-word">_</div>
          <div class="sign-word-controls">
            <button class="sign-btn" id="sign-speak">🔊 SPEAK</button>
            <button class="sign-btn" id="sign-clear">🗑 CLEAR</button>
          </div>
        </div>

        <!-- PRACTICE MODE -->
        <div class="sign-card practice-card">
          <div class="rehab-card-title">PRACTICE MODE</div>
          <div class="sign-target-label">FORM THIS SIGN:</div>
          <div class="sign-target" id="sign-target">A</div>
          <div class="sign-target-desc" id="sign-target-desc">—</div>
          <div class="sign-practice-controls">
            <button class="sign-btn" id="sign-practice-toggle">▶ START PRACTICE</button>
            <button class="sign-btn" id="sign-next">⏭ SKIP</button>
          </div>
        </div>

        <!-- REFERENCE CHART -->
        <div class="sign-card chart-card">
          <div class="rehab-card-title">ASL REFERENCE</div>
          <div class="sign-chart" id="sign-chart"></div>
        </div>

      </div>
    `;
    parent.append(this.el);

    this.letterEl = this.el.querySelector('#sign-letter');
    this.confidenceEl = this.el.querySelector('#sign-confidence');
    this.wordEl = this.el.querySelector('#sign-word');
    this.holdBarEl = this.el.querySelector('#hold-bar');
    this.targetLetterEl = this.el.querySelector('#sign-target');
    this.scoreEl = this.el.querySelector('#sign-score');

    this.buildFingerState();
    this.buildChart();
    this.updateTarget();

    this.el.querySelector('#sign-speak')?.addEventListener('click', () => this.speakWord());
    this.el.querySelector('#sign-clear')?.addEventListener('click', () => { this.word = ''; this.updateWordDisplay(); });
    this.el.querySelector('#sign-practice-toggle')?.addEventListener('click', () => this.togglePractice());
    this.el.querySelector('#sign-next')?.addEventListener('click', () => this.nextTarget());
  }

  private buildFingerState(): void {
    const container = this.el!.querySelector('#sign-fingers')!;
    const names = ['👍 THUMB', '☝️ INDEX', '🖕 MID', '💍 RING', '🤙 PINKY'];
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('div');
      el.className = 'sign-finger-chip';
      el.id = `sign-chip-${i}`;
      el.innerHTML = `<span>${names[i]}</span><span class="chip-state" id="chip-state-${i}">—</span>`;
      container.append(el);
      this.fingerStateEl.push(el);
    }
  }

  private buildChart(): void {
    const chart = this.el!.querySelector('#sign-chart')!;
    for (const pat of ASL_PATTERNS) {
      const cell = document.createElement('div');
      cell.className = 'chart-cell';
      cell.innerHTML = `<b>${pat.letter}</b><span>${pat.description.slice(0, 18)}</span>`;
      chart.append(cell);
    }
  }

  private updateTarget(): void {
    if (!this.targetLetterEl) return;
    const letter = this.practiceLetters[this.targetIndex % this.practiceLetters.length];
    this.targetLetterEl.textContent = letter;
    const pat = ASL_PATTERNS.find(p => p.letter === letter);
    const desc = this.el?.querySelector('#sign-target-desc');
    if (desc) desc.textContent = pat?.description ?? '—';
  }

  private nextTarget(): void {
    this.targetIndex++;
    this.updateTarget();
  }

  private togglePractice(): void {
    this.practiceMode = !this.practiceMode;
    const btn = this.el?.querySelector('#sign-practice-toggle');
    if (btn) btn.textContent = this.practiceMode ? '⏹ STOP PRACTICE' : '▶ START PRACTICE';
  }

  private speakWord(): void {
    if (!this.word) return;
    const utter = new SpeechSynthesisUtterance(this.word);
    speechSynthesis.speak(utter);
  }

  private updateWordDisplay(): void {
    if (this.wordEl) this.wordEl.textContent = this.word || '_';
  }

  update(dt: number, hands: InputHand[]): void {
    if (!this.visible || !this.el) return;

    const hand = hands.find(h => h.active);
    if (!hand) {
      if (this.letterEl) this.letterEl.textContent = '—';
      if (this.confidenceEl) this.confidenceEl.textContent = 'Show your hand to the camera';
      return;
    }

    // Update finger state chips
    for (let i = 0; i < 5; i++) {
      const ext = hand.extension?.[i] ?? 0;
      const chipState = this.el.querySelector(`#chip-state-${i}`);
      const chip = this.el.querySelector(`#sign-chip-${i}`);
      if (chipState) chipState.textContent = ext > 0.6 ? 'UP' : 'DOWN';
      chip?.classList.toggle('extended', ext > 0.6);
    }

    // Match gesture to letter
    const { letter, confidence } = this.matchLetter(hand);

    if (this.letterEl) this.letterEl.textContent = letter || '?';
    if (this.confidenceEl) this.confidenceEl.textContent = `Confidence: ${(confidence * 100).toFixed(0)}%`;

    // Highlight chart cell
    this.el.querySelectorAll('.chart-cell').forEach(cell => {
      cell.classList.toggle('matched', cell.querySelector('b')?.textContent === letter);
    });

    // Hold timer to lock letter into word
    if (letter && letter === this.lastLetter && confidence > 0.7) {
      this.holdTimer += dt;
    } else {
      this.holdTimer = 0;
      this.lastLetter = letter;
    }

    const holdPct = Math.min(1, this.holdTimer / this.HOLD_THRESHOLD);
    if (this.holdBarEl) (this.holdBarEl as HTMLElement).style.width = `${holdPct * 100}%`;

    if (this.holdTimer >= this.HOLD_THRESHOLD && letter) {
      this.word += letter;
      this.holdTimer = 0;
      this.lastLetter = '';
      this.updateWordDisplay();

      // Practice mode check
      if (this.practiceMode) {
        const target = this.practiceLetters[this.targetIndex % this.practiceLetters.length];
        if (letter === target) {
          this.score++;
          if (this.scoreEl) this.scoreEl.textContent = `SCORE: ${this.score}`;
          this.nextTarget();
        }
      }
    }
  }

  private matchLetter(hand: InputHand): { letter: string; confidence: number } {
    const ext = hand.extension ?? [0, 0, 0, 0, 0];
    const extended = ext.map(e => e > 0.6);
    const pinching = hand.pinching ?? false;

    let best = '';
    let bestScore = 0;

    for (const pat of ASL_PATTERNS) {
      let score = 0;
      let total = 0;

      for (let i = 0; i < 5; i++) {
        if (pat.ext[i] === null) continue;
        total++;
        if (extended[i] === pat.ext[i]) score++;
      }

      if (pat.pinch !== undefined) {
        total++;
        if (pinching === pat.pinch) score++;
      }

      const confidence = total > 0 ? score / total : 0;
      if (confidence > bestScore) {
        bestScore = confidence;
        best = pat.letter;
      }
    }

    return { letter: bestScore > 0.7 ? best : '', confidence: bestScore };
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.el?.classList.toggle('hidden', !v);
  }

  dispose(): void {
    this.el?.remove();
  }
}
