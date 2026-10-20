import {EQUIPMENT_BY_ID} from '../../../../shared/equipment.mjs';

export function drawEquipmentArt(ctx,w,h,equipment,view,layer){
 const head=EQUIPMENT_BY_ID.head[equipment.head],back=EQUIPMENT_BY_ID.back[equipment.back];
 ctx.save();ctx.scale(w,h);ctx.lineJoin='round';ctx.lineCap='round';
 const p=(d,fill,stroke='#1a2032',width=.025)=>{const path=new Path2D(d);ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.fill(path);if(stroke)ctx.stroke(path)};
 const l=(d,color='#eaf7fb',width=.025)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke(new Path2D(d))};
 const e=(x,y,rx,ry,fill,stroke='#293346')=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.025;ctx.stroke()}};
 const g=(color,low='#374054')=>{const a=ctx.createLinearGradient(-.4,-.9,.5,.45);a.addColorStop(0,color);a.addColorStop(1,low);return a};
 const star=(x,y,r,color)=>{let d='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;d+=(i?'L':'M')+(x+Math.cos(a)*rr)+' '+(y+Math.sin(a)*rr)}p(d+'Z',color)};
 const gear=(x,y,r,color)=>{let d='';for(let i=0;i<32;i++){const a=i*Math.PI/16,rr=(i%4<2)?r:r*.8;d+=(i?'L':'M')+(x+Math.cos(a)*rr)+' '+(y+Math.sin(a)*rr)}p(d+'Z',color);e(x,y,r*.32,r*.32,'#283546')};
 const leaf=(x,y,flip=1)=>p(`M${x} ${y}q${-.25*flip} -.4 ${-.02*flip} -.57q${.30*flip} .20 ${.02*flip} .57Z`,g('#99d48c','#3c7756'));
 const wings=(kind,color)=>{for(const sign of [-1,1]){ctx.save();ctx.scale(sign,1);if(kind==='wings'){p('M.23 .13Q.42 -.55 .95 -.80Q.92 -.36 .65 -.13Q.88 -.26 .89 -.10Q.72 .19 .44 .36Z',g(color,'#708ba5'));for(let i=0;i<4;i++)l(`M${.42+i*.06} ${.1-i*.1}L${.78+i*.045} ${-.40-i*.07}`,'#eaf8ff',.016)}else if(kind==='batwings'){p('M.25 .18Q.38 -.45 1 -.64L.9 .05Q.70 -.13 .64 .23Q.49 .05 .38 .38Z',g(color,'#32223e'));l('M.35 .18L.85 -.43M.62 .17L.83 -.4', '#b498c7',.018)}else{e(.62,-.24,.34,.37,g(color,'#814ca7'));e(.58,.25,.28,.27,g('#90d7d4','#4d6c95'));e(.67,-.27,.13,.20,'#edb3da');l('M.30 .10L.86 -.48M.31 .13L.73 .35','#ece5f4',.018)}ctx.restore()}};
 if(back&&back.id!=='astronaut'){
  const c=back.color;
  if(layer==='behind'){
   switch(back.shape){
    case 'wings':case 'batwings':case 'butterfly':wings(back.shape,c);break;
    case 'cape':p('M-.30 -.4Q-.50 .02 -.65 .77Q0 .97 .65 .77Q.50 .02 .30 -.4Z',g(c,'#511d45'));l('M-.3 -.18L-.42 .73M.3 -.18L.42 .73','#e67886');break;
    case 'jetpack':case 'rocket':for(const s of [-1,1]){ctx.save();ctx.scale(s,1);p('M.35 -.18Q.35 -.58 .51 -.65Q.68 -.55 .67 -.18V.34H.35Z',g(c,'#5b586d'));p('M.36 .24H.65L.75 .46L.53 .38L.29 .46Z','#aebbc8');p('M.42 .40Q.34 .71 .51 .79Q.70 .60 .61 .40Z','#72d9ef');l('M.48 .45V.65','#f1eeb7');ctx.restore()}break;
    case 'solar':for(const s of [-1,1]){ctx.save();ctx.scale(s,1);p('M.26 -.40L.94 -.40V.35L.26 .35Z','#315278','#8aa1c8');for(let i=0;i<3;i++)l(`M${.31+i*.2} -.35V.30`,'#6c97c3',.015);for(let i=0;i<3;i++)l(`M.30 ${-.30+i*.22}H.88`,'#6c97c3',.015);ctx.restore()}break;
    case 'guitar':p('M-.65 .48Q-.98 .15 -.61 -.04L.07 -.92L.20 -.82L-.42 .03Q-.10 .38 -.42 .60Z',g(c,'#764752'));l('M-.6 .35L.13 -.86','#efdbb8',.016);break;
    case 'skateboard':p('M-.62 -.77Q-.32 -.91 -.24 -.58L-.40 .56Q-.51 .81 -.77 .60Z',g(c,'#593c76'));for(const y of [-.5,.4]){e(-.68,y,.075,.07,'#c6c9bf');e(-.37,y,.075,.07,'#c6c9bf')}star(-.5,-.05,.15,'#e9ca75');break;
    case 'quiver':p('M-.62 -.3L-.32 -.34L-.24 .52L-.56 .57Z',g(c,'#604a3c'));for(let i=0;i<3;i++){l(`M${-.55+i*.09} -.20L${-.63+i*.13} -.82`,'#d0b894');p(`M${-.63+i*.13} -.8l-.07 -.15 .13 .03Z`,'#80cfbe')}break;
    case 'radar':l('M-.2 -.35L-.45 -.83','#b6d5da',.05);p('M-.88 -.83Q-.55 -.37 -.19 -.93Q-.57 -1.14 -.88 -.83Z',g(c,'#617588'));l('M-.57 -.73L-.56 -1.05','#d9f4ea');break;
    case 'drone':l('M-.36 -.32L-.62 -.64M.36 -.32L.62 -.64','#9badbd',.05);for(const s of [-1,1]){e(s*.65,-.69,.29,.08,'#414d65');e(s*.65,-.69,.11,.06,c)}break;
    case 'octopus':for(let i=0;i<6;i++){const x=(i-2.5)*.21;l(`M${x*.5} .10Q${x*1.6} .85 ${x*1.4} .40`,c,.12);e(x*1.35,.43,.035,.035,'#ead4e4',null)}break;
    case 'scroll':for(const s of [-1,1]){p(`M${s*.49-.1} -.46h.2v.94h-.2Z`,'#ead6ad');e(s*.49,-.46,.1,.045,'#9a7e5f');l(`M${s*.49-.09} -.18h.18`, '#a65168',.065)}break;
    case 'crystalpack':for(const s of [-1,1])p(`M${s*.40} .26L${s*.72} -.1L${s*.61} -.64L${s*.34} -.28Z`,g(c,'#7458aa'));break;
    default:p('M-.48 -.28Q-.7 -.28 -.65 .05L-.59 .39H-.40M.48 -.28Q.7 -.28 .65 .05L.59 .39H.40',g(c));
   }
  }else if(view==='back'){
   if(!['wings','batwings','butterfly','cape','guitar','skateboard','quiver','solar'].includes(back.shape)){
    p('M-.28 -.38Q0 -.48 .28 -.38L.38 -.15V.29Q0 .52 -.38 .29V-.15Z',g(c));l('M-.25 -.28Q0 -.37 .25 -.28','#ffffff88');
   }
   switch(back.shape){
    case 'jetpack':e(0,-.03,.20,.22,'#405166');e(0,-.03,.12,.14,'#66e6e3');break;
    case 'rocket':p('M-.16 -.34Q0 -.68 .16 -.34L.18 .28H-.18Z',g('#f1ded0','#b35d58'));e(0,-.12,.09,.09,'#71ccdf');break;
    case 'shield':p('M-.34 -.38L0 -.51L.34 -.38L.29 .12Q.23 .35 0 .46Q-.23 .35 -.29 .12Z',g(c,'#25446a'),'#d8d9be');star(0,-.04,.20,'#ecd58d');break;
    case 'turtle':e(0,0,.38,.43,g(c,'#405e48'));p('M0 -.3L.21 -.15L.18 .13L0 .25L-.18 .13L-.21 -.15Z','#476d48','#a6b885');break;
    case 'satchel':p('M-.37 -.19Q0 -.35 .37 -.19L.33 .24H-.33Z',g('#bd9668','#7a5645'));l('M0 -.2V.27','#e9c994',.05);break;
    case 'school':p('M-.25 -.04H.25V.29H-.25Z','#b16b3e','#eed4a0');l('M-.22 .03H.22','#edd7a2');break;
    case 'hiking':p('M-.26 -.06H.26V.29H-.26Z','#497665');for(const s of [-1,1])l(`M${s*.2} -.30V.32`,'#d3c08e',.05);e(0,-.44,.32,.08,'#d2b280');break;
    case 'medic':p('M-.08 -.26H.08V-.10H.24V.06H.08V.22H-.08V.06H-.24V-.1H-.08Z','#cf5d65');break;
    case 'battery':p('M-.23 -.28H.23V.28H-.23Z','#243844');for(let i=0;i<4;i++)p(`M-.17 ${.15-i*.11}h.34v.07h-.34Z`,'#81edbc',null);break;
    case 'reactor':for(const r of [.29,.21,.1])e(0,0,r,r,r===.21?'#4d6079':'#a3f9f1');break;
    case 'radio':l('M.22 -.3V-.76','#a4bfbd',.045);p('M-.22 -.23H.17V-.04H-.22Z','#b7d9ab');for(let i=0;i<3;i++)l(`M-.2 ${.08+i*.07}H.2`,'#273c40');break;
    case 'drone':e(0,0,.2,.17,'#304655');e(0,0,.1,.09,'#ebc866');break;
    case 'aquarium':p('M-.27 -.27Q0 -.35 .27 -.27L.25 .25H-.25Z','#70d7dc','#b7eeeb');p('M-.15 .03Q.02 -.11 .12 .03L.22 -.05V.12L.12 .05Q.02 .18 -.15 .03Z','#efb56f');e(-.12,-.15,.04,.04,'#b7eff2',null);break;
    case 'garden':p('M-.22 -.05H.22L.16 .31H-.16Z','#b17c5d');leaf(0,-.05);leaf(-.06,-.09,-1);break;
    case 'chest':p('M-.32 -.04Q0 -.2 .32 -.04L.30 .29H-.30Z','#a66c3d','#e5c16d');l('M-.30 .07H.30','#e5c16d',.05);p('M-.06 .01H.06V.17H-.06Z','#e9cc7b');break;
    case 'scroll':p('M-.21 -.3H.21V.25H-.21Z','#e9d9b5');l('M-.13 -.17H.13M-.13 -.07H.13M-.13 .03H.1','#9a8061',.015);break;
    case 'crystalpack':p('M0 -.36L.24 -.08L.13 .26H-.13L-.24 -.08Z',g('#e1c2ff','#9870c9'));l('M0 -.33V.26M-.21 -.08H.21','#e2d5ff');break;
    case 'clockwork':gear(0,0,.30,c);gear(.21,-.22,.13,'#c5b080');break;
    case 'snowglobe':e(0,-.05,.30,.30,'#99c8dfbb','#d9f1f0');p('M-.17 .13L0 -.19L.17 .13Z','#e3f4ee');p('M-.28 .21H.28V.32H-.28Z','#787ba3');break;
    case 'octopus':e(0,-.10,.28,.27,c);e(-.10,-.12,.065,.07,'#f7e7f0');e(.10,-.12,.065,.07,'#f7e7f0');e(-.09,-.12,.03,.04,'#3f3454');e(.11,-.12,.03,.04,'#3f3454');break;
    case 'radar':case 'wings':case 'batwings':case 'butterfly':case 'cape':case 'solar':case 'guitar':case 'skateboard':case 'quiver':break;
    default:star(0,0,.18,'#e9e3bc');
   }
  }
 }
 if(head&&!['cowboy','ranger','pilot'].includes(head.id)&&layer==='front'){
  ctx.save();if(view==='side')ctx.scale(.72,1);
  const c=head.color;
  switch(head.shape){
   case 'pirate':p('M-.70 -.42Q-.48 -.48 -.39 -.74Q0 -.51 .39 -.74Q.48 -.48 .70 -.42Q.36 -.31 0 -.35Q-.36 -.31 -.70 -.42Z',g(c,'#322739'),'#d9b67a');e(0,-.48,.09,.07,'#f0dfc3');l('M-.08 -.39l.16 -.05M-.08 -.44l.16 .05','#f0dfc3');break;
   case 'wizard':p('M-.57 -.43Q-.31 -.55 -.17 -1.04Q-.02 -.91 .16 -.99Q.10 -.70 .35 -.46Z',g(c,'#453066'));e(0,-.43,.65,.10,g('#ac7fce','#594074'));star(-.08,-.71,.08,'#f4d991');break;
   case 'crown':p('M-.42 -.43L-.47 -.79L-.23 -.64L0 -.94L.23 -.64L.47 -.79L.42 -.43Z',g(c,'#a6772c'));for(const x of [-.3,0,.3])e(x,-.52,.045,.055,x?'#a7e4de':'#d6667e');break;
   case 'viking':p('M-.45 -.36Q-.48 -.76 0 -.79Q.48 -.76 .45 -.36Z',g(c,'#526274'));for(const s of [-1,1])p(`M${s*.35} -.55Q${s*.82} -.45 ${s*.75} -.95Q${s*.62} -.66 ${s*.37} -.73Z`,'#e6d1a1');l('M0 -.76V-.38','#e9dfc2',.06);break;
   case 'samurai':p('M-.57 -.34L-.44 -.64Q0 -.91 .44 -.64L.57 -.34L.34 -.39H-.34Z',g(c,'#592b41'));p('M-.3 -.66L-.44 -.95L0 -.74L.44 -.95L.3 -.66Z','#e4bf6b');for(const s of [-1,1])for(let i=0;i<3;i++)l(`M${s*.39} ${-.31+i*.09}L${s*.52} ${-.28+i*.09}`,c,.06);break;
   case 'ninja':p('M-.5 -.15Q-.61 -.72 0 -.77Q.61 -.72 .5 -.15L.33 -.24Q0 -.46 -.33 -.24Z',g(c,'#202133'));l('M-.40 -.42H.40','#be6a78',.08);p('M.4 -.42L.77 -.58L.68 -.33L.82 -.15L.42 -.28Z',c);break;
   case 'beret':p('M-.49 -.43Q-.62 -.72 -.22 -.78Q.40 -.92 .5 -.54L.36 -.40Z',g(c,'#713446'));l('M.03 -.79L.10 -.91',c,.055);break;
   case 'cap':p('M-.47 -.4Q-.48 -.81 0 -.81Q.49 -.81 .47 -.4Z',g(c,'#305a94'));p('M-.03 -.43Q.48 -.56 .68 -.40L.43 -.28Z','#4875b7');l('M0 -.77V-.45','#9ac6ed');break;
   case 'beanie':p('M-.46 -.4Q-.48 -.9 0 -.9Q.48 -.9 .46 -.4Z',g(c,'#924b5c'));p('M-.48 -.48Q0 -.37 .48 -.48V-.34Q0 -.23 -.48 -.34Z',c);e(0,-.92,.12,.10,'#eacba3');for(const x of [-.25,0,.25])l(`M${x} -.72V-.52`,'#ffd6be88',.014);break;
   case 'tophat':p('M-.34 -.45L-.39 -.98Q0 -1.08 .39 -.98L.34 -.45Z',g(c,'#252c43'));e(0,-.44,.62,.10,'#444766');l('M-.34 -.56Q0 -.48 .34 -.56','#b669a3',.09);break;
   case 'chef':p('M-.35 -.42V-.73Q-.62 -.77 -.45 -.96Q-.25 -1.1 -.15 -.91Q0 -1.18 .20 -.96Q.47 -1.09 .53 -.86Q.58 -.71 .35 -.68V-.42Z',g(c,'#b5b8bf'));l('M-.32 -.54H.32','#c0c4cd');break;
   case 'cactus':p('M-.16 -.43V-.97Q0 -1.13 .16 -.97V-.43Z',g(c,'#38775c'));p('M-.16 -.63Q-.45 -.58 -.43 -.86H-.30Q-.30 -.75 -.16 -.78M.16 -.79Q.31 -.74 .31 -.94H.45Q.49 -.62 .16 -.65Z',c);for(const x of [-.07,.06])l(`M${x} -.94V-.51`,'#b5dd96',.014);e(.11,-1,.08,.06,'#e9a3b9');break;
   case 'cat':case 'fox':for(const s of [-1,1]){p(`M${s*.1} -.45L${s*.39} -.91L${s*.54} -.38Z`,g(c));p(`M${s*.27} -.48L${s*.39} -.76L${s*.46} -.43Z`,head.shape==='fox'?'#f4d3ae':'#eeb8d6',null)}break;
   case 'bunny':for(const s of [-1,1]){e(s*.26,-.77,.115,.37,g(c,'#838bad'));e(s*.26,-.78,.052,.25,'#d29ac1',null)}break;
   case 'dragon':p('M-.45 -.39Q0 -.92 .45 -.39L.26 -.37L0 -.58L-.26 -.37Z',g(c));for(let i=0;i<3;i++)p(`M${-.24+i*.24} -.55l.05 -.30 .12 .26Z`,'#edc77e');break;
   case 'antlers':for(const s of [-1,1]){l(`M${s*.28} -.44Q${s*.40} -.65 ${s*.60} -1.04`,c,.065);l(`M${s*.45} -.75L${s*.26} -.97M${s*.49} -.86L${s*.75} -.86`,c,.045)}break;
   case 'halo':ctx.shadowColor=c;ctx.shadowBlur=w*.20;e(0,-.86,.40,.095,'#0000',c);ctx.shadowBlur=0;break;
   case 'headphones':l('M-.48 -.04V-.43Q0 -.95 .48 -.43V-.04',c,.08);for(const s of [-1,1]){e(s*.47,-.10,.13,.22,g(c));l(`M${s*.49} -.23V.03`,'#b5f2ef',.025)}break;
   case 'goggles':l('M-.48 -.37H.48','#654b3a',.09);for(const s of [-1,1]){e(s*.21,-.39,.18,.14,c);e(s*.21,-.39,.125,.095,'#64b9d0');l(`M${s*.22-.05} -.43l.08 -.02`,'#d0ffff',.02)}break;
   case 'diver':p('M-.51 -.24Q-.59 -.8 0 -.86Q.59 -.8 .51 -.24L.36 -.22Q0 -.59 -.36 -.22Z',g(c,'#756044'));e(0,-.5,.12,.08,'#68d2d5');for(const s of [-1,1]){e(s*.47,-.11,.11,.16,c);l(`M${s*.52} -.13L${s*.67} .15`,'#b6b699',.06)}break;
   case 'knight':p('M-.49 -.23Q-.59 -.74 0 -.83Q.59 -.74 .49 -.23L.36 -.23Q0 -.50 -.36 -.23Z',g(c,'#5a6d85'));p('M-.05 -.78V-.42H.05V-.78Z','#d1dce6');for(const s of [-1,1])p(`M${s*.38} -.3L${s*.55} -.23L${s*.47} .19L${s*.34} .10Z`,c);break;
   case 'spartan':p('M-.47 -.32Q-.56 -.75 0 -.77Q.56 -.75 .47 -.32L.3 -.25Q0 -.52 -.3 -.25Z',g(c,'#78603b'));p('M-.15 -.74Q-.40 -1.13 .04 -1.11Q.47 -1.04 .40 -.73Z','#b74b5a');break;
   case 'ufo':e(0,-.55,.66,.13,g(c));p('M-.32 -.58Q-.26 -1.07 .26 -.89Q.36 -.77 .32 -.58Z','#a6e3e780','#d1f6eb');for(const x of [-.42,-.20,.20,.42])e(x,-.54,.04,.025,'#f8df7f',null);break;
   case 'flower':for(let i=0;i<6;i++){const x=(i-2.5)*.17,y=-.43-Math.sin(i/5*Math.PI)*.12;for(let a=0;a<5;a++)e(x+Math.cos(a*1.256)*.07,y+Math.sin(a*1.256)*.07,.055,.05,i%2?'#f0b9d1':'#eed3a0');e(x,y,.035,.035,'#e6b74c',null)}break;
   case 'crystal':for(const [x,y] of [[0,-.94],[-.24,-.72],[.24,-.72]]){p(`M${x} ${y}l.12 .2 -.06 .25h-.12l-.06 -.25Z`,g(c,'#8065b5'));l(`M${x} ${y+.04}v.35`,'#d7f0ff',.017)}break;
   case 'pharaoh':p('M-.48 .03L-.49 -.63Q0 -.94 .49 -.63L.48 .03L.34 -.12L.28 -.50H-.28L-.34 -.12Z',g(c,'#a37b42'));for(const s of [-1,1])for(let i=0;i<5;i++)l(`M${s*.36} ${-.48+i*.09}L${s*.48} ${-.45+i*.09}`,'#375d86',.035);p('M0 -.86L.06 -.68L0 -.56L-.06 -.68Z','#65b8ce');break;
  }
  ctx.restore();
 }
 ctx.restore();
}
