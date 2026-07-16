/* ── ORAE hero fan carousel ───────────────────────────────────
   Renders the real ORAE fans (Draco-compressed GLBs converted
   from the supplier CAD files) in the hero and cycles through
   them automatically. A procedural fan is shown instantly as
   placeholder and stays as fallback when a model fails to load.
   The blade rotation speeds up with scroll velocity; an orbiting
   warm light adds moving highlights. No pointer interaction. */

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const FAN_SEQUENCE = [
  "classic-white",
  "classic-rounded-white",
  "natural-wood-light",
  "natural-brown-wood-light",
];
const FAN_MODELS = {
  "classic-white": "assets/models/fans/fan-2149.glb",
  "classic-rounded-white": "assets/models/fans/fan-2369.glb",
  "natural-wood-light": "assets/models/fans/fan-132L.glb",
  "natural-brown-wood-light": "assets/models/fans/fan-3372B.glb",
};
const MODEL_LABEL_KEYS = {
  "classic-white": "products.fan1.name",
  "classic-rounded-white": "products.fan2.name",
  "natural-wood-light": "products.fan3.name",
  "natural-brown-wood-light": "products.fan4.name",
};
const CYCLE_SECONDS = 7;
const FAN_DIAMETER = 4.6; // scene units
const BLADE_PLANE_Y = 0.53; // vertical anchor shared by all models

/* ── Procedural placeholder fan ── */

function createBladeGeometry() {
  const length = 2.05;
  const tipRadius = 0.21;
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.13);
  shape.bezierCurveTo(0.7, -0.2, 1.4, -0.225, length - tipRadius, -tipRadius);
  shape.absarc(length - tipRadius, 0, tipRadius, -Math.PI / 2, Math.PI / 2, false);
  shape.bezierCurveTo(1.4, 0.225, 0.7, 0.2, 0, 0.13);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.014,
    bevelSegments: 3,
    curveSegments: 32,
  });
  geometry.center();
  return geometry;
}

function createMotorGeometry() {
  const profile = [
    [0.0, -0.3], [0.15, -0.295], [0.26, -0.27], [0.36, -0.215],
    [0.415, -0.115], [0.43, 0.0], [0.415, 0.105], [0.355, 0.19],
    [0.24, 0.24], [0.1, 0.255], [0.0, 0.255],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(profile, 72);
}

function buildProceduralFan() {
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x7d5233,
    roughness: 0.48,
    metalness: 0.06,
  });
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0xcdb28c,
    roughness: 0.28,
    metalness: 0.92,
  });
  const darkMetalMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4038,
    roughness: 0.4,
    metalness: 0.75,
  });

  const node = new THREE.Group();

  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4, 24), darkMetalMaterial);
  rod.position.y = 0.24 + 2;
  node.add(rod);

  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), metalMaterial);
  joint.position.y = 0.28;
  node.add(joint);

  const motor = new THREE.Mesh(createMotorGeometry(), metalMaterial);
  node.add(motor);

  const led = new THREE.Mesh(
    new THREE.TorusGeometry(0.27, 0.02, 16, 72),
    new THREE.MeshBasicMaterial({ color: 0xffd9a8, toneMapped: false })
  );
  led.rotation.x = Math.PI / 2;
  led.position.y = -0.28;
  node.add(led);

  const ledDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.24, 48),
    new THREE.MeshBasicMaterial({ color: 0xffe9cc, toneMapped: false })
  );
  ledDisc.rotation.x = Math.PI / 2;
  ledDisc.position.y = -0.301;
  node.add(ledDisc);

  const blades = new THREE.Group();
  const bladeGeometry = createBladeGeometry();
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Group();
    arm.rotation.y = (i * Math.PI * 2) / 3;

    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.035, 0.12),
      darkMetalMaterial
    );
    bracket.position.set(0.4, -0.1, 0);
    arm.add(bracket);

    const pitch = new THREE.Group();
    pitch.position.set(1.42, -0.13, 0);
    pitch.rotation.x = 0.16;

    const blade = new THREE.Mesh(bladeGeometry, woodMaterial);
    blade.rotation.x = -Math.PI / 2;
    pitch.add(blade);
    arm.add(pitch);
    blades.add(arm);
  }
  blades.position.y = -0.02;
  node.add(blades);

  return { node, blades };
}

