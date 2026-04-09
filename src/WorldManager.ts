import * as THREE from 'three';

interface Obstacle {
  mesh: THREE.Mesh;
  box:  THREE.Box3;
}

/**
 * Manages the scrolling ground plane and the spawning/recycling of obstacles.
 * Everything moves in the +Z direction from the camera's perspective
 * (i.e., the world scrolls toward the player).
 */
export class WorldManager {
  private readonly scene: THREE.Scene;

  // Ground
  private readonly GROUND_LENGTH = 300;
  private readonly GROUND_WIDTH  = 40;
  private readonly groundTiles: THREE.Mesh[] = [];
  private readonly TILE_COUNT = 3;

  // Obstacles
  private readonly obstacles: Obstacle[] = [];
  private readonly POOL_SIZE       = 12;
  private readonly SPAWN_Z         = -120;   // how far ahead obstacles spawn
  private readonly RECYCLE_Z       = 30;     // Z at which an obstacle is recycled
  private readonly LANE_WIDTH      = 7;      // half-width of spawn area
  private readonly MIN_HEIGHT      = 1.0;
  private readonly MAX_HEIGHT      = 4.0;

  // Speed (units/second — shared with main.ts)
  readonly FORWARD_SPEED = 18;

  // Score counter (incremented when player passes an obstacle)
  private score = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildGround();
    this.buildObstaclePool();
  }

  // ─── Ground ──────────────────────────────────────────────────────────────

  private buildGround(): void {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x4a7c44,
      flatShading: false,
    });

    for (let i = 0; i < this.TILE_COUNT; i++) {
      const geo  = new THREE.PlaneGeometry(this.GROUND_WIDTH, this.GROUND_LENGTH, 1, 1);
      const tile = new THREE.Mesh(geo, mat);
      tile.rotation.x = -Math.PI / 2;
      tile.position.set(0, 0, -i * this.GROUND_LENGTH + this.GROUND_LENGTH / 2);
      this.scene.add(tile);
      this.groundTiles.push(tile);
    }
  }

  private scrollGround(delta: number): void {
    const shift = this.FORWARD_SPEED * delta;
    for (const tile of this.groundTiles) {
      tile.position.z += shift;
      // If the tile has scrolled fully past the camera, recycle it behind
      if (tile.position.z > this.GROUND_LENGTH) {
        tile.position.z -= this.TILE_COUNT * this.GROUND_LENGTH;
      }
    }
  }

  // ─── Obstacles ───────────────────────────────────────────────────────────

  private buildObstaclePool(): void {
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const mesh = this.createObstacleMesh();
      mesh.visible = false;
      this.scene.add(mesh);
      this.obstacles.push({ mesh, box: new THREE.Box3() });
    }
  }

  private createObstacleMesh(): THREE.Mesh {
    // Randomly alternate between cylinders and cones for visual variety
    const useCone = Math.random() < 0.4;
    const geo = useCone
      ? new THREE.ConeGeometry(0.6, 3, 7)
      : new THREE.CylinderGeometry(0.5, 0.5, 3, 8);

    const hue   = Math.random() * 0.1 + 0.02;   // earthy reds/oranges
    const color = new THREE.Color().setHSL(hue, 0.7, 0.45);
    const mat   = new THREE.MeshStandardMaterial({ color, flatShading: false });
    return new THREE.Mesh(geo, mat);
  }

  private resetObstacle(obs: Obstacle): void {
    const height = THREE.MathUtils.randFloat(this.MIN_HEIGHT, this.MAX_HEIGHT);
    const x      = THREE.MathUtils.randFloatSpread(this.LANE_WIDTH * 2);
    obs.mesh.position.set(x, height, this.SPAWN_Z);
    obs.mesh.visible = true;
  }

  private spawnObstacles(): void {
    for (const obs of this.obstacles) {
      if (!obs.mesh.visible) {
        // Stagger spawns: only spawn one inactive obstacle per check
        this.resetObstacle(obs);
        return;
      }
    }
  }

  private scrollObstacles(delta: number): void {
    const shift = this.FORWARD_SPEED * delta;
    for (const obs of this.obstacles) {
      if (!obs.mesh.visible) continue;

      obs.mesh.position.z += shift;
      obs.box.setFromObject(obs.mesh);

      // Recycle if past the player
      if (obs.mesh.position.z > this.RECYCLE_Z) {
        obs.mesh.visible = false;
        this.score++;
      }
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  update(delta: number): void {
    this.scrollGround(delta);
    this.scrollObstacles(delta);

    // Attempt to spawn every ~1.5 s on average by only spawning occasionally
    if (Math.random() < delta * 0.8) {
      this.spawnObstacles();
    }
  }

  /**
   * Check whether the provided box intersects any active obstacle.
   * Returns true on first hit.
   */
  checkCollision(playerBox: THREE.Box3): boolean {
    for (const obs of this.obstacles) {
      if (obs.mesh.visible && playerBox.intersectsBox(obs.box)) {
        return true;
      }
    }
    return false;
  }

  getScore(): number {
    return this.score;
  }
}
