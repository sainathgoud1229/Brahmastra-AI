/**
 * ControlPanelMode — Touchless Machine Control Panel
 *
 * Renders 6 virtual holographic buttons. POINT gesture moves the cursor,
 * PINCH selects. Useful in hospitals, factories, food labs — anywhere
 * you can't touch a screen.
 */

import type { InputHand } from '../interaction/InputTypes';

export interface VirtualButton {
  id: string;
  label: string;
  icon: string;
  action: string;
  color: string;
}

const DEFAULT_BUTTONS: VirtualButton[] = [
  { id: 'btn-a', label: 'POWER',    icon: '⚡', action: 'POWER_TOGGLE',   color: '#ff4d4d' },
  { id: 'btn-b', label: 'LIGHTS',   icon: '💡', action: 'LIGHTS_TOGGLE',  color: '#ffb340' },
  { id: 'btn-c', label: 'ALERT',    icon: '🚨', action: 'ALERT_TRIGGER',  color: '#ff6b35' },
  { id: 'btn-d', label: 'CONFIRM',  icon: '✅', action: 'CONFIRM',        color: '#2ff3ff' },
  { id: 'btn-e', label: 'CAMERA',   icon: '📷', action: 'CAMERA_SNAP',    color: '#8fd8ff' },
  { id: 'btn-f', label: 'LOCK',     icon: '🔒', action: 'LOCK_SYSTEM',    color: '#a78bfa' },
];

export class ControlPanelMode {
  private el: HTMLDivElement | null = null;
  private visible = false;
  private buttons = DEFAULT_BUTTONS;
  private hoveredBtn: string | null = null;
  private pinchHeld = false;
  private logEl: HTMLElement | null = null;
  private cursorEl: HTMLElement | null = null;
  private gestureLabel: HTMLElement | null = null;
  private activationCooldown = 0;

  build(parent: HTMLElement): void {
    this.el = document.createElement('div');
    this.el.className = 'mode-overlay panel-overlay hidden';
    this.el.innerHTML = `
      <div class="mode-header">
        <span class="mode-icon">🏭</span>
        <div>
          <div class="mode-title">TOUCHLESS CONTROL PANEL</div>
          <div class="mode-sub">Point to hover • Pinch to activate • No touch needed</div>
        </div>
        <div class="panel-gesture-label" id="panel-gesture">STANDBY</div>
      </div>

      <div class="panel-body">

        <div class="panel-grid" id="panel-grid"></div>

        <div class="panel-sidebar">
          <div class="panel-section-title">HOW TO USE</div>
          <div class="panel-hint">👉 <b>POINT</b> gesture → move cursor</div>
          <div class="panel-hint">🤌 <b>PINCH</b> gesture → activate button</div>
          <div class="panel-hint">✋ <b>FIST</b> → emergency hold</div>
          <div class="panel-hint">🖐 <b>OPEN PALM</b> → confirm/resume</div>

          <div class="panel-section-title" style="margin-top:1.5rem">EVENT LOG</div>
          <div class="panel-log" id="panel-log"></div>
        </div>

      </div>

      <div class="panel-cursor" id="panel-cursor"></div>
    `;
    parent.append(this.el);

    this.gestureLabel = this.el.querySelector('#panel-gesture');
    this.logEl = this.el.querySelector('#panel-log');
    this.cursorEl = this.el.querySelector('#panel-cursor');

    this.buildButtonGrid();
  }

  private buildButtonGrid(): void {
    const grid = this.el!.querySelector('#panel-grid')!;
    for (const btn of this.buttons) {
      const el = document.createElement('div');
      el.className = 'vbutton';
      el.id = btn.id;
      el.style.setProperty('--btn-color', btn.color);
      el.innerHTML = `
        <div class="vbutton-icon">${btn.icon}</div>
        <div class="vbutton-label">${btn.label}</div>
        <div class="vbutton-status" id="${btn.id}-status">READY</div>
      `;
      grid.append(el);
    }
  }

  update(dt: number, hands: InputHand[]): void {
    if (!this.visible || !this.el) return;

    this.activationCooldown = Math.max(0, this.activationCooldown - dt);

    const hand = hands.find(h => h.active);
    if (!hand) {
      if (this.gestureLabel) this.gestureLabel.textContent = 'NO HAND DETECTED';
      if (this.cursorEl) this.cursorEl.style.opacity = '0';
      return;
    }

    const gesture = hand.gesture;
    if (this.gestureLabel) this.gestureLabel.textContent = gesture;

    // FIST = emergency hold
    if (gesture === 'FIST') {
      if (this.gestureLabel) this.gestureLabel.textContent = '🚨 EMERGENCY HOLD';
      if (this.cursorEl) this.cursorEl.style.opacity = '0';
      return;
    }

    // Move cursor to index tip position (normalised 0..1 → pixel)
    const tx = hand.indexTip?.x ?? hand.palm.x;
    const ty = hand.indexTip?.y ?? hand.palm.y;
    const cx = (1 - tx) * window.innerWidth;  // mirrored
    const cy = ty * window.innerHeight;

    if (this.cursorEl) {
      this.cursorEl.style.opacity = gesture === 'POINT' || gesture === 'PINCH' ? '1' : '0.5';
      this.cursorEl.style.left = `${cx}px`;
      this.cursorEl.style.top = `${cy}px`;
      this.cursorEl.classList.toggle('pinching', gesture === 'PINCH');
    }

    // Hover detection
    let newHovered: string | null = null;
    for (const btn of this.buttons) {
      const el = this.el!.querySelector<HTMLElement>(`#${btn.id}`);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const inside = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
      el.classList.toggle('hovered', inside);
      if (inside) newHovered = btn.id;
    }
    this.hoveredBtn = newHovered;

    // Pinch = activate hovered button
    const isPinching = gesture === 'PINCH';
    if (isPinching && !this.pinchHeld && this.hoveredBtn && this.activationCooldown <= 0) {
      this.activateButton(this.hoveredBtn);
      this.activationCooldown = 1.0; // 1s cooldown
    }
    this.pinchHeld = isPinching;
  }

  private activateButton(btnId: string): void {
    const btn = this.buttons.find(b => b.id === btnId);
    if (!btn) return;

    const el = this.el!.querySelector(`#${btnId}`);
    el?.classList.add('activated');
    setTimeout(() => el?.classList.remove('activated'), 600);

    const statusEl = this.el!.querySelector(`#${btnId}-status`);
    if (statusEl) {
      statusEl.textContent = 'ACTIVATED!';
      setTimeout(() => { statusEl.textContent = 'READY'; }, 1200);
    }

    this.log(`[${new Date().toLocaleTimeString()}] ${btn.icon} ${btn.label} → ${btn.action}`);
  }

  private log(msg: string): void {
    if (!this.logEl) return;
    const line = document.createElement('div');
    line.className = 'panel-log-entry';
    line.textContent = msg;
    this.logEl.prepend(line);
    if (this.logEl.children.length > 8) {
      this.logEl.lastElementChild?.remove();
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
