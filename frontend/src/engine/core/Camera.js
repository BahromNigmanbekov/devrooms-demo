/**
 * Smooth-follow top-down camera. Position is expressed in world space and
 * represents the point the camera is centred on; Renderer converts this into
 * a canvas translation each frame.
 */
export class Camera {
  constructor(worldWidth, worldHeight) {
    this.x = worldWidth / 2;
    this.y = worldHeight / 2;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.smoothing = 6; // higher = snappier follow
    this.zoom = 1;
  }

  follow(targetX, targetY, dt) {
    const t = 1 - Math.exp(-this.smoothing * dt);
    this.x += (targetX - this.x) * t;
    this.y += (targetY - this.y) * t;
  }

  /**
   * "Cover" zoom, like CSS background-size:cover — makes sure the world
   * always fills the entire screen on every screen size/aspect ratio.
   * Without this, a viewport wider or taller than the world (ultra-wide
   * monitors, unusual aspect ratios, etc.) would clamp() into showing empty
   * void past the outer walls. Called every frame before clamp().
   */
  updateZoom(viewW, viewH) {
    const coverZoom = Math.max(viewW / this.worldWidth, viewH / this.worldHeight);
    this.zoom = Math.max(1, coverZoom);
  }

  /**
   * Keeps the visible viewport fully inside the world bounds — the camera
   * simply stops panning once the edge of the map would otherwise come
   * into view, so nothing beyond the map (void, artifacts, etc.) is ever
   * shown, no matter how close the player gets to a wall.
   */
  clamp(viewW, viewH) {
    const halfW = viewW / (2 * this.zoom);
    const halfH = viewH / (2 * this.zoom);

    if (this.worldWidth <= halfW * 2) {
      this.x = this.worldWidth / 2;
    } else {
      this.x = Math.max(halfW, Math.min(this.worldWidth - halfW, this.x));
    }

    if (this.worldHeight <= halfH * 2) {
      this.y = this.worldHeight / 2;
    } else {
      this.y = Math.max(halfH, Math.min(this.worldHeight - halfH, this.y));
    }
  }

  /** Apply the camera transform to a 2D context, centring on (viewW, viewH). */
  apply(ctx, viewW, viewH) {
    ctx.translate(viewW / 2, viewH / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }
}
