// Seats are derived from each area's existing furniture, so Office/Arcade seating works too.
export function buildSeats(furniture,area) {
  return furniture.flatMap((f,index)=>{
    if(!/chair|sofa|bench/.test(f.type)) return [];
    const count=/sofa|bench/.test(f.type)?Math.max(1,Math.floor(f.w/54)):1;
    return Array.from({length:count},(_,slot)=>({
      id:area+":seat:"+index+":"+slot, furniture:f,
      x:f.x+f.w*(slot+.5)/count,y:f.y+f.h*.55,
      interactRadius:70,label:/chair/.test(f.type)?"Stulga o'tirish":"O'tirish"
    }));
  });
}
export function findStandingPosition(seat,collision,radius=16) {
  const f=seat.furniture, gap=radius+8;
  const choices=[
    {x:seat.x,y:f.y+f.h+gap},{x:seat.x,y:f.y-gap},
    {x:f.x-gap,y:seat.y},{x:f.x+f.w+gap,y:seat.y},
    {x:f.x-gap,y:f.y+f.h+gap},{x:f.x+f.w+gap,y:f.y+f.h+gap}
  ];
  return choices.find(p=>!collision._collidesAny(p.x,p.y,radius))||null;
}
export function findAvailableSeat(seats,x,y,players,localId) {
  const occupied=new Set(players.filter(p=>p.id!==localId&&p.seated).map(p=>p.seatId));
  return seats.filter(s=>!occupied.has(s.id)&&Math.hypot(s.x-x,s.y-y)<=s.interactRadius)
    .sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]||null;
}
