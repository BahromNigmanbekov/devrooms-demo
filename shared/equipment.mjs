const headRows=[
 ['cowboy','Space Cowboy','cowboy','#c9904c'],['ranger','Star Ranger','ranger','#d8e5ec'],['pilot','Solar Pilot','pilot','#e4a043'],
 ['pirate','Captain Hook','pirate','#563e64'],['wizard','Moon Wizard','wizard','#7850ba'],['crown','Royal Circuit','crown','#eab83c'],
 ['viking','Nordic Forge','viking','#8a9bad'],['samurai','Ronin','samurai','#c84e48'],['ninja','Shadow Circuit','ninja','#3c425c'],
 ['beret','Artist','beret','#b44755'],['cap','Street Byte','cap','#5296df'],['beanie','Winter Byte','beanie','#d47a60'],
 ['tophat','Gentlebot','tophat','#3c465d'],['chef','Chef Bot','chef','#f1e7d7'],['cactus','Desert Bloom','cactus','#59ac76'],
 ['cat','Cat Ears','cat','#cc82c9'],['bunny','Lunar Bunny','bunny','#c0c9e4'],['fox','Fox Spirit','fox','#e69a58'],
 ['dragon','Dragon Crest','dragon','#b66169'],['antlers','Forest Guardian','antlers','#b49a73'],['halo','Solar Halo','halo','#f3d564'],
 ['headphones','Bass Master','headphones','#5bc7d6'],['goggles','Steampunk','goggles','#bb8c4c'],['diver','Deep Sea','diver','#c19653'],
 ['knight','Iron Sentinel','knight','#a8bccb'],['spartan','Crimson Spartan','spartan','#b19460'],['ufo','UFO Visitor','ufo','#79c8bf'],
 ['flower','Garden Crown','flower','#ec9ab3'],['crystal','Crystal Sage','crystal','#91b5ff'],['pharaoh','Sun Pharaoh','pharaoh','#e9bc55'],
];
const backRows=[
 ['astronaut','Moonwalker','astronaut','#cbd8dc'],['jetpack','Twin Thruster','jetpack','#e2914e'],['rocket','Rocket Rider','rocket','#e26664'],
 ['wings','Sky Wings','wings','#d6e5f1'],['batwings','Night Wings','batwings','#8064ab'],['butterfly','Prism Wings','butterfly','#d586c4'],
 ['cape','Crimson Cape','cape','#b84964'],['shield','Guardian Shield','shield','#638fbd'],['turtle','Shell Buddy','turtle','#79a06a'],
 ['satchel','Explorer Bag','satchel','#ab8057'],['school','Campus Pack','school','#df9c54'],['hiking','Trail Master','hiking','#78a380'],
 ['medic','Medic Pack','medic','#e0e8dd'],['battery','Power Cell','battery','#73d9b0'],['reactor','Fusion Core','reactor','#6ad6e8'],
 ['solar','Solar Array','solar','#7e9fdd'],['radar','Radar Dish','radar','#aec5cc'],['radio','Field Radio','radio','#788e70'],
 ['drone','Drone Dock','drone','#d2bd77'],['aquarium','Aqua World','aquarium','#66c8dc'],['garden','Mini Garden','garden','#79b46f'],
 ['chest','Treasure Chest','chest','#bb884d'],['scroll','Scroll Keeper','scroll','#dfc890'],['guitar','Rockstar','guitar','#d97865'],
 ['skateboard','Street Deck','skateboard','#a57cc7'],['quiver','Star Archer','quiver','#9b765d'],['crystalpack','Crystal Engine','crystalpack','#ae8aef'],
 ['clockwork','Clockwork','clockwork','#c69c58'],['snowglobe','Snow Globe','snowglobe','#a5cde3'],['octopus','Octo Buddy','octopus','#cb8dc3'],
];
export const HEAD_ITEMS=headRows.map(([id,name,shape,color])=>({id,name,shape,color,description:'Bosh kiyim'}));
export const BACK_ITEMS=backRows.map(([id,name,shape,color])=>({id,name,shape,color,description:'Ryukzak / orqa jihoz'}));
const lightColors=[['azure','Azure','#55c7ff'],['emerald','Emerald','#60f5a2'],['crimson','Crimson','#ff5c72'],['violet','Violet','#b582ff'],['gold','Gold','#ffdc67'],['white','White','#e2faff'],['rose','Rose','#ff83cb'],['twin','Twin Arc','#76f8f0']];
const blades=lightColors.map(([id,name,color],i)=>({id:'light-'+id,name:name+' Lightblade',shape:i===7?'doubleblade':'lightblade',color,type:'melee',damage:i===7?32:40,range:i===7?145:125,cooldown:i===7?700:550,description:'Nur qilichi · yaqin zarba'}));
const guns=[['pulse','Pulse Rifle','#70d4fb',18,620,220],['burst','Burst Carbine','#efb56b',36,500,650],['sniper','Ion Sniper','#b0b5ff',65,900,1400],['scatter','Scatter Blaster','#e6936a',48,270,950],['rail','Rail Driver','#74ead5',55,760,1150],['plasma','Plasma Auto','#b999f3',22,560,300],['repeater','Repeater','#e6cc6a',14,480,160],['frost','Frost Blaster','#95e4fa',30,570,500]].map(([id,name,color,damage,range,cooldown])=>({id:'gun-'+id,name,shape:id==='sniper'?'sniper':id==='scatter'?'scatter':'rifle',color,type:'ranged',damage,range,cooldown,description:'Energiya avtomati · masofali zarba'}));
const swords=[['saber','Solar Saber','sword','#e1c16a',48,115,750],['katana','Neon Katana','katana','#f29bc4',42,140,650],['axe','Storm Axe','axe','#8bbce4',75,105,1300],['hammer','Nova Hammer','hammer','#cd9df2',85,95,1600],['spear','Starlance','spear','#7cddd4',38,200,800],['daggers','Twin Daggers','daggers','#c5ccdb',26,95,300]].map(([id,name,shape,color,damage,range,cooldown])=>({id,name,shape,color,type:'melee',damage,range,cooldown,description:'Yaqin masofadagi zarba'}));
const staffs=[['healer','Life Scepter','#79efb3','heal',0,230,10000],['shield','Aegis Scepter','#88baff','shield',0,200,14000],['scanner','Oracle Staff','#c69bff','scan',0,440,8000],['sun','Sun Staff','#ffd479','pulse',45,190,1800],['moon','Moon Staff','#a9bbff','pulse',35,240,1500],['storm','Storm Scepter','#75e5ef','pulse',60,160,2300],['rose','Rose Scepter','#f7a1c8','heal',0,160,7000],['prism','Prism Staff','#bd9fff','scan',0,600,11000]].map(([id,name,color,type,damage,range,cooldown])=>({id:'staff-'+id,name,shape:id==='shield'?'shieldstaff':id==='healer'||id==='rose'?'healstaff':'staff',color,type,damage,range,cooldown,description:{heal:'Yaqindagi jamoaga +15 quvvat',shield:'Jamoaga 6 soniyalik himoya',scan:'Yaqin topshiriqlarni 6 soniya yoritadi',pulse:'Atrofdagi dronlarga energiya to‘lqini'}[type]}));
export const WEAPON_ITEMS=[...blades,...guns,...swords,...staffs];
export const EQUIPMENT={head:HEAD_ITEMS,back:BACK_ITEMS,weapon:WEAPON_ITEMS};
export const EQUIPMENT_BY_ID=Object.fromEntries(Object.entries(EQUIPMENT).map(([slot,items])=>[slot,Object.fromEntries(items.map(i=>[i.id,i]))]));
export function sanitizeEquipment(value={}){return Object.fromEntries(Object.keys(EQUIPMENT).map(slot=>[slot,EQUIPMENT_BY_ID[slot][value?.[slot]]?value[slot]:'none']));}
export function getWeapon(id){return EQUIPMENT_BY_ID.weapon[id]||null;}
