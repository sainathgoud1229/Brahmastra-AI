import * as THREE from 'three';
import { SCENE } from '../config';
import { clamp, damp } from '../utils/MathUtils';

/**
 * 360° Omnidirectional Orbital Camera Rig.
 *
 * Supports full spherical orbit navigation (Top, Bottom, Left, Right views)
 * by dragging the mouse, plus smooth cinematic damping and figure-eight drift.
 */
export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;

  private readonly lookAt = new THREE.Vector3(0, 0, 0);
  private readonly current = new THREE.Vector3(0, 0, SCENE.cameraDistance);

  // Spherical Coordinates
  private theta = 0; // Azimuthal angle (horizontal orbit around core)
  private targetTheta = 0;
  private phi = Math.PI * 0.40; // Polar angle (elevation: ~0 = top view, PI/2 = horizontal, ~PI = bottom view)
  private targetPhi = Math.PI * 0.40;
  private distance: number = 8.2;
  private targetDistance: number = 8.2;

  private parallaxX = 0;
  private parallaxY = 0;
  private breathPhase = 0;
  private reducedMotion = false;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(SCENE.fov, aspect, SCENE.near, SCENE.far);
    this.updatePosition();
    this.camera.lookAt(this.lookAt);
  }

  /**
   * Free-form orbit around the scene by dragging the mouse.
   * @param deltaTheta horizontal orbit delta in radians
   * @param deltaPhi vertical tilt/elevation delta in radians
   */
  orbit(deltaTheta: number, deltaPhi: number): void {
    this.targetTheta += deltaTheta;
    // Clamp polar angle so camera glides seamlessly from Top View to Bottom View without flipping
    this.targetPhi = clamp(this.targetPhi + deltaPhi, 0.04, Math.PI - 0.04);
  }

  setTopView(): void {
    this.targetPhi = 0.05; // Straight down looking onto all orbits
    this.targetTheta = 0;
  }

  setBottomView(): void {
    this.targetPhi = Math.PI - 0.05; // Looking straight up from underneath
    this.targetTheta = 0;
  }

  setLeftView(): void {
    this.targetPhi = Math.PI * 0.5;
    this.targetTheta = -Math.PI * 0.5;
  }

  setRightView(): void {
    this.targetPhi = Math.PI * 0.5;
    this.targetTheta = Math.PI * 0.5;
  }

  resetView(): void {
    this.targetPhi = Math.PI * 0.40;
    this.targetTheta = 0;
    this.targetDistance = 8.2;
  }

  /** @param x normalised -1..1  @param y normalised -1..1 */
  setParallax(x: number, y: number): void {
    this.parallaxX = clamp(x, -1, 1);
    this.parallaxY = clamp(y, -1, 1);
  }

  setDistance(distance: number): void {
    this.targetDistance = clamp(distance, 2.5, 24);
  }

  nudgeDistance(delta: number): void {
    this.setDistance(this.targetDistance + delta);
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  private updatePosition(): void {
    const sinPhi = Math.sin(this.phi);
    const cosPhi = Math.cos(this.phi);
    const sinTheta = Math.sin(this.theta);
    const cosTheta = Math.cos(this.theta);

    this.current.set(
      this.distance * sinPhi * sinTheta,
      this.distance * cosPhi,
      this.distance * sinPhi * cosTheta,
    );

    // Prevent gimbal lock when viewing directly from top or bottom
    if (Math.abs(cosPhi) > 0.96) {
      this.camera.up.set(0, 0, cosPhi > 0 ? -1 : 1);
    } else {
      this.camera.up.set(0, 1, 0);
    }

    this.camera.position.copy(this.current);
    this.camera.lookAt(this.lookAt);
  }

  update(dt: number): void {
    this.breathPhase += dt;

    // Smooth spherical dampening
    this.theta = damp(this.theta, this.targetTheta, 10.0, dt);
    this.phi = damp(this.phi, this.targetPhi, 10.0, dt);
    this.distance = damp(this.distance, this.targetDistance, 7.0, dt);

    const amount = this.reducedMotion ? 0 : SCENE.parallax * 0.25;
    const driftX = this.reducedMotion ? 0 : Math.sin(this.breathPhase * 0.17) * 0.03;
    const driftY = this.reducedMotion ? 0 : Math.sin(this.breathPhase * 0.23 + 1.7) * 0.02;

    const effectiveTheta = this.theta + this.parallaxX * amount + driftX;
    const effectivePhi = clamp(this.phi + this.parallaxY * amount + driftY, 0.04, Math.PI - 0.04);

    const sinPhi = Math.sin(effectivePhi);
    const cosPhi = Math.cos(effectivePhi);
    const sinTheta = Math.sin(effectiveTheta);
    const cosTheta = Math.cos(effectiveTheta);

    this.current.set(
      this.distance * sinPhi * sinTheta,
      this.distance * cosPhi,
      this.distance * sinPhi * cosTheta,
    );

    if (Math.abs(cosPhi) > 0.96) {
      this.camera.up.set(0, 0, cosPhi > 0 ? -1 : 1);
    } else {
      this.camera.up.set(0, 1, 0);
    }

    this.camera.position.copy(this.current);
    this.camera.lookAt(this.lookAt);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    const portrait = height > width;
    this.camera.fov = portrait ? SCENE.fov * 1.35 : SCENE.fov;
    this.camera.updateProjectionMatrix();
  }

  get currentDistance(): number {
    return this.distance;
  }
}
