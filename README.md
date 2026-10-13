# Brahmastra AI — Neural Intelligence Core & Real-Life Gesture Suite

A browser-based, high-performance holographic AI platform combining **20,000 GPU-driven particles**, a **9-Planet Celestial Orbital Simulation**, real-time hand gesture control via webcam, and **4 real-life application modes** — all running locally in a browser with zero backend.

Three.js + WebGL + GLSL for GPU rendering; MediaPipe Hand Landmarker for AI hand tracking. No backend, no frameworks, no camera data ever leaves your device.

---

## 🌟 Key Features

* **🧠 20,000 Particle Neural Core**: GPU vertex shaders compute breathing noise, mode morphing, attraction, contraction, and energy wave shockwaves.
* **🪐 9-Planet Celestial Orbital Simulation**: Realistic Keplerian orbits and continuous axial rotation for all 9 planets (**Mercury, Venus, Earth with Moon, Mars, Jupiter, Saturn with rings, Uranus, Neptune, Pluto**).
* **🔄 360° Omnidirectional Orbit Camera**: Drag your mouse to smoothly inspect the entire system from any angle.
* **⚡ Electric Blue & Cyber Block Theme**: Aerospace telemetry visual language with glowing cyan accents, deep obsidian backdrops, and Orbitron typography.
* **⏱️ Real-Time Palm Chrono Telemetry**: Live system timestamp, hand opening detection, open-duration stopwatch, and palm extension meters.
* **🔒 100% Client-Side Privacy**: All camera vision inference runs inside a local Web Worker. Frames never leave your device.

---

## 🩺 Real-Life Application Modes

Brahmastra AI ships with **4 practical real-life modes**, accessible via the bottom dock or `M` key:

### 🏥 Mode 1 — Hand Rehabilitation Tracker
> *For stroke, arthritis, and post-surgery recovery patients.*

Uses MediaPipe's 21 hand landmarks to measure:
- **Per-finger extension** (5 live bars, 0–100%) — track which fingers are recovering
- **Palm openness ring** — measure overall grip recovery progress
- **Wrist rotation dial** — live angle in degrees, track rotation range
- **Automatic rep counting** — FIST→OPEN_PALM counts as 1 grip rep automatically
- **4 exercises**: Grip Strength, Index Isolation, Wrist Rotation, Finger Spread
- **Session timer** + daily progress chart persisted in localStorage

**Impact**: Stroke and arthritis patients can do guided exercises at home with real-time feedback. Zero hardware. Just a laptop webcam.

---

### 🏭 Mode 2 — Touchless Control Panel
> *For hospitals, cleanrooms, food factories — anywhere gloves prevent screen touch.*

- 6 configurable **virtual holographic buttons** (Power, Lights, Alert, Confirm, Camera, Lock)
- **POINT** gesture moves a glowing finger cursor to hover over buttons
- **PINCH** gesture activates the hovered button — no touch needed
- **FIST** triggers emergency hold state
- Real-time **event log** with timestamps
- Hover glow and activation flash animations

**Impact**: Replaces expensive touchless-display solutions ($400+ Leap Motion devices). Works in any browser.

---

### 🤟 Mode 3 — Sign Language Starter Kit
> *For deaf and hearing-impaired communities — accessibility in the browser.*

- **A–Z ASL finger spelling recognition** using 21-landmark extension patterns
- **Live letter detection** with confidence percentage
- **Hold-to-lock**: hold a gesture steady for 0.8s → letter locks into word
- **Word Builder**: spell full words letter by letter
- **Text-to-speech**: browser's Web Speech API speaks the completed word
- **Practice Mode**: system shows a target letter, you form it, score is tracked
- **ASL reference chart** — all 23 letters shown with descriptions

**Impact**: Helps hearing-impaired people practice sign language. Free. No installation. Works offline after first load.

---

### 🎤 Mode 4 — Presentation Controller
> *For teachers, professors, and presenters — no clicker needed.*

- **SWIPE RIGHT** → next slide (sends ArrowRight key)
- **SWIPE LEFT** → previous slide (sends ArrowLeft key)
- **POINT** gesture → red laser pointer on screen (follows index fingertip)
- **FIST** → pause / black slide mode
- **OPEN PALM** → resume presentation
- Slide counter with progress bar
- Action log with timestamps
- Works with **Google Slides, PowerPoint Online, Canva, Keynote Web**

**Impact**: Any teacher can walk away from their laptop and control slides with a hand gesture. No hardware needed.

---

## Quick Start

```bash
npm install
npm run dev          # http://127.0.0.1:5173
```

Open the URL in your browser. The **bottom dock** shows all modes:
- `🪐 BRAHMASTRA AI` — Home (neural core + planetary system)
- `🏥 REHAB TRACKER` — Hand rehabilitation exercises
- `🏭 CONTROL PANEL` — Touchless holographic buttons
- `🤟 SIGN LANGUAGE` — ASL finger spelling
- `🎤 PRESENTATION` — Gesture slide control

Press **CAMERA** (or `G`) to activate webcam hand tracking.

