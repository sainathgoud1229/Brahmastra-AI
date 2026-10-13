# Brahmastra AI — Neural Intelligence Core & Celestial Simulation

A browser-based, high-performance holographic AI core built from ~20,000 GPU-driven particles and a live synapse network, integrated with a continuous **9-Planet Celestial Orbital Simulation**, controlled via real-time hand gestures through your webcam, mouse, or keyboard.

Three.js + WebGL + GLSL for GPU rendering; MediaPipe Hand Landmarker for machine learning vision tracking. No backend, no frameworks, zero latency, and no camera data ever leaves your device.

---

## 🌟 Key Features

* **🧠 20,000 Particle Neural Core**: GPU vertex shaders compute breathing noise, mode morphing, attraction, contraction, and energy wave shockwaves.
* **🪐 9-Planet Celestial Orbital Simulation**: Realistic Keplerian orbits and continuous axial rotation for all 9 planets (**Mercury, Venus, Earth with Moon, Mars, Jupiter with Great Red Spot, Saturn with holographic rings, Uranus, Neptune, Pluto**).
* **🔄 360° Omnidirectional Orbit Camera**: Drag your mouse or touch screen to smoothly inspect the entire system from **Top View, Bottom View, Left View, Right View**, or any custom angle.
* **⚡ Electric Blue & Cyber Block Theme**: Aerospace telemetry visual language featuring glowing electric cyan accents, deep obsidian backdrops, sci-fi viewport brackets, and Orbitron typography.
* **⏱️ Real-Time Clock & Palm Chrono Telemetry**: Live system timestamp (`YYYY-MM-DD HH:MM:SS.mmm`), real-time hand opening detection, open-duration stopwatch, and palm extension meters.
* **🔒 100% Client-Side Privacy**: All camera vision inference runs inside a local Web Worker. Frames are read into an `ImageBitmap` and instantly discarded.

---

## Quick Start

```bash
npm install
npm run dev          # http://127.0.0.1:5173
```

Open the URL in your browser and press **CAMERA** in the bottom-right HUD (or press <kbd>G</kbd> on your keyboard). `localhost` is treated as a secure origin, so the camera permission prompt will appear normally.

```bash
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + optimized production bundle into dist/
npm run preview      # preview the production build locally
```

> [!NOTE]
> If serving `dist/` over a local network or public server, it must be hosted over **HTTPS** — modern browsers refuse `getUserMedia` access on insecure HTTP origins.

### First-Time Model Cache

Two static assets are downloaded once and cached by your browser:
* MediaPipe Tasks Vision WASM runtime (`cdn.jsdelivr.net`)
* `hand_landmarker.task` ML model (≈7 MB from Google Cloud CDN)

---

## Controls

### 🖐️ Hand Gestures (Webcam Mode)

| Gesture | Action |
| :--- | :--- |
| **Open Palm** (5 fingers) | Core active — network illuminates, rings accelerate, energy pulse fires |
| **Pinch** (thumb + index) | Grab the orb to rotate; fires an energy filament to the core |
| **Fist** | Power Mode — cloud contracts and turns gold. Release for shockwave |
| **Two Hands** | Move apart to expand, together to compress. Left hand steers, right modulates power |
| **Point** (index only) | Holographic reticle cursor. Pinch while pointing to inspect nodes |
| **Swipe** (fast horizontal) | Cycle through orb configurations |
| **2 / 3 / 4 fingers** | Navigation / System analysis / Data visualisation modes |

### 🖱️ Mouse & Touch (Full 360° Omnidirectional Controls)

* **Drag Mouse (Left or Right Button) / Touch Drag**: Freely orbit camera 360° around all sides:
  * **Drag Up**: Glides to **Top View** (look straight down onto all 9 concentric planetary orbits).
  * **Drag Down**: Glides to **Bottom View** (look from underneath).
  * **Drag Left / Right**: 360° horizontal orbit around the celestial system.
* **Scroll Wheel / Pinch**: Zoom in close to individual planets or zoom out into deep space.
* **Move Mouse**: Steer the holographic cursor reticle.

### ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `1`–`5` | Switch configuration (*Neural, Reactor, Data, Energy, Scanner*) |
| `Space` | Fire energy pulse & celestial shockwave |
| `T` | Snap to **Top View** (straight down onto all planetary orbits) |
| `B` | Snap to **Bottom View** (looking from underneath) |
| `L` / `K` | Snap to **Left View** / **Right View** |
| `P` | Toggle **9-Planet Celestial System** on/off |
| `R` | Reset camera view, orientation, scale, and mode |
| `G` | Toggle webcam gesture mode on/off |
| `D` or `C` | Toggle debug telemetry overlay (FPS, inference, landmarks) |
| `H` | Hide / show interface HUD |
| `Esc` | Dismiss active notice / modal dialog |

---

## Real-Life Physical AI Modes

Brahmastra AI includes 4 zero-hardware, webcam-powered real-world modules accessible from the bottom dock:

### 1. 🏥 Hand Rehabilitation Tracker (`src/modes/RehabMode.ts`)
* **1-Minute Workout Drill**: Eliminates static limits; runs a dedicated 60-second challenge timer tracking real-time cadence and reps completed in 1 minute.
* **Biometric Telemetry**: Live per-finger extension bars (0%–100%), 360° palm openness gauge, and wrist rotation dial (-90° to +90°).
* **Exercises**: Grip Strength (Fist to Open Palm), Index Isolation, Wrist Rotation, and Finger Spread. Records Personal Best Reps/Min.

