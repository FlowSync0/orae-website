/* ── ORAE hero fan ─────────────────────────────────────────────
   Renders the Natural Brown Wood fan (Draco-compressed GLB
   converted from the supplier CAD file) in the hero, gently
   tilted toward the viewer so the blade faces and the LED disc
   are visible instead of the edge. The blade rotation speeds up
   with scroll velocity; an orbiting warm light adds moving
   highlights. A procedural fan is the fallback if loading fails. */

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const FAN_MODEL_URL = "assets/models/fans/fan-3372B.glb?v=2";
const FAN_DIAMETER = 4.6; // scene units
const FAN_TILT = -0.3; // rad — near edge up: shows the underside and the LED

// Vertical anchor (stage-local) for the blade plane. Lower on desktop so the
// fan sits mid-viewport; slightly higher on mobile to clear the copy below.
const isDesktopLayout = () => window.innerWidth >= 900;
const bladeLocalY = () => (isDesktopLayout() ? -0.55 : -0.2);

/* ── Procedural fallback fan ── */

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

  return { node, inner: node, blades, anchorY: -0.02 };
}

/* ── Real model loading ── */

function positionEntry(entry) {
  entry.inner.position.y = bladeLocalY() - entry.anchorY;
}

let modelPromise = null;
function loadFanModel() {
  if (!modelPromise) {
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/libs/draco/gltf/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    modelPromise = loader.loadAsync(FAN_MODEL_URL).then((gltf) => {
      const inner = gltf.scene;

      // The GLB origin is the motor axis (set during CAD conversion),
      // so only normalize the size — recentering on the bounding box
      // would shift the spin axis off-screen-center.
      const box = new THREE.Box3().setFromObject(inner);
      const size = box.getSize(new THREE.Vector3());
      const scale = FAN_DIAMETER / Math.max(size.x, size.z);
      inner.scale.setScalar(scale);

      const blades = inner.getObjectByName("blades");
      const anchor = blades || inner;
      const anchorBox = new THREE.Box3().setFromObject(anchor);
      const anchorY = (anchorBox.min.y + anchorBox.max.y) / 2;

      const node = new THREE.Group();
      node.add(inner);
      const entry = { node, inner, blades, anchorY };
      positionEntry(entry);
      return entry;
    });
  }
  return modelPromise;
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

  // Desktop: pull the camera back until the fan only fills ~80% of the frame
  // width, so blade tips never touch the canvas edges (which reads as a hard
  // cut mid-hero). Mobile keeps the tighter, validated framing.
  function frameCamera() {
    if (!isDesktopLayout()) {
      camera.position.z = 7.4;
    } else {
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const fitZ = (FAN_DIAMETER / 0.8) / (2 * halfH * camera.aspect);
      camera.position.z = Math.max(7.4, fitZ);
    }
    camera.lookAt(lookTarget);
  }

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
  stage.rotation.x = FAN_TILT;
  scene.add(stage);

  // Hidden fallback: only revealed if the real model cannot load.
  let current = buildProceduralFan();
  stage.add(current.node);

  function reveal() {
    container.classList.add("fan-3d--ready");
  }

  function renderOnce() {
    renderer.render(scene, camera);
  }

  let layoutMode = isDesktopLayout();
  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    frameCamera();
    if (layoutMode !== isDesktopLayout()) {
      layoutMode = isDesktopLayout();
      positionEntry(current);
    }
    if (reduceMotion) renderOnce();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  loadFanModel()
    .then((entry) => {
      stage.remove(current.node);
      current = entry;
      positionEntry(current);
      stage.add(current.node);
      reveal();
      if (reduceMotion) renderOnce();
    })
    .catch((error) => {
      console.error("Unable to load ORAE fan model", error);
      reveal();
      if (reduceMotion) renderOnce();
    });

  if (reduceMotion) {
    current.blades.rotation.y = 0.5;
    renderOnce();
    return;
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

    // Gentle time-based sway around the base tilt.
    const t = now / 1000;
    stage.rotation.z = Math.sin(t * 0.4) * 0.01;
    stage.rotation.x = FAN_TILT + Math.sin(t * 0.28) * 0.007;

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