/* ── Real model loading ── */

let gltfLoader = null;
function getLoader() {
  if (!gltfLoader) {
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/libs/draco/gltf/");
    gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(draco);
  }
  return gltfLoader;
}

const modelCache = new Map();
function loadFanModel(id) {
  if (!modelCache.has(id)) {
    modelCache.set(id, getLoader().loadAsync(FAN_MODELS[id]).then((gltf) => {
      const node = gltf.scene;

      // The GLB origin is the motor axis (set during CAD conversion),
      // so only normalize the size — recentering on the bounding box
      // would shift the spin axis off-screen-center.
      const box = new THREE.Box3().setFromObject(node);
      const size = box.getSize(new THREE.Vector3());
      const scale = FAN_DIAMETER / Math.max(size.x, size.z);
      node.scale.setScalar(scale);

      // Anchor the blade plane so every model hangs at the same height.
      const blades = node.getObjectByName("blades");
      const anchor = blades || node;
      const anchorBox = new THREE.Box3().setFromObject(anchor);
      const anchorY = (anchorBox.min.y + anchorBox.max.y) / 2;
      node.position.y = BLADE_PLANE_Y - anchorY;

      return { node, blades, materials: collectMaterials(node) };
    }));
  }
  return modelCache.get(id);
}

function collectMaterials(node) {
  const set = new Set();
  node.traverse((child) => {
    if (child.isMesh && child.material) set.add(child.material);
  });
  return [...set];
}

function setEntryOpacity(entry, opacity) {
  entry.materials.forEach((material) => {
    material.transparent = true;
    material.opacity = opacity;
  });
}

function resetEntryOpacity(entry) {
  entry.materials.forEach((material) => {
    material.transparent = false;
    material.opacity = 1;
  });
}

function labelFor(id) {
  const key = MODEL_LABEL_KEYS[id];
  return (window.OraeI18n && key && window.OraeI18n.t(key)) || id;
}

/* ── Mount ── */

