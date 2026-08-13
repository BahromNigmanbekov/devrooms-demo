/**
 * Axis-separated circle vs. AABB collision. Treats the moving entity as a
 * circle (x, y, radius) and each obstacle as an axis-aligned rect
 * { x, y, w, h }. Movement is resolved one axis at a time so the player
 * slides smoothly along walls/furniture instead of snagging on corners.
 */

function circleIntersectsRect(cx, cy, radius, rect) {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export class CollisionSystem {
  constructor(obstacles) {
    this.obstacles = obstacles;
  }

  /**
   * Attempts to move a circle from (x, y) by (dx, dy). Returns the resolved
   * { x, y } after sliding along any obstacles it would have overlapped.
   */
  resolveMove(x, y, dx, dy, radius) {
    let nx = x;
    let ny = y;

    // Move on X first.
    if (dx !== 0) {
      const testX = nx + dx;
      if (!this._collidesAny(testX, ny, radius)) {
        nx = testX;
      }
    }

    // Then move on Y, using the (possibly already resolved) X.
    if (dy !== 0) {
      const testY = ny + dy;
      if (!this._collidesAny(nx, testY, radius)) {
        ny = testY;
      }
    }

    return { x: nx, y: ny };
  }

  _collidesAny(x, y, radius) {
    for (const rect of this.obstacles) {
      if (circleIntersectsRect(x, y, radius, rect)) return true;
    }
    return false;
  }
}