```bash
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + production bundle into dist/
npm run preview      # preview the production build locally
```

> [!NOTE]
> If serving `dist/` over a local network or public server, it must be hosted over **HTTPS** — modern browsers refuse `getUserMedia` access on insecure HTTP origins.

---

## Controls

### 🖐️ Hand Gestures (Webcam Mode)

| Gesture | Action |
| :--- | :--- |
| **Open Palm** (5 fingers) | Core active — network illuminates, energy pulse fires |
| **Pinch** (thumb + index) | Select / activate (Control Panel: activate button) |
| **Fist** | Power Mode — pause in Presentation / emergency hold in Panel |
| **Point** (index only) | Cursor / laser pointer |
| **Swipe** (fast horizontal) | Next/prev slide (Presentation) or cycle orb mode (Home) |
| **2 / 3 / 4 fingers** | Navigation / System analysis / Data visualisation modes |

### ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `M` | Cycle through all 5 modes |
| `Esc` | Return to Home mode / dismiss dialog |
| `1`–`5` | Switch orb configuration (Neural, Reactor, Data, Energy, Scanner) |
| `Space` | Fire energy pulse & celestial shockwave |
| `T` | Snap to **Top View** |
| `B` | Snap to **Bottom View** |
| `L` / `K` | Snap to **Left / Right View** |
| `P` | Toggle 9-Planet Celestial System |
| `R` | Reset camera, orientation, and mode |
| `G` | Toggle webcam gesture mode |
| `D` | Toggle debug telemetry overlay |
| `H` | Hide / show interface HUD |

---

## System Architecture

### 1. Real-Life Modes Engine (`src/modes/`)
```
ModeManager.ts        — State machine: HOME | REHAB | PANEL | SIGN | SLIDES
ModeSwitcher.ts       — Bottom dock tab bar (5 glowing tabs)
RehabMode.ts          — Finger bars, palm ring, wrist dial, rep counter
ControlPanelMode.ts   — Virtual buttons, finger cursor, pinch-activate
SignLanguageMode.ts   — ASL recognition, word builder, text-to-speech
PresentationMode.ts   — Slide control, laser pointer, swipe navigation
```

### 2. Hand Tracking Engine (`src/vision/`)
```
Webcam Frame → ImageBitmap → Web Worker → MediaPipe HandLandmarker
             → LandmarkSmoother → GestureEngine → InputAdapter → Modes
```
- Tracks **21 landmarks** per hand with 3D world coordinates
- Computes per-finger extension (0–1), palmOpenness, palmRoll, palmNormal, velocity
- Runs at ~30 Hz in a Web Worker — never stalls the 60+ FPS render loop

### 3. Planetary Celestial Mechanics (`src/effects/PlanetarySystem.ts`)
- 9 Keplerian orbits with scaled velocities
- Procedural surface textures generated on HTML5 canvas at startup
- Resonance reaction: power pulses flare orbit lines and atmospheric rims

### 4. GPU Vertex-Shader Motion (`src/shaders/`)
- Core + synapse network execute within 5 total draw calls
- All morphing, noise, and contraction run inside GLSL shaders on the GPU

---

## Project Layout

```
src/
  main.ts                  Application wiring, loop, mode integration
  config.ts                Tunable parameters, colors, camera distances
  modes/
    ModeManager.ts         Mode state machine (HOME/REHAB/PANEL/SIGN/SLIDES)
    ModeSwitcher.ts        Bottom dock tab bar component
    RehabMode.ts           Hand rehabilitation tracker
    ControlPanelMode.ts    Touchless holographic control panel
    SignLanguageMode.ts    ASL sign language recognition kit
    PresentationMode.ts    Gesture-controlled presentation controller
  scene/
    CameraRig.ts           360° omnidirectional orbital camera rig
    SceneManager.ts        Scene graph, lights, starfield
    PostProcessing.ts      Bloom and post-processing pipeline
  orb/
    NeuralOrb.ts           Core particle cloud and synapse network
    OrbModes.ts            5 morphing particle geometries
  effects/
    PlanetarySystem.ts     9-Planet celestial orbital simulation
    OrbitalNodes.ts        Interactive holographic node telemetry
    ParticleBurst.ts       Shockwave particle explosions
  vision/
    HandTracker.ts         Camera stream and Web Worker coordinator
    GestureEngine.ts       21-landmark geometric gesture classification
    LandmarkSmoother.ts    One Euro Filter for low-jitter tracking
  interaction/
    InputAdapter.ts        Converts tracked hands to InputHand interface
    GestureStateMachine.ts Stable system-level gesture state machine
    MouseFallback.ts       Mouse/touch orbital navigation fallback
  ui/
    HUD.ts                 Left/right telemetry panels & Palm Chrono
    SystemStatus.ts        Top identity block & real-time clock
    styles.css             Electric Blue & Cyber Block styling + mode CSS
```

---

## Author

Developed & Maintained by **Sainath**.

GitHub: [sainathgoud1229/Brahmastra-AI](https://github.com/sainathgoud1229/Brahmastra-AI)

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
