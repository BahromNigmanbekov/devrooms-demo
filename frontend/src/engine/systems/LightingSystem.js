/**
 * Wall-occluded flashlight cones.
 *
 * A flashlight beam is a fan of rays cast from the light's origin across its
 * angular width; each ray stops either at its max range or at the nearest
 * wall it hits, whichever is closer. The resulting points form a polygon
 * that IS the beam's true visible shape for this frame — no light can ever
 * appear "through" a wall because the polygon simply never extends past
 * one. Both the local player's flashlight (drawn as a screen-space cutout
 * in Renderer.drawAmbientLighting) and every other player's flashlight
 * (drawn as a world-space glow in Renderer.drawFlashlightGlow) build their
 * shape with this same function, so occlusion behaves identically for
 * everyone.
 */

/** Ray (origin + direction) vs. an axis-aligned rect. Returns the distance to the nearest entry hit, or null. */
function rayRectDistance(ox, oy, dx, dy, rect, maxDist) {
  const x1 = rect.x;
  const x2 = rect.x + rect.w;
  const y1 = rect.y;
  const y2 = rect.y + rect.h;

  let tmin = -Infinity;
  let tmax = Infinity;

  if (dx !== 0) {
    const tx1 = (x1 - ox) / dx;
    const tx2 = (x2 - ox) / dx;
    tmin = Math.max(tmin, Math.min(tx1, tx2));
    tmax = Math.min(tmax, Math.max(tx1, tx2));
  } else if (ox < x1 || ox > x2) {
    return null;
  }

  if (dy !== 0) {
    const ty1 = (y1 - oy) / dy;
    const ty2 = (y2 - oy) / dy;
    tmin = Math.max(tmin, Math.min(ty1, ty2));
    tmax = Math.min(tmax, Math.max(ty1, ty2));
  } else if (oy < y1 || oy > y2) {
    return null;
  }

  if (tmax < tmin || tmax < 0) return null;
  const t = tmin >= 0 ? tmin : tmax;
  return t > maxDist ? null : t;
}

/**
 * Casts a fan of rays from (ox, oy) across [angle-halfAngle, angle+halfAngle]
 * and returns the polygon boundary points (world space), each ray stopped
 * short by the nearest occluding wall. `walls` only needs a cheap broad
 * phase filter — flashlight ranges are short (a handful of tiles), so most
 * of a room's walls never need a real intersection test.
 */
export function castLightCone(ox, oy, angle, halfAngle, range, walls, rayCount = 26) {
  const nearWalls = walls.filter((w) => {
    // Distance from the origin to the wall rect's closest point — skip
    // anything further away than the beam could ever reach.
    const cx = Math.max(w.x, Math.min(ox, w.x + w.w));
    const cy = Math.max(w.y, Math.min(oy, w.y + w.h));
    const dx = ox - cx;
    const dy = oy - cy;
    return dx * dx + dy * dy <= range * range;
  });

  const points = [];
  for (let i = 0; i <= rayCount; i++) {
    const t = i / rayCount;
    const rayAngle = angle - halfAngle + t * halfAngle * 2;
    const dx = Math.cos(rayAngle);
    const dy = Math.sin(rayAngle);

    let dist = range;
    for (const w of nearWalls) {
      const hit = rayRectDistance(ox, oy, dx, dy, w, dist);
      if (hit !== null && hit < dist) dist = hit;
    }
    points.push({ x: ox + dx * dist, y: oy + dy * dist });
  }
  return points;
}
