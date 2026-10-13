/**
 * SignLanguageMode — Sensorless Air-Writing Notebook & Speech Pronunciation
 *
 * Replaces static charts with a webcam-based touchless Air-Notebook:
 * 1. Ruled Notebook format (lined paper, red margin line, notebook page aesthetic)
 * 2. Writes from hand in mid-air (index finger / pinch as a virtual fountain pen)
 * 3. Practice Mode for full words (tracing guidelines for words, not just letters)
 * 4. High-volume Speech Synthesizer: Pronounces what is written when the
 *    PRONOUNCE button is touched or clicked!
 */

import type { InputHand } from '../interaction/InputTypes';

interface StrokePoint {
  x: number;
  y: number;
}

const PRACTICE_WORDS = [
  'HELLO',
  'BRAHMASTRA',
  'WELCOME',
  'THANK YOU',
  'PHYSICAL AI',
  'TOUCHLESS',
  'GOOD MORNING',
];

export class SignLanguageMode {
  private el: HTMLDivElement | null = null;
  private visible = false;

  // Notebook state
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private strokes: StrokePoint[][] = [];
  private currentStroke: StrokePoint[] = [];
  private isDrawing = false;
  private writtenText = 'HELLO BRAHMASTRA';
  private selectedPracticeWord = 'HELLO';
  private showGuidelines = true;
  private penColor = '#2ff3ff';

  // UI elements
  private textDisplay: HTMLElement | null = null;
  private penCursor: HTMLElement | null = null;
  private pronounceBtn: HTMLButtonElement | null = null;
  private isSpeaking = false;
  private lastPinchState = false;

