/**
 * ModeManager — switches between Brahmastra AI real-life application modes.
 * Each mode has its own overlay panel rendered on top of the 3D scene.
 */

export type AppMode = 'HOME' | 'REHAB' | 'PANEL' | 'SIGN' | 'SLIDES';

export interface ModeChangeEvent {
  from: AppMode;
  to: AppMode;
}

type ModeListener = (event: ModeChangeEvent) => void;

export const MODE_META: Record<AppMode, { label: string; icon: string; desc: string }> = {
  HOME:   { label: 'BRAHMASTRA AI',       icon: '🪐', desc: 'Neural Intelligence Core' },
  REHAB:  { label: 'REHAB TRACKER',       icon: '🏥', desc: 'Hand Rehabilitation' },
  PANEL:  { label: 'CONTROL PANEL',       icon: '🏭', desc: 'Touchless Interface' },
  SIGN:   { label: 'SIGN LANGUAGE',       icon: '🤟', desc: 'Accessibility Kit' },
  SLIDES: { label: 'PRESENTATION',        icon: '🎤', desc: 'Gesture Slides Control' },
};

export class ModeManager {
  private current: AppMode = 'HOME';
  private listeners: ModeListener[] = [];

  get mode(): AppMode { return this.current; }

  set(mode: AppMode): void {
    if (mode === this.current) return;
    const from = this.current;
    this.current = mode;
    for (const fn of this.listeners) fn({ from, to: mode });
  }

  onModeChange(fn: ModeListener): void {
    this.listeners.push(fn);
  }

  cycle(dir: 1 | -1): AppMode {
    const modes: AppMode[] = ['HOME', 'REHAB', 'PANEL', 'SIGN', 'SLIDES'];
    const idx = modes.indexOf(this.current);
    const next = modes[(idx + dir + modes.length) % modes.length];
    this.set(next);
    return next;
  }
}