function mountFan(container) {
  const canvas = container.querySelector(".fan-3d__canvas");
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(30, 1.5, 0.1, 60);
  camera.position.set(0, -0.35, 7.4);
  const lookTarget = new THREE.Vector3(0, 0.45, 0);
  camera.lookAt(lookTarget);

  scene.add(new THREE.HemisphereLight(0xffe9cf, 0x1c150e, 0.55));

  const keyLight = new THREE.DirectionalLight(0xffe3bf, 1.6);
  keyLight.position.set(3.5, 4.5, 6);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xffe9d2, 0.95);
  rimLight.position.set(-5, 2.5, -4);
  scene.add(rimLight);

  // Orbiting warm accent: moving highlights across blades and metal.
  const accentLight = new THREE.SpotLight(0xffd9a4, 90, 26, 0.55, 0.85, 1.6);
  accentLight.position.set(5, 3, 3);
  scene.add(accentLight);
  const accentTarget = new THREE.Object3D();
  accentTarget.position.set(0, 0.5, 0);
  scene.add(accentTarget);
  accentLight.target = accentTarget;

  const stage = new THREE.Group();
  stage.position.y = 0.55;
  scene.add(stage);

  // The procedural fan stays hidden behind the canvas fade: it is only the
  // fallback shown when the real models cannot load.
  const procedural = buildProceduralFan();
  procedural.materials = collectMaterials(procedural.node);
  let current = procedural;
  stage.add(current.node);

  function reveal() {
    container.classList.add("fan-3d--ready");
  }

  const numEl = document.querySelector("[data-fan-num]");
  const labelEl = document.querySelector("[data-fan-label]");
  let activeId = null;

  function syncLabel() {
    if (!activeId) return;
    if (numEl) numEl.textContent = String(FAN_SEQUENCE.indexOf(activeId) + 1).padStart(2, "0");
    if (labelEl) labelEl.textContent = labelFor(activeId);
  }
  document.addEventListener("orae:languagechange", syncLabel);

  function renderOnce() {
    renderer.render(scene, camera);
  }

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (reduceMotion) renderOnce();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  /* ── Model switching ── */
  const transition = { phase: "idle", t: 0, incoming: null };

  function applyIncoming(entry) {
    stage.remove(current.node);
    current = entry;
    stage.add(current.node);
  }

  async function showModel(id, { animate = true } = {}) {
    try {
      const entry = await loadFanModel(id);
      if (activeId === id) return;
      const isFirst = !activeId;
      activeId = id;
      syncLabel();
      if (reduceMotion || !animate || isFirst) {
        // First real model appears through the canvas CSS fade-in.
        applyIncoming(entry);
        reveal();
        if (reduceMotion) renderOnce();
        return;
      }
      transition.phase = "out";
      transition.t = 0;
      transition.incoming = entry;
    } catch (error) {
      console.error("Unable to load ORAE fan model", id, error);
      // No real model available: reveal the procedural fallback.
      if (!activeId) reveal();
    }
  }

  if (reduceMotion) {
    current.blades.rotation.y = 0.5;
    renderOnce();
    showModel(FAN_SEQUENCE[0], { animate: false });
    return;
  }

  let cycleClock = 0;
  showModel(FAN_SEQUENCE[0]);

  function nextModel() {
    if (!activeId) return;
    const index = FAN_SEQUENCE.indexOf(activeId);
    showModel(FAN_SEQUENCE[(index + 1) % FAN_SEQUENCE.length]);
  }

  /* ── Animation loop ── */
  let spin = 0;
  let boost = 0;
  let lastScrollY = window.scrollY;
  let lastTime = performance.now();

  let inView = true;
  const io = new IntersectionObserver((entries) => {
    inView = entries[entries.length - 1]?.isIntersecting ?? true;
  }, { rootMargin: "80px" });
  io.observe(container);

  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  let frameId = 0;
  function render(now) {
    frameId = requestAnimationFrame(render);
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (!inView || dt <= 0) return;

    const scrollY = window.scrollY;
    const velocity = Math.abs(scrollY - lastScrollY) / Math.max(dt, 0.001);
    lastScrollY = scrollY;
    const boostTarget = Math.min(velocity * 0.004, 7);
    boost += (boostTarget - boost) * 0.055;

    spin += (1.15 + boost) * dt;
    if (current.blades) current.blades.rotation.y = spin;

    // Auto-cycle through the four fans.
    if (activeId && transition.phase === "idle") {
      cycleClock += dt;
      if (cycleClock >= CYCLE_SECONDS) {
        cycleClock = 0;
        nextModel();
      }
    }

    // Swap transition: crossfade — fade the current fan out, then the next in.
    if (transition.phase === "out") {
      transition.t = Math.min(1, transition.t + dt / 0.35);
      setEntryOpacity(current, 1 - easeInOut(transition.t));
      if (transition.t >= 1) {
        resetEntryOpacity(current);
        setEntryOpacity(transition.incoming, 0);
        applyIncoming(transition.incoming);
        transition.incoming = null;
        transition.phase = "in";
        transition.t = 0;
      }
    } else if (transition.phase === "in") {
      transition.t = Math.min(1, transition.t + dt / 0.45);
      setEntryOpacity(current, easeInOut(transition.t));
      if (transition.t >= 1) {
        resetEntryOpacity(current);
        transition.phase = "idle";
        // Warm the cache so the next swap starts without waiting.
        const index = FAN_SEQUENCE.indexOf(activeId);
        loadFanModel(FAN_SEQUENCE[(index + 1) % FAN_SEQUENCE.length]).catch(() => {});
      }
    }

    // Gentle time-based sway only — no pointer influence.
    const t = now / 1000;
    stage.rotation.z = Math.sin(t * 0.4) * 0.01;
    stage.rotation.x = Math.sin(t * 0.28) * 0.007;

    // Slow light orbit for living highlights.
    accentLight.position.set(Math.cos(t * 0.22) * 5.5, 2.6 + Math.sin(t * 0.13) * 1.2, Math.sin(t * 0.22) * 5.5);

    renderer.render(scene, camera);
  }
  frameId = requestAnimationFrame(render);

  window.addEventListener("pagehide", (event) => {
    if (event.persisted) return; // page may come back from the bfcache
    cancelAnimationFrame(frameId);
    observer.disconnect();
    io.disconnect();
    pmrem.dispose();
    renderer.dispose();
  });
}

document.querySelectorAll("[data-fan-3d]").forEach((container) => {
  try {
    mountFan(container);
  } catch (error) {
    console.error("Unable to render ORAE fan model", error);
    container.classList.add("fan-3d--error");
  }
});
