/**
 * ModeSwitcher — the dock/tab bar at the bottom of the screen
 * that lets users switch between HOME and all 4 real-life modes.
 */

import type { AppMode } from './ModeManager';
import { MODE_META } from './ModeManager';

export class ModeSwitcher {
  private el: HTMLDivElement;
  private buttons = new Map<AppMode, HTMLButtonElement>();
  private onChange: ((mode: AppMode) => void) | null = null;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'mode-switcher';
    this.el.setAttribute('role', 'tablist');
    this.el.setAttribute('aria-label', 'Application Modes');

    const modes: AppMode[] = ['HOME', 'REHAB', 'PANEL', 'SIGN', 'SLIDES'];
    for (const mode of modes) {
      const meta = MODE_META[mode];
      const btn = document.createElement('button');
      btn.className = 'mode-tab' + (mode === 'HOME' ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', mode === 'HOME' ? 'true' : 'false');
      btn.id = `mode-tab-${mode.toLowerCase()}`;
      btn.innerHTML = `
        <span class="mode-tab-icon">${meta.icon}</span>
        <span class="mode-tab-label">${meta.label}</span>
      `;
      btn.addEventListener('click', () => {
        if (this.onChange) this.onChange(mode);
      });
      this.buttons.set(mode, btn);
      this.el.append(btn);
    }

    parent.append(this.el);
  }

  setActive(mode: AppMode): void {
    for (const [m, btn] of this.buttons) {
      const isActive = m === mode;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    }
  }

  onModeChange(fn: (mode: AppMode) => void): void {
    this.onChange = fn;
  }
}
