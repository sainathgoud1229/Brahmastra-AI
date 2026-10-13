import * as THREE from 'three';
import { TAU } from '../utils/MathUtils';

export interface PlanetDef {
  name: string;
  tag: string;
  radius: number;
  distance: number;
  orbitalSpeed: number;
  rotationSpeed: number;
  tilt: number;
  primaryColor: number;
  atmosphereColor: number;
  description: string;
  hasRings?: boolean;
  hasMoon?: boolean;
}

export const SOLAR_SYSTEM_PLANETS: PlanetDef[] = [
  {
    name: 'MERCURY',
    tag: '1ST ORBIT',
    radius: 0.048,
    distance: 1.75,
    orbitalSpeed: 0.65,
    rotationSpeed: 0.4,
    tilt: 0.03,
    primaryColor: 0xa8b2b8,
    atmosphereColor: 0x668899,
    description: 'TERRESTRIAL • 0.39 AU • SWIFT',
  },
  {
    name: 'VENUS',
    tag: '2ND ORBIT',
    radius: 0.072,
    distance: 2.15,
    orbitalSpeed: 0.50,
    rotationSpeed: -0.25, // Retrograde rotation
    tilt: 3.10,
    primaryColor: 0xe8b87a,
    atmosphereColor: 0xffd288,
    description: 'GREENHOUSE • 0.72 AU • DENSE ATMOSPHERE',
  },
  {
    name: 'EARTH',
    tag: '3RD ORBIT',
    radius: 0.082,
    distance: 2.65,
    orbitalSpeed: 0.40,
    rotationSpeed: 1.25,
    tilt: 0.41, // ~23.5 degrees
    primaryColor: 0x1b74e4,
    atmosphereColor: 0x00e5ff,
    description: 'BIOSPHERE • 1.00 AU • HABITABLE ZONE',
    hasMoon: true,
  },
  {
    name: 'MARS',
    tag: '4TH ORBIT',
    radius: 0.058,
    distance: 3.15,
    orbitalSpeed: 0.32,
    rotationSpeed: 1.15,
    tilt: 0.44, // ~25 degrees
    primaryColor: 0xdd4b2b,
    atmosphereColor: 0xff6633,
    description: 'DESERT • 1.52 AU • IRON OXIDE SURFACE',
  },
  {
    name: 'JUPITER',
    tag: '5TH ORBIT',
    radius: 0.175,
    distance: 3.85,
    orbitalSpeed: 0.22,
    rotationSpeed: 2.2, // Rapid rotation (~10 hrs)
    tilt: 0.05,
    primaryColor: 0xd49b6a,
    atmosphereColor: 0xffc48c,
    description: 'GAS GIANT • 5.20 AU • GREAT RED SPOT',
  },
  {
    name: 'SATURN',
    tag: '6TH ORBIT',
    radius: 0.145,
    distance: 4.65,
    orbitalSpeed: 0.16,
    rotationSpeed: 1.9,
    tilt: 0.47, // ~27 degrees
    primaryColor: 0xdfc08a,
    atmosphereColor: 0xffe2a4,
    description: 'RINGED GIANT • 9.58 AU • DUST DISC',
    hasRings: true,
  },
  {
    name: 'URANUS',
    tag: '7TH ORBIT',
    radius: 0.105,
    distance: 5.35,
    orbitalSpeed: 0.12,
    rotationSpeed: -1.4,
    tilt: 1.71, // ~98 degrees tipped on side
    primaryColor: 0x48d6db,
    atmosphereColor: 0x7affff,
    description: 'ICE GIANT • 19.2 AU • RETROGRADE TILT',
  },
  {
    name: 'NEPTUNE',
    tag: '8TH ORBIT',
    radius: 0.102,
    distance: 6.00,
    orbitalSpeed: 0.09,
    rotationSpeed: 1.5,
    tilt: 0.49,
    primaryColor: 0x255bf0,
    atmosphereColor: 0x4da6ff,
    description: 'ICE GIANT • 30.1 AU • SUPERSONIC WINDS',
  },
  {
    name: 'PLUTO',
    tag: '9TH ORBIT',
    radius: 0.040,
    distance: 6.60,
    orbitalSpeed: 0.07,
    rotationSpeed: 0.4,
    tilt: 2.13,
    primaryColor: 0xc8b8a8,
    atmosphereColor: 0xd8c8b8,
    description: 'DWARF SYSTEM • 39.5 AU • KUIPER BELT',
  },
];

