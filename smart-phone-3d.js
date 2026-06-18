import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const baseRotation = new THREE.Euler(-0.06, -0.36, -0.02);
const hoverTiltLimit = {
  x: 0.065,
  y: 0.12,
};

function tuneModelMaterials(model) {
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;

    if (!child.material) return;
    child.material = child.material.clone();

    const materialName = child.material.name?.toLowerCase() || "";

    if (child.material.map) {
      child.material.map.anisotropy = 8;
      child.material.map.needsUpdate = true;
    }

    if (materialName.includes("screen") && child.material.map) {
      child.material = new THREE.MeshBasicMaterial({
        name: child.material.name,
        map: child.material.map,
        toneMapped: false,
        side: THREE.FrontSide,
      });
      return;
    }

    if (child.material.envMapIntensity !== undefined) {
      child.material.envMapIntensity = 0.28;
    }
    if (child.material.metalness !== undefined) {
      child.material.metalness = Math.min(0.62, child.material.metalness);
    }
    if (child.material.roughness !== undefined) {
      child.material.roughness = Math.max(0.38, child.material.roughness);
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
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 22);

  const phoneRoot = new THREE.Group();
  phoneRoot.rotation.copy(baseRotation);
  phoneRoot.position.set(0.12, -0.08, 0);
  scene.add(phoneRoot);

  scene.add(new THREE.HemisphereLight(0xfff7ed, 0xd8d0c7, 1.18));

  const keyLight = new THREE.DirectionalLight(0xfff3e2, 1.45);
  keyLight.position.set(3.5, 6, 8);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.55);
  rimLight.position.set(-5, 1.5, 7);
  scene.add(rimLight);

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(container.dataset.modelSrc);
  const model = gltf.scene;
  tuneModelMaterials(model);

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 8.9 / size.y;
  model.position.sub(center);
  model.scale.setScalar(scale);
  phoneRoot.add(model);

  container.classList.add("phone-model--ready");

  const pointerTilt = {
    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0,
  };

  function handlePointerMove(event) {
    if (reduceMotion) return;

    const bounds = container.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
    const relativeY = (event.clientY - bounds.top) / Math.max(bounds.height, 1);

    pointerTilt.targetY = (relativeX - 0.5) * hoverTiltLimit.y;
    pointerTilt.targetX = -(relativeY - 0.5) * hoverTiltLimit.x;
  }

  function handlePointerLeave() {
    pointerTilt.targetX = 0;
    pointerTilt.targetY = 0;
  }

  if (!reduceMotion) {
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);
  }

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
    const floatY = reduceMotion ? 0 : Math.sin(elapsed * 0.75) * 0.024;
    const floatX = reduceMotion ? 0 : Math.sin(elapsed * 0.55) * 0.01;

    if (!reduceMotion) {
      pointerTilt.currentX += (pointerTilt.targetX - pointerTilt.currentX) * 0.08;
      pointerTilt.currentY += (pointerTilt.targetY - pointerTilt.currentY) * 0.08;
    }

    phoneRoot.rotation.x = baseRotation.x + floatX + pointerTilt.currentX;
    phoneRoot.rotation.y = baseRotation.y + floatY + pointerTilt.currentY;
    phoneRoot.rotation.z = baseRotation.z;
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  }

  frameId = requestAnimationFrame(render);

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(frameId);
    observer.disconnect();
    container.removeEventListener("pointermove", handlePointerMove);
    container.removeEventListener("pointerleave", handlePointerLeave);
    renderer.dispose();
  }, { once: true });
}

document.querySelectorAll("[data-phone-model]").forEach((container) => {
  mountPhone(container).catch((error) => {
    console.error("Unable to render ORAE phone model", error);
    container.classList.add("phone-model--error");
  });
});
