# AGENTS.md — Rules of Engagement

## Project Identity
This is an **arcade plane game** built with TypeScript, Three.js, and Vite.

## Aesthetic
- **Smooth-shaded low-poly** style throughout.
- All meshes use `THREE.MeshStandardMaterial` with `flatShading: false` (smooth shading).
- Keep geometry simple: low poly-count primitives (cones, cylinders, boxes, planes).
- Consistent color palette: muted earth tones for the world, bright accent colors for the plane.

## Physics & Gameplay
- **Constant forward velocity**: the world scrolls toward the player; the plane speed never changes.
- **Arcade-like physics only**: no rigid-body simulation. Movement is positional/rotational lerp.
- **Simple Bounding Box collisions**: use `THREE.Box3` for all collision checks (`getBox()` / `setFromObject()`). No mesh-level or sphere collisions.
- Auto-leveling: the plane lerps its roll/pitch back to neutral when no input is held.

## Code Conventions
- **Class-based structure**: every game entity is a TypeScript `class` (e.g., `Plane`, `WorldManager`).
- All new game objects must expose a `update(delta: number)` method consumed by the main game loop.
- Collision-capable objects must expose a `getBox(): THREE.Box3` method.
- **Entry point** is `src/main.ts`; it owns the `THREE.Scene`, `THREE.WebGLRenderer`, and the game loop.
- The camera is a smooth third-person camera managed in `src/main.ts` using lerp.

## File Layout
```
src/
  main.ts          — scene, renderer, camera, game loop
  Plane.ts         — player plane entity
  WorldManager.ts  — ground scrolling + obstacle lifecycle
```

## Future Feature Rules
1. Every new feature must be implemented as a class following the pattern above.
2. New obstacles or environment objects belong in `WorldManager.ts` or a dedicated class imported by it.
3. No external physics engines — keep it arcade.
4. No new rendering libraries — Three.js only.
5. All assets should be procedurally generated geometry (no external model files) to keep the bundle small.