interface PlanetInstance {
  config: PlanetDef;
  pivot: THREE.Group;
  bodyPivot: THREE.Group;
  planetMesh: THREE.Mesh;
  glowMesh: THREE.Mesh;
  labelSprite: THREE.Sprite;
  orbitLine: THREE.LineLoop;
  currentAngle: number;
  moonPivot?: THREE.Group;
  moonMesh?: THREE.Mesh;
  ringsMesh?: THREE.Mesh;
}

/**
 * Procedural canvas texture generator for planetary surfaces.
 */
function createPlanetTexture(config: PlanetDef): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const hex = config.primaryColor;
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;

  // Base wash
  const baseGrad = ctx.createLinearGradient(0, 0, 0, 256);
  baseGrad.addColorStop(0, `rgb(${Math.max(0, r - 35)}, ${Math.max(0, g - 35)}, ${Math.max(0, b - 35)})`);
  baseGrad.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`);
  baseGrad.addColorStop(1, `rgb(${Math.max(0, r - 45)}, ${Math.max(0, g - 45)}, ${Math.max(0, b - 45)})`);
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 256);

  if (config.name === 'EARTH') {
    // Continents
    ctx.fillStyle = '#267a3e';
    for (let i = 0; i < 9; i++) {
      const cx = 50 + i * 50 + (i % 2) * 20;
      const cy = 70 + (i % 3) * 45;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 32 + (i % 3) * 10, 22 + (i % 2) * 8, (i * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
    // Polar ice caps
    ctx.fillStyle = 'rgba(235, 250, 255, 0.9)';
    ctx.fillRect(0, 0, 512, 18);
    ctx.fillRect(0, 238, 512, 18);
    // Swirling white clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    for (let c = 0; c < 14; c++) {
      ctx.beginPath();
      ctx.arc(30 + c * 38, 60 + (c % 4) * 35, 14 + (c % 3) * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (config.name === 'JUPITER') {
    // Banded gas stripes
    const bands = [
      '#e2a872', '#b36d39', '#f0c79e', '#9b5327', '#e2a872',
      '#cb834c', '#e2a872', '#8c4217', '#eec9a3', '#b36d39',
    ];
    const bandHeight = 256 / bands.length;
    for (let i = 0; i < bands.length; i++) {
      ctx.fillStyle = bands[i];
      ctx.fillRect(0, i * bandHeight, 512, bandHeight + 2);
    }
    // Great Red Spot
    ctx.fillStyle = '#b73719';
    ctx.beginPath();
    ctx.ellipse(320, 165, 38, 22, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5c290';
    ctx.beginPath();
    ctx.ellipse(320, 165, 18, 10, -0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (config.name === 'SATURN') {
    // Golden subtle gas bands
    const bands = ['#e6caa0', '#d8b682', '#eed5b0', '#c9a46c', '#eed5b0'];
    const bandHeight = 256 / bands.length;
    for (let i = 0; i < bands.length; i++) {
      ctx.fillStyle = bands[i];
      ctx.fillRect(0, i * bandHeight, 512, bandHeight + 2);
    }
  } else if (config.name === 'MARS') {
    // Basalt patches & polar ice
    ctx.fillStyle = '#9e2e14';
    ctx.beginPath();
    ctx.ellipse(160, 120, 75, 45, 0.3, 0, Math.PI * 2);
    ctx.ellipse(380, 140, 60, 35, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Ice caps
    ctx.fillStyle = '#fbeee6';
    ctx.fillRect(0, 0, 512, 14);
    ctx.fillRect(0, 244, 512, 12);
  } else if (config.name === 'VENUS') {
    // Dense swirling yellowish cloud streaks
    ctx.fillStyle = 'rgba(255, 230, 170, 0.35)';
    for (let v = 0; v < 10; v++) {
      ctx.beginPath();
      ctx.ellipse(40 + v * 50, 40 + (v % 5) * 40, 60, 15, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates Saturn's holographic ring disc texture.
 */
function createSaturnRingsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0.0, 'rgba(0, 229, 255, 0.0)');
    grad.addColorStop(0.15, 'rgba(235, 205, 155, 0.75)');
    grad.addColorStop(0.35, 'rgba(215, 175, 120, 0.85)');
    grad.addColorStop(0.48, 'rgba(0, 0, 0, 0.1)'); // Cassini division
    grad.addColorStop(0.55, 'rgba(225, 195, 140, 0.7)');
    grad.addColorStop(0.85, 'rgba(195, 160, 110, 0.5)');
    grad.addColorStop(1.0, 'rgba(0, 229, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1);
  }
  return new THREE.CanvasTexture(canvas);
}

/**
 * Floating holographic label for planet inspection.
 */
function createPlanetLabelSprite(name: string, tag: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 72;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 256, 72);
    // Box
    ctx.fillStyle = 'rgba(2, 10, 24, 0.82)';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, 244, 60);
    ctx.fillRect(6, 6, 244, 60);

    // Text
    ctx.font = 'bold 24px "Share Tech Mono", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'center';
    ctx.fillText(name, 128, 32);

    ctx.font = '14px "Rajdhani", sans-serif';
    ctx.fillStyle = '#b5eaff';
    ctx.fillText(tag, 128, 54);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.85,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.65, 0.18, 1);
  return sprite;
}

/**
 * PlanetarySystem
 *
 * Simulates all 9 celestial planets revolving in synchronized Keplerian orbits
 * around the central Brahmastra AI holographic neural core, while rotating
 * continuously on their own tilted axes.
 */
export class PlanetarySystem {
  readonly group = new THREE.Group();

  private readonly planets: PlanetInstance[] = [];
  private visible = true;
  private pulseEnergy = 0;

  constructor() {
    this.group.name = 'PlanetarySystem';
    this.buildSystem();
  }

  private buildSystem(): void {
    const sphereGeo = new THREE.SphereGeometry(1, 32, 24);
    const ringTex = createSaturnRingsTexture();

    for (let i = 0; i < SOLAR_SYSTEM_PLANETS.length; i++) {
      const cfg = SOLAR_SYSTEM_PLANETS[i];

      // Orbital Pivot: rotated around Y-axis to orbit the sun/core
      const pivot = new THREE.Group();
      // Random starting angle around the orbit for natural staggering
      const startAngle = (i * (TAU / SOLAR_SYSTEM_PLANETS.length) * 1.618) % TAU;

      // 1. Orbital Track (faint glowing circle)
      const trackPoints: THREE.Vector3[] = [];
      const segments = 96;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * TAU;
        trackPoints.push(new THREE.Vector3(Math.cos(theta) * cfg.distance, 0, Math.sin(theta) * cfg.distance));
      }
      const trackGeo = new THREE.BufferGeometry().setFromPoints(trackPoints);
      const trackMat = new THREE.LineBasicMaterial({
        color: cfg.atmosphereColor,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
      });
      const orbitLine = new THREE.LineLoop(trackGeo, trackMat);
      this.group.add(orbitLine);

      // 2. Planet Body Container (positioned at orbital distance)
      const bodyPivot = new THREE.Group();
      bodyPivot.position.set(cfg.distance, 0, 0);

      // Apply axial tilt
      bodyPivot.rotation.z = cfg.tilt;

      // 3. Planet Mesh (continuous axial rotation happens inside)
      const texture = createPlanetTexture(cfg);
      const planetMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.65,
        metalness: 0.15,
        emissive: new THREE.Color(cfg.primaryColor),
        emissiveIntensity: 0.25,
      });
      const planetMesh = new THREE.Mesh(sphereGeo, planetMat);
      planetMesh.scale.setScalar(cfg.radius);
      bodyPivot.add(planetMesh);

      // 4. Atmospheric Corona Glow Shell
      const glowGeo = new THREE.SphereGeometry(cfg.radius * 1.15, 20, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: cfg.atmosphereColor,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      bodyPivot.add(glowMesh);

      // 5. Special Celestial Features
      let ringsMesh: THREE.Mesh | undefined;
      if (cfg.hasRings) {
        // Saturn's Holographic Planetary Rings
        const ringGeo = new THREE.RingGeometry(cfg.radius * 1.45, cfg.radius * 2.5, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
        });
        ringsMesh = new THREE.Mesh(ringGeo, ringMat);
        ringsMesh.rotation.x = Math.PI / 2; // Flat with equator
        bodyPivot.add(ringsMesh);
      }

      let moonPivot: THREE.Group | undefined;
      let moonMesh: THREE.Mesh | undefined;
      if (cfg.hasMoon) {
        // Earth's Moon
        moonPivot = new THREE.Group();
        const moonGeo = new THREE.SphereGeometry(cfg.radius * 0.26, 16, 12);
        const moonMat = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          emissive: 0x444444,
          emissiveIntensity: 0.2,
          roughness: 0.8,
        });
        moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.set(cfg.radius * 2.3, 0, 0);
        moonPivot.add(moonMesh);
        bodyPivot.add(moonPivot);
      }

      // 6. Holographic Name Badge (billboarded above planet)
      const labelSprite = createPlanetLabelSprite(cfg.name, cfg.tag);
      labelSprite.position.set(0, cfg.radius + 0.18, 0);
      bodyPivot.add(labelSprite);

      pivot.rotation.y = startAngle;
      pivot.add(bodyPivot);
      this.group.add(pivot);

      this.planets.push({
        config: cfg,
        pivot,
        bodyPivot,
        planetMesh,
        glowMesh,
        labelSprite,
        orbitLine,
        currentAngle: startAngle,
        ringsMesh,
        moonPivot,
        moonMesh,
      });
    }
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.group.visible = visible;
  }

  toggleVisible(): boolean {
    this.setVisible(!this.visible);
    return this.visible;
  }

  get isVisible(): boolean {
    return this.visible;
  }

  /**
   * Pulse shockwave reaction when Brahmastra core surges.
   */
  triggerPulse(): void {
    this.pulseEnergy = 1.0;
  }

    public timeScale = 1.0;

  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0, Math.min(10, scale));
  }

  update(dt: number, coreActivation: number): void {
    if (!this.visible) return;

    // Decay pulse energy
    if (this.pulseEnergy > 0) {
      this.pulseEnergy = Math.max(0, this.pulseEnergy - dt * 1.5);
    }

    const speedMultiplier = (1.0 + coreActivation * 0.6 + this.pulseEnergy * 1.2) * this.timeScale;

    for (let i = 0; i < this.planets.length; i++) {
      const p = this.planets[i];
      const cfg = p.config;

      // 1. Orbital Revolution around the central Brahmastra Core
      p.currentAngle += cfg.orbitalSpeed * speedMultiplier * dt * 0.35;
      p.pivot.rotation.y = p.currentAngle;

      // 2. Continuous Axial Rotation on its own tilted axis (Earth-like daily spin)
      p.planetMesh.rotation.y += cfg.rotationSpeed * this.timeScale * dt * 0.8;

      // 3. Moon revolution if applicable
      if (p.moonPivot) {
        p.moonPivot.rotation.y += 2.2 * dt;
      }

      // 4. Core energy pulse response: brighten orbit track & glow
      const lineMat = p.orbitLine.material as THREE.LineBasicMaterial;
      lineMat.opacity = 0.16 + (coreActivation * 0.2) + (this.pulseEnergy * 0.35);

      const glowMat = p.glowMesh.material as THREE.MeshBasicMaterial;
      glowMat.opacity = 0.22 + (coreActivation * 0.25) + (this.pulseEnergy * 0.5);
    }
  }

  dispose(): void {
    for (const p of this.planets) {
      p.orbitLine.geometry.dispose();
      (p.orbitLine.material as THREE.Material).dispose();
      p.planetMesh.geometry.dispose();
      (p.planetMesh.material as THREE.Material).dispose();
      p.glowMesh.geometry.dispose();
      (p.glowMesh.material as THREE.Material).dispose();
      p.labelSprite.geometry.dispose();
      (p.labelSprite.material as THREE.Material).dispose();
      if (p.ringsMesh) {
        p.ringsMesh.geometry.dispose();
        (p.ringsMesh.material as THREE.Material).dispose();
      }
      if (p.moonMesh) {
        p.moonMesh.geometry.dispose();
        (p.moonMesh.material as THREE.Material).dispose();
      }
    }
    this.planets.length = 0;
  }
}
