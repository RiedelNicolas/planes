import * as THREE from 'three';
import { Plane }        from './Plane';
import { WorldManager } from './WorldManager';

// ─── Renderer ────────────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ─── Scene ───────────────────────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 60, 160);

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 20, 5);
sun.castShadow = true;
scene.add(sun);

// ─── Camera ──────────────────────────────────────────────────────────────────

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  300,
);

// Desired offset from the plane in world space (behind and above)
const CAM_OFFSET   = new THREE.Vector3(0, 4, 12);
const CAM_LERP     = 6; // higher = snappier follow

const camTarget    = new THREE.Vector3();
const camPos       = new THREE.Vector3();

// ─── Game Objects ────────────────────────────────────────────────────────────

const plane       = new Plane();
const world       = new WorldManager(scene);
scene.add(plane.mesh);

// ─── HUD ─────────────────────────────────────────────────────────────────────

const scoreEl = document.getElementById('score')!;

// ─── Game-state ──────────────────────────────────────────────────────────────

let gameOver = false;

function triggerGameOver(): void {
  gameOver = true;

  // Simple overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; inset:0; display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    background:rgba(0,0,0,0.55); color:#fff; font-family:monospace;
  `;
  overlay.innerHTML = `
    <div style="font-size:48px;margin-bottom:16px;">💥 GAME OVER</div>
    <div style="font-size:24px;margin-bottom:32px;">Score: ${world.getScore()}</div>
    <button style="font-size:20px;padding:12px 32px;cursor:pointer;"
            onclick="location.reload()">Play Again</button>
  `;
  document.body.appendChild(overlay);
}

// ─── Resize ──────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Game Loop ───────────────────────────────────────────────────────────────

const clock = new THREE.Clock();

// Initialise camera position so there's no snap on first frame
camPos.copy(plane.mesh.position).add(CAM_OFFSET);
camera.position.copy(camPos);

function gameLoop(): void {
  requestAnimationFrame(gameLoop);

  const delta = Math.min(clock.getDelta(), 0.1); // clamp to avoid huge jumps

  if (!gameOver) {
    // Update game objects
    plane.update(delta);
    world.update(delta);

    // Collision check
    if (world.checkCollision(plane.getBox())) {
      triggerGameOver();
    }

    // HUD
    scoreEl.textContent = String(world.getScore());
  }

  // ── Smooth third-person camera ──────────────────────────────────────────
  // Target position = plane position + offset (always world-space behind/above)
  camTarget.copy(plane.mesh.position).add(CAM_OFFSET);
  camPos.lerp(camTarget, CAM_LERP * delta);
  camera.position.copy(camPos);
  camera.lookAt(plane.mesh.position);

  renderer.render(scene, camera);
}

gameLoop();
