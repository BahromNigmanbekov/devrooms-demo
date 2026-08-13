function centerOf(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

export class InteractionSystem {
  constructor(interactables) {
    this.interactables = interactables;
  }

  /** Returns the closest interactable within its own interactRadius, or null. */
  findNearest(playerX, playerY) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const obj of this.interactables) {
      const c = centerOf(obj);
      const dist = Math.hypot(c.x - playerX, c.y - playerY);
      if (dist <= obj.interactRadius && dist < nearestDist) {
        nearest = obj;
        nearestDist = dist;
      }
    }
    return nearest;
  }
}
