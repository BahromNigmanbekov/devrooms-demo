import {useEffect,useRef} from 'react';
import {Renderer} from '../../engine/render/Renderer.js';
export default function RobotPreview({color, equipment, back=false}) {
 const ref=useRef(null);
 useEffect(()=>{const c=ref.current.getContext('2d');c.clearRect(0,0,320,320);c.save();c.scale(4,4);const armed=equipment?.weapon&&equipment.weapon!=='none';new Renderer(c).drawPlayer({x:armed?30:40,y:armed?45:49,radius:armed?14:17.5,color,equipment,facing:{x:0,y:back?-1:1},moving:false});c.restore();},[color,equipment,back]);
 return <canvas ref={ref} width="320" height="320" aria-label={back?'Robotning orqa ko‘rinishi':'Robot ko‘rinishi'}/>;
}
