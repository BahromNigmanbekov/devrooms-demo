export function presentPlayer(player,tag){
 if(!player||!tag?.active||tag.hunterId!==player.id)return player;
 return {...player,isHunter:true,nickname:'Ovchi',color:'#bd4936',equipment:{head:'none',back:'none',weapon:player.equipment?.weapon||'none'}};
}