### 2. 🎛️ Touchless Machine Control Console (`src/modes/ControlPanelMode.ts`)
* **Analog Touchless Sliders**: Point or pinch in mid-air over slider tracks to adjust **Master Audio Volume** (0%–100%), **Display & HUD Brightness** (50%–150%), **Celestial Orbit Speed** (0.0x freeze to 5.0x hyperwarp), and **3D Camera Distance**.
* **Tactile Air Switches**: Pinch in mid-air to toggle **Fullscreen Mode** (`requestFullscreen`), **Audio Synthesizer**, **9 Planetary Orbits**, **Top-Down Celestial View**, and **High Contrast**.
* **Live System Telemetry**: Real-time FPS, input modality, and audio bus telemetry.

### 3. 📓 Touchless Air-Notebook & Speech Voice (`src/modes/SignLanguageMode.ts`)
* **Ruled Notebook Aesthetic**: Classical ruled notebook paper with horizontal blue lines, vertical red margin, and mid-air ink drawing.
* **Sensorless Air-Writing**: Point index finger or pinch in mid-air to write words, letters, and cursive freely using webcam tracking.
* **Practice Mode with Guidelines**: Full word practice with dashed tracing guidelines (`HELLO`, `BRAHMASTRA`, `WELCOME`, `THANK YOU`, `PHYSICAL AI`).
* **🔊 Loud Speech Pronunciation**: Touch or click the **PRONOUNCE** button to trigger the browser's Web Speech Synthesis API (`SpeechSynthesisUtterance`), loudly speaking what was written in the notebook.

### 4. 🎤 Stage Keynote Presentation Controller (`src/modes/PresentationMode.ts`)
* **Full Interactive Slide Deck**: 5 keynote presentation slides detailing Brahmastra AI's vision, neural architecture, and zero-hardware advantage.
* **🔴 Air Laser Pointer**: Live glowing red laser dot that tracks the presenter's pointing finger with particle beam flare.
* **🔦 Stage Spotlight Mode**: Darkens surrounding slide content into a soft vignette, casting a focused theatrical spotlight on the bullet point or diagram pointed to.
* **👋 Air Swipe & Blackout**: Swipe hand right/left to navigate slides. Clench fist to toggle **Stage Blackout Screen** to bring audience focus back to the speaker.
* **⏱️ Meeting Timer & Teleprompter**: Live presenter elapsed talk timer with pacing indicators and floating speaker notes drawer.

---

## System Architecture

### 1. Planetary Celestial Mechanics (`src/effects/PlanetarySystem.ts`)
* **9 Concentric Keplerian Orbits**: Scaled orbital velocities where inner terrestrial planets revolve faster and outer gas giants orbit majestically.
* **Continuous Axial Rotation**: Planets spin continuously on their own tilted rotation axes (Earth at 23.5° / 0.41 rad, Uranus tipped on its side at ~98°).
* **Procedural Surface Textures**: Generated at startup on dynamic HTML5 canvases (Earth's oceans and continents, Jupiter's storm bands and Great Red Spot, Mars' basalt and polar ice, Saturn's rings with Cassini division).
* **Resonance Reaction**: When a power pulse fires, planetary orbit lines and atmospheric rims flare with cosmic energy.

### 2. 360° Omnidirectional Camera Rig (`src/scene/CameraRig.ts`)
* **Spherical Coordinate Navigation**: Uses `(phi, theta, distance)` to guarantee smooth, continuous camera rotation from top pole to bottom pole without gimbal lock.
* **Cinematic Damping & Drift**: Subtle figure-eight camera breathing when idle, damping mouse input for smooth aerospace camera tracking.

### 3. GPU Vertex-Shader Motion (`src/shaders/common.glsl`)
* The core and synapse network execute within 5 total draw calls on the GPU.
* The CPU never loops over individual particles per frame; all morphing, noise, and contraction run entirely inside GLSL shaders.

### 4. Vision Web Worker Pipeline (`src/vision/`)
```
Webcam Frame → ImageBitmap → Web Worker → MediaPipe HandLandmarker
             → One Euro Filter → GestureEngine → HandInteraction
```
* Runs in a dedicated Web Worker at ~30 Hz so computer vision inference never stalls the 60+ FPS Three.js render loop.

---

## Project Layout

```
src/
  main.ts                  Application wiring, loop, and mouse orbit controls
  config.ts                Tunable parameters, colors, and camera distances
  scene/
    CameraRig.ts           360° omnidirectional orbital camera rig
    SceneManager.ts        Scene graph, ambient & rim lights, starfield
    Background.ts          Procedural background starfield and haze
    PostProcessing.ts      Bloom and post-processing pipeline
  orb/
    NeuralOrb.ts           Core particle cloud and synapse network
    EnergyCore.ts          Inner glowing nuclear core
    OrbitalRings.ts        Concentric aerospace rings
    OrbModes.ts            5 morphing particle geometries
  effects/
    PlanetarySystem.ts     9-Planet celestial orbital simulation & textures
    OrbitalNodes.ts        Interactive holographic node telemetry
    ParticleBurst.ts       Shockwave particle explosions
    HolographicBeam.ts     Energy filaments connecting hands to core
    Reticle.ts             Futuristic HUD cursor reticle
  vision/
    HandTracker.ts         Camera stream and Web Worker coordinator
    GestureEngine.ts       21-landmark geometric gesture classification
    OneEuroFilter.ts       Low-jitter, low-latency landmark filtering
  ui/
    HUD.ts                 Left/right telemetry panels & Palm Chrono block
    SystemStatus.ts        Top identity block & real-time clock
    styles.css             Electric Blue & Cyber Block styling
```

---

## Author

Developed & Maintained by **Sainath**.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
