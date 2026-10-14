function centerOf(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

export class InteractionSystem {
  constructor(interactables) {
    this.interactables = interactables;
  }

  /** Returns the closest interactable within its own interactRadius, or null. */
  findNearest(playerX, playerY, canInteract = () => true) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const obj of this.interactables) {
      if (!canInteract(obj)) continue;
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

export function hasLineOfSight(player,item,walls) {
  const end=centerOf(item),dx=end.x-player.x,dy=end.y-player.y;
  return !walls.some(rect=>{
    let lo=0,hi=1;
    for(const [start,delta,min,max] of [[player.x,dx,rect.x,rect.x+rect.w],[player.y,dy,rect.y,rect.y+rect.h]]) {
      if(Math.abs(delta)<1e-8){if(start<min||start>max)return false;}
      else {
        const a=(min-start)/delta,b=(max-start)/delta;
        lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));
        if(lo>hi) return false;
      }
    }
    return hi>0.001&&lo<0.999;
  });
}
