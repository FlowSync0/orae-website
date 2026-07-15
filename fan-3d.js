/* ── ORAE hero fan ─────────────────────────────────────────────
   Procedural 3D ceiling fan rendered with Three.js. The blade
   rotation speeds up with scroll velocity and the camera drifts
   with the pointer. Falls back to the static hero if WebGL is
   unavailable (the container keeps its atmospheric background). */

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

function buildFan() {
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

  const fanRoot = new THREE.Group();

  // Downrod reaching past the top of the canvas — the viewport edge is the "ceiling".
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4, 24), darkMetalMaterial);
  rod.position.y = 0.24 + 2;
  fanRoot.add(rod);

  const joint = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), metalMaterial);
  joint.position.y = 0.28;
  fanRoot.add(joint);

  const motor = new THREE.Mesh(createMotorGeometry(), metalMaterial);
  fanRoot.add(motor);

  // Warm LED ring under the motor.
  const led = new THREE.Mesh(
    new THREE.TorusGeometry(0.27, 0.02, 16, 72),
    new THREE.MeshBasicMaterial({ color: 0xffd9a8, toneMapped: false })
  );
  led.rotation.x = Math.PI / 2;
  led.position.y = -0.28;
  fanRoot.add(led);

  const ledDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.24, 48),
    new THREE.MeshBasicMaterial({ color: 0xffe9cc, toneMapped: false })
  );
  ledDisc.rotation.x = Math.PI / 2;
  ledDisc.position.y = -0.301;
  fanRoot.add(ledDisc);

  const ledLight = new THREE.PointLight(0xffd2a0, 14, 9, 2);
  ledLight.position.set(0, -0.75, 0.4);
  fanRoot.add(ledLight);

  // Three blades, pitched around their long axis for realism.
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
  fanRoot.add(blades);

  return { fanRoot, blades };
}

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
  renderer.toneMappingExposure = 1.02;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  const camera = new THREE.PerspectiveCamera(30, 1.5, 0.1, 60);
  const cameraBase = new THREE.Vector3(0, -0.35, 7.4);
  const lookTarget = new THREE.Vector3(0, 0.45, 0);
  camera.position.copy(cameraBase);
  camera.lookAt(lookTarget);

  scene.add(new THREE.HemisphereLight(0xffe9cf, 0x201a12, 0.55));

  const keyLight = new THREE.DirectionalLight(0xffe3bf, 1.35);
  keyLight.position.set(3.5, 4.5, 6);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xfff4e6, 0.5);
  rimLight.position.set(-4.5, 1.5, -3);
  scene.add(rimLight);

  const { fanRoot, blades } = buildFan();
  fanRoot.position.y = 0.55;
  scene.add(fanRoot);

  container.classList.add("fan-3d--ready");

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (reduceMotion) renderer.render(scene, camera);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  if (reduceMotion) {
    blades.rotation.y = 0.5;
    renderer.render(scene, camera);
    return;
  }

  // Blade speed follows scroll velocity; pointer drifts the camera.
  let spin = 0;
  let boost = 0;
  let lastScrollY = window.scrollY;
  let lastTime = performance.now();
  const pointer = { x: 0, y: 0 };

  window.addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

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
    blades.rotation.y = spin;

    const t = now / 1000;
    fanRoot.rotation.z = Math.sin(t * 0.5) * 0.012 - pointer.x * 0.02;
    fanRoot.rotation.x = Math.sin(t * 0.35) * 0.008 + pointer.y * 0.015;

    camera.position.x += (cameraBase.x + pointer.x * 0.45 - camera.position.x) * 0.045;
    camera.position.y += (cameraBase.y - pointer.y * 0.2 - camera.position.y) * 0.045;
    camera.lookAt(lookTarget);

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
