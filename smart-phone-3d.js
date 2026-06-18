import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MODEL_FRONT_Z = 0.392;
const MODEL_CENTER_Z = -0.1735;
const SCREEN_WIDTH = 6.32;
const SCREEN_HEIGHT = 13.62;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function createScreenTexture(src) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1940;

  const ctx = canvas.getContext("2d");
  const fanImage = await loadImage(src).catch(() => null);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  roundedRect(ctx, 36, 28, 828, 1884, 98);
  ctx.fillStyle = "#f7f5f1";
  ctx.fill();

  const gradient = ctx.createLinearGradient(0, 28, 0, 1912);
  gradient.addColorStop(0, "rgba(255,255,255,0.94)");
  gradient.addColorStop(0.62, "rgba(246,244,240,0.98)");
  gradient.addColorStop(1, "rgba(239,235,229,0.98)");
  roundedRect(ctx, 36, 28, 828, 1884, 98);
  ctx.fillStyle = gradient;
  ctx.fill();

  roundedRect(ctx, 365, 70, 170, 18, 9);
  ctx.fillStyle = "#1f1f1f";
  ctx.fill();

  ctx.fillStyle = "#77736d";
  ctx.font = "600 27px Inter, Arial, sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("ORAE", 104, 180);
  ctx.fillText("TUYA", 716, 180);

  roundedRect(ctx, 100, 250, 700, 620, 64);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  if (fanImage) {
    const imageSize = 610;
    ctx.save();
    roundedRect(ctx, 136, 285, 628, 548, 48);
    ctx.clip();
    ctx.drawImage(fanImage, 145, 245, imageSize, imageSize);
    ctx.restore();
  }

  ctx.fillStyle = "#706b64";
  ctx.font = "500 25px Inter, Arial, sans-serif";
  ctx.fillText("Natural Wood", 104, 965);
  ctx.fillStyle = "#1f1f1f";
  ctx.font = "700 27px Inter, Arial, sans-serif";
  ctx.fillText("Ventilation active", 520, 965);

  ctx.save();
  ctx.translate(450, 1238);
  ctx.lineWidth = 34;
  ctx.strokeStyle = "#ede2d4";
  ctx.beginPath();
  ctx.arc(0, 0, 132, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#c9935e";
  ctx.beginPath();
  ctx.arc(0, 0, 132, -Math.PI / 2, Math.PI * 0.22);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, 94, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1f1f1f";
  ctx.font = "400 74px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("3", 0, 6);
  ctx.restore();

  const controls = [
    ["Light", 108],
    ["Timer", 345],
    ["Reverse", 582],
  ];
  controls.forEach(([label, x]) => {
    roundedRect(ctx, x, 1644, 208, 126, 30);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.fillStyle = "#8a857e";
    ctx.font = "600 25px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + 104, 1707);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function tuneModelMaterials(model) {
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;

    if (child.material) {
      child.material = child.material.clone();
      child.material.envMapIntensity = 0.65;
      if (child.material.metalness !== undefined) {
        child.material.metalness = Math.min(0.85, child.material.metalness + 0.08);
      }
      if (child.material.roughness !== undefined) {
        child.material.roughness = Math.max(0.22, child.material.roughness);
      }
    }
  });
}

async function mountPhone(container) {
  const canvas = container.querySelector(".phone-model__canvas");
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 22);

  const phoneRoot = new THREE.Group();
  phoneRoot.rotation.set(-0.06, -0.36, -0.02);
  phoneRoot.position.set(0.12, -0.08, 0);
  scene.add(phoneRoot);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xddd6cc, 2.2));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
  keyLight.position.set(3.5, 6, 8);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.35);
  rimLight.position.set(-5, 1.5, 7);
  scene.add(rimLight);

  const loader = new GLTFLoader();
  const [gltf, screenTexture] = await Promise.all([
    loader.loadAsync(container.dataset.modelSrc),
    createScreenTexture(container.dataset.screenImage),
  ]);

  const model = gltf.scene;
  tuneModelMaterials(model);

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 8.9 / size.y;
  model.position.sub(center);
  model.scale.setScalar(scale);
  phoneRoot.add(model);

  const screenMaterial = new THREE.MeshBasicMaterial({
    map: screenTexture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(SCREEN_WIDTH * scale, SCREEN_HEIGHT * scale),
    screenMaterial
  );
  screenMesh.position.set(0, 0, (MODEL_FRONT_Z - center.z) * scale + 0.08);
  screenMesh.renderOrder = 10;
  phoneRoot.add(screenMesh);

  container.classList.add("phone-model--ready");

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 380 ? 24 : 22;
    camera.updateProjectionMatrix();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  let frameId = 0;
  const start = performance.now();

  function render(now) {
    const elapsed = (now - start) / 1000;
    if (!reduceMotion) {
      phoneRoot.rotation.y = -0.36 + Math.sin(elapsed * 0.75) * 0.035;
      phoneRoot.rotation.x = -0.06 + Math.sin(elapsed * 0.55) * 0.012;
    }
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  }

  frameId = requestAnimationFrame(render);

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(frameId);
    observer.disconnect();
    renderer.dispose();
    screenTexture.dispose();
    screenMaterial.dispose();
  }, { once: true });
}

document.querySelectorAll("[data-phone-model]").forEach((container) => {
  mountPhone(container).catch((error) => {
    console.error("Unable to render ORAE phone model", error);
    container.classList.add("phone-model--error");
  });
});
