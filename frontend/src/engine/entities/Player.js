export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.speed = 240; // px/sec
    this.facing = { x: 0, y: 1 }; // last non-zero move direction, for rendering
    this.moving = false;
    this.color = null; // set by Game from the room's player identity; Renderer falls back to a default
    this.nickname = null;
    this.isLocal = true;
  }

  /**
   * Updates the player using the collision system to resolve motion.
   * `frozen` is used while a modal/UI is open — input is ignored entirely.
   */
  update(dt, moveVector, collisionSystem, frozen) {
    if (frozen || (moveVector.x === 0 && moveVector.y === 0)) {
      this.moving = false;
      return;
    }

    this.moving = true;
    this.facing = moveVector;

    const dx = moveVector.x * this.speed * dt;
    const dy = moveVector.y * this.speed * dt;

    const resolved = collisionSystem.resolveMove(this.x, this.y, dx, dy, this.radius);
    this.x = resolved.x;
    this.y = resolved.y;
  }
}
