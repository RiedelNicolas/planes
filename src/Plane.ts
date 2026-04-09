import * as THREE from 'three';

/** Keys currently held down. */
const keys: Record<string, boolean> = {};

window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup',   (e) => { keys[e.code] = false; });

/** Low-poly, smooth-shaded arcade plane controlled with WASD. */
export class Plane {
  readonly mesh: THREE.Group;

  /** Bounding box used for collision checks (updated every frame). */
  private readonly box = new THREE.Box3();

  // Tuning constants
  private readonly PITCH_SPEED  = 1.2;   // rad/s
  private readonly ROLL_SPEED   = 1.5;   // rad/s
  private readonly PITCH_LIMIT  = 0.45;  // rad
  private readonly ROLL_LIMIT   = 0.6;   // rad
  private readonly LEVEL_SPEED  = 3.0;   // auto-level lerp factor
  private readonly VERT_SPEED   = 6.0;   // vertical translation speed (units/s)
  private readonly HORIZ_SPEED  = 5.0;   // horizontal translation speed (units/s)
  private readonly MIN_HEIGHT   = 0.5;   // floor clamp
  private readonly MAX_HEIGHT   = 12.0;  // ceiling clamp
  private readonly HORIZ_LIMIT  = 8.0;   // side boundary

  constructor() {
    this.mesh = this.buildMesh();
    this.mesh.position.set(0, 3, 0);
    this.mesh.rotation.y = Math.PI;
  }

  // ─── Build ───────────────────────────────────────────────────────────────

  private buildMesh(): THREE.Group {
    const group = new THREE.Group();

    const mat = (color: number) =>
      new THREE.MeshStandardMaterial({ color, flatShading: false });

    // Fuselage — elongated box
    const fuselageGeo = new THREE.BoxGeometry(0.5, 0.3, 2.2);
    const fuselage    = new THREE.Mesh(fuselageGeo, mat(0x4a90d9));
    group.add(fuselage);

    // Cockpit — smaller box on top-front
    const cockpitGeo = new THREE.BoxGeometry(0.35, 0.22, 0.6);
    const cockpit    = new THREE.Mesh(cockpitGeo, mat(0x87ceeb));
    cockpit.position.set(0, 0.24, 0.5);
    group.add(cockpit);

    // Main wings — thin wide box
    const wingGeo = new THREE.BoxGeometry(3.6, 0.08, 0.9);
    const wings   = new THREE.Mesh(wingGeo, mat(0x357abd));
    wings.position.set(0, 0, 0.1);
    group.add(wings);

    // Tail horizontal stabilizer
    const hStabGeo = new THREE.BoxGeometry(1.4, 0.06, 0.45);
    const hStab    = new THREE.Mesh(hStabGeo, mat(0x357abd));
    hStab.position.set(0, 0.05, -0.9);
    group.add(hStab);

    // Tail vertical stabilizer
    const vStabGeo = new THREE.BoxGeometry(0.06, 0.4, 0.45);
    const vStab    = new THREE.Mesh(vStabGeo, mat(0x357abd));
    vStab.position.set(0, 0.25, -0.9);
    group.add(vStab);

    // Engine nacelle (cone pointing forward)
    const nozzleGeo = new THREE.ConeGeometry(0.15, 0.5, 8);
    const nozzle    = new THREE.Mesh(nozzleGeo, mat(0x2c2c2c));
    nozzle.rotation.x = -Math.PI / 2;
    nozzle.position.set(0, 0, 1.35);
    group.add(nozzle);

    return group;
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  update(delta: number): void {
    this.handleInput(delta);
    this.box.setFromObject(this.mesh);
  }

  private handleInput(delta: number): void {
    const { position, rotation } = this.mesh;

    // ── Pitch (W/S) ──────────────────────────────────────────────────────
    if (keys['KeyW']) {
      rotation.x = Math.max(rotation.x - this.PITCH_SPEED * delta, -this.PITCH_LIMIT);
      position.y = Math.min(position.y + this.VERT_SPEED * delta, this.MAX_HEIGHT);
    } else if (keys['KeyS']) {
      rotation.x = Math.min(rotation.x + this.PITCH_SPEED * delta,  this.PITCH_LIMIT);
      position.y = Math.max(position.y - this.VERT_SPEED * delta, this.MIN_HEIGHT);
    } else {
      // Auto-level pitch
      rotation.x = THREE.MathUtils.lerp(rotation.x, 0, this.LEVEL_SPEED * delta);
    }

    // ── Roll / Yaw (A/D) ─────────────────────────────────────────────────
    if (keys['KeyA']) {
      rotation.z = Math.min(rotation.z + this.ROLL_SPEED * delta,  this.ROLL_LIMIT);
      position.x = Math.max(position.x - this.HORIZ_SPEED * delta, -this.HORIZ_LIMIT);
    } else if (keys['KeyD']) {
      rotation.z = Math.max(rotation.z - this.ROLL_SPEED * delta, -this.ROLL_LIMIT);
      position.x = Math.min(position.x + this.HORIZ_SPEED * delta,  this.HORIZ_LIMIT);
    } else {
      // Auto-level roll
      rotation.z = THREE.MathUtils.lerp(rotation.z, 0, this.LEVEL_SPEED * delta);
    }
  }

  // ─── Collision ───────────────────────────────────────────────────────────

  /** Returns the world-space bounding box of the plane (updated each frame). */
  getBox(): THREE.Box3 {
    return this.box;
  }
}