  build(parent: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.className = 'mode-overlay sign-overlay hidden';
    this.el.innerHTML = `
      <div class="mode-header">
        <span class="mode-icon">📓</span>
        <div>
          <div class="mode-title">TOUCHLESS AIR-NOTEBOOK & SPEECH PRONUNCIATION</div>
          <div class="mode-sub">Write in mid-air with your hand • Practice full words • Pronounce aloud with high volume</div>
        </div>
        <div class="notebook-voice-badge" id="notebook-voice-badge">SPEECH ENGINE READY</div>
      </div>

      <div class="notebook-wrapper">

        <!-- NOTEBOOK TOOLBAR -->
        <div class="notebook-toolbar">
          <div class="toolbar-group">
            <span class="tb-label">PRACTICE WORD:</span>
            <select class="notebook-select" id="notebook-practice-select">
              ${PRACTICE_WORDS.map(w => `<option value="${w}">${w}</option>`).join('')}
              <option value="CUSTOM">FREEHAND WRITING</option>
            </select>
            <button class="tb-btn" id="nb-toggle-guide">📏 HIDE GUIDELINES</button>
          </div>

          <div class="toolbar-group">
            <button class="tb-btn pronounce-btn" id="nb-pronounce">
              <span class="p-icon">🔊</span> PRONOUNCE (SPEAK LOUDER)
            </button>
            <button class="tb-btn" id="nb-clear">🧹 CLEAR PAGE</button>
            <button class="tb-btn" id="nb-undo">↩️ UNDO</button>
          </div>
        </div>

        <!-- NOTEBOOK PAPER SHEET -->
        <div class="notebook-sheet" id="notebook-sheet">
          <div class="notebook-margin-line"></div>
          
          <!-- GUIDELINE OVERLAY FOR PRACTICE WORDS -->
          <div class="notebook-guideline-text" id="notebook-guideline">${this.selectedPracticeWord}</div>

          <!-- AIR DRAWING CANVAS -->
          <canvas class="notebook-canvas" id="notebook-canvas"></canvas>

          <!-- PEN STATUS BADGE -->
          <div class="notebook-pen-badge" id="notebook-pen-badge">✍️ AIR PEN HOVERING (POINT OR PINCH TO WRITE)</div>
        </div>

        <!-- NOTEBOOK BOTTOM TEXT & WORD CHIPS -->
        <div class="notebook-transcription-bar">
          <div class="transcription-label">WRITTEN TEXT ON NOTEBOOK:</div>
          <input type="text" class="notebook-text-input" id="notebook-input" value="${this.writtenText}" placeholder="Write in mid-air or type text here..." />
          
          <div class="quick-chips-row">
            <span class="chips-title">QUICK PHRASES:</span>
            ${['HELLO', 'BRAHMASTRA', 'THANK YOU', 'WELCOME', 'GOOD MORNING', 'YES', 'NO'].map(word => `
              <button class="word-chip" data-word="${word}">${word}</button>
            `).join('')}
          </div>

          <div class="speaking-wave-box" id="speaking-wave" style="display:none">
            <span class="wave-bar"></span><span class="wave-bar"></span><span class="wave-bar"></span>
            <span class="speaking-text" id="speaking-text">SPEAKING LOUD: "${this.writtenText}"</span>
          </div>
        </div>

      </div>

      <div class="air-pen-cursor" id="air-pen-cursor">
        <span class="pen-tip-dot"></span>
        <span class="pen-tip-label">✍️ PEN</span>
      </div>
    `;
    parent.append(this.el);

    this.canvas = this.el.querySelector('#notebook-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas?.getContext('2d') ?? null;
    this.textDisplay = this.el.querySelector('#notebook-input');
    this.penCursor = this.el.querySelector('#air-pen-cursor');
    this.pronounceBtn = this.el.querySelector('#nb-pronounce');

    this.setupNotebook();
  }

  private setupNotebook(): void {
    if (!this.el || !this.canvas) return;

    // Resize canvas to match notebook sheet
    const resizeCanvas = () => {
      const sheet = this.el?.querySelector('#notebook-sheet') as HTMLElement;
      if (!sheet || !this.canvas) return;
      const rect = sheet.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.redrawCanvas();
    };

    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 100);

    // Pronounce button click
    this.pronounceBtn?.addEventListener('click', () => this.speakLoud());

    // Clear button
    this.el.querySelector('#nb-clear')?.addEventListener('click', () => {
      this.strokes = [];
      this.currentStroke = [];
      this.redrawCanvas();
      if (this.textDisplay) (this.textDisplay as HTMLInputElement).value = '';
      this.writtenText = '';
    });

    // Undo button
    this.el.querySelector('#nb-undo')?.addEventListener('click', () => {
      this.strokes.pop();
      this.redrawCanvas();
    });

    // Practice select
    const select = this.el.querySelector('#notebook-practice-select') as HTMLSelectElement;
    select?.addEventListener('change', () => {
      this.selectedPracticeWord = select.value === 'CUSTOM' ? '' : select.value;
      const guide = this.el?.querySelector('#notebook-guideline');
      if (guide) guide.textContent = this.selectedPracticeWord;
      if (select.value !== 'CUSTOM') {
        this.writtenText = select.value;
        if (this.textDisplay) (this.textDisplay as HTMLInputElement).value = select.value;
      }
    });

    // Toggle guidelines
    const guideBtn = this.el.querySelector('#nb-toggle-guide');
    guideBtn?.addEventListener('click', () => {
      this.showGuidelines = !this.showGuidelines;
      const guide = this.el?.querySelector('#notebook-guideline') as HTMLElement;
      if (guide) guide.style.display = this.showGuidelines ? 'block' : 'none';
      if (guideBtn) guideBtn.textContent = this.showGuidelines ? '📏 HIDE GUIDELINES' : '📏 SHOW GUIDELINES';
    });

    // Quick chips
    this.el.querySelectorAll('.word-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const word = chip.getAttribute('data-word') || '';
        this.writtenText = word;
        if (this.textDisplay) (this.textDisplay as HTMLInputElement).value = word;
        const guide = this.el?.querySelector('#notebook-guideline');
        if (guide) guide.textContent = word;
        this.speakLoud();
      });
    });

    // Text input manual typing
    this.textDisplay?.addEventListener('input', (e) => {
      this.writtenText = (e.target as HTMLInputElement).value;
      const guide = this.el?.querySelector('#notebook-guideline');
      if (guide) guide.textContent = this.writtenText;
    });

    // Mouse drawing fallback on canvas
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas!.getBoundingClientRect();
      this.isDrawing = true;
      this.currentStroke = [{ x: e.clientX - rect.left, y: e.clientY - rect.top }];
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDrawing || !this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.currentStroke.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      this.redrawCanvas();
    });

    window.addEventListener('mouseup', () => {
      if (this.isDrawing && this.currentStroke.length > 0) {
        this.strokes.push([...this.currentStroke]);
        this.currentStroke = [];
        this.isDrawing = false;
      }
    });
  }

  private redrawCanvas(): void {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const allStrokes = [...this.strokes];
    if (this.currentStroke.length > 0) {
      allStrokes.push(this.currentStroke);
    }

    this.ctx.strokeStyle = this.penColor;
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.shadowColor = '#2ff3ff';
    this.ctx.shadowBlur = 8;

    for (const stroke of allStrokes) {
      if (stroke.length < 2) continue;
      this.ctx.beginPath();
      this.ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        this.ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      this.ctx.stroke();
    }
  }

  /**
   * Speak out loud what is written in the notebook using Web Speech API
   */
  speakLoud(): void {
    const text = this.writtenText.trim() || 'No text written';
    if (!('speechSynthesis' in window)) {
      alert(`Speech Synthesis not supported: ${text}`);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1.0; // Loudest volume
    utterance.rate = 0.85;  // Clear, deliberate enunciation
    utterance.pitch = 1.0;

    // Use higher quality voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google')));
    if (naturalVoice) utterance.voice = naturalVoice;

    const waveBox = this.el?.querySelector('#speaking-wave') as HTMLElement;
    const waveText = this.el?.querySelector('#speaking-text');
    const badge = this.el?.querySelector('#notebook-voice-badge');

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (waveBox) waveBox.style.display = 'flex';
      if (waveText) waveText.textContent = `SPEAKING LOUD: "${text}"`;
      if (badge) {
        badge.textContent = '🔊 SPEAKING NOW...';
        badge.classList.add('speaking');
      }
      this.pronounceBtn?.classList.add('speaking');
    };

    utterance.onend = utterance.onerror = () => {
      this.isSpeaking = false;
      if (waveBox) waveBox.style.display = 'none';
      if (badge) {
        badge.textContent = 'SPEECH ENGINE READY';
        badge.classList.remove('speaking');
      }
      this.pronounceBtn?.classList.remove('speaking');
    };

    window.speechSynthesis.speak(utterance);
  }

  update(_dt: number, hands: InputHand[]): void {
    if (!this.visible || !this.el) return;

    const hand = hands.find(h => h.active);
    if (!hand) {
      if (this.penCursor) this.penCursor.style.opacity = '0';
      if (this.isDrawing && this.currentStroke.length > 0) {
        this.strokes.push([...this.currentStroke]);
        this.currentStroke = [];
        this.isDrawing = false;
      }
      return;
    }

    // Hand screen coordinate mapping from index fingertip
    const px = (hand.indexTip?.x ?? hand.palm?.x ?? 0.5) * window.innerWidth;
    const py = (hand.indexTip?.y ?? hand.palm?.y ?? 0.5) * window.innerHeight;

    if (this.penCursor) {
      this.penCursor.style.opacity = '1';
      this.penCursor.style.left = `${px}px`;
      this.penCursor.style.top = `${py}px`;
    }

    const isPinching = hand.pinching || hand.gesture === 'PINCH';
    const isPointing = hand.gesture === 'POINT';

    // Touchless check: Air-touching the PRONOUNCE button
    if (this.pronounceBtn) {
      const pRect = this.pronounceBtn.getBoundingClientRect();
      const inPronounce = px >= pRect.left && px <= pRect.right && py >= pRect.top && py <= pRect.bottom;
      if (inPronounce) {
        this.pronounceBtn.classList.add('hovered');
        if (isPinching && !this.lastPinchState && !this.isSpeaking) {
          this.speakLoud();
        }
      } else {
        this.pronounceBtn.classList.remove('hovered');
      }
    }

    // Air-writing on the notebook sheet canvas
    if (this.canvas) {
      const cRect = this.canvas.getBoundingClientRect();
      const inCanvas = px >= cRect.left && px <= cRect.right && py >= cRect.top && py <= cRect.bottom;
      const penBadge = this.el.querySelector('#notebook-pen-badge');

      if (inCanvas) {
        const canX = px - cRect.left;
        const canY = py - cRect.top;

        // Draw when either pointing or pinching
        const penDown = isPointing || isPinching;

        if (penDown) {
          if (!this.isDrawing) {
            this.isDrawing = true;
            this.currentStroke = [{ x: canX, y: canY }];
          } else {
            this.currentStroke.push({ x: canX, y: canY });
            this.redrawCanvas();
          }
          if (penBadge) penBadge.textContent = '✍️ WRITING IN AIR... (RELEASE FINGER TO LIFT PEN)';
          if (this.penCursor) this.penCursor.classList.add('writing');
        } else {
          if (this.isDrawing && this.currentStroke.length > 0) {
            this.strokes.push([...this.currentStroke]);
            this.currentStroke = [];
            this.isDrawing = false;
          }
          if (penBadge) penBadge.textContent = '✍️ AIR PEN HOVERING (POINT INDEX OR PINCH TO WRITE)';
          if (this.penCursor) this.penCursor.classList.remove('writing');
        }
      } else {
        if (this.isDrawing && this.currentStroke.length > 0) {
          this.strokes.push([...this.currentStroke]);
          this.currentStroke = [];
          this.isDrawing = false;
        }
      }
    }

    this.lastPinchState = isPinching;
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.el?.classList.toggle('hidden', !v);
    if (v) {
      setTimeout(() => {
        const sheet = this.el?.querySelector('#notebook-sheet') as HTMLElement;
        if (sheet && this.canvas) {
          const rect = sheet.getBoundingClientRect();
          this.canvas.width = rect.width;
          this.canvas.height = rect.height;
          this.redrawCanvas();
        }
      }, 50);
    }
  }

  dispose(): void {
    this.el?.remove();
  }
}
