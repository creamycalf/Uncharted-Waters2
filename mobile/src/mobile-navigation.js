(function(root){'use strict';
 const bounds={left:100,top:48,right:480,bottom:430};
 function rgb(f,x,y){const i=(Math.round(y)*f.width+Math.round(x))*4;return (f.data[i]<<16)|(f.data[i+1]<<8)|f.data[i+2];}
 function locate(f,hint={x:304,y:300}){
  if(f.width!==640||f.height!==480)return null;const seen=new Uint8Array(640*480),candidates=[];
  function skin(x,y){const p=rgb(f,x,y),r=p>>>16,g=(p>>>8)&255,b=p&255;return r>230&&g>145&&g<180&&b>75&&b<120;}
  for(let y=50;y<410;y++)for(let x=104;x<474;x++){
   const key=y*640+x;if(seen[key]||!skin(x,y))continue;const q=[[x,y]];seen[key]=1;let minx=x,maxx=x,miny=y,maxy=y;
   for(let n=0;n<q.length;n++){const [a,b]=q[n];minx=Math.min(minx,a);maxx=Math.max(maxx,a);miny=Math.min(miny,b);maxy=Math.max(maxy,b);for(const [xx,yy] of [[a-1,b],[a+1,b],[a,b-1],[a,b+1]]){const k=yy*640+xx;if(xx>=100&&xx<480&&yy>=48&&yy<430&&!seen[k]&&skin(xx,yy)){seen[k]=1;q.push([xx,yy]);}}}
   if(q.length<12||maxx-minx>13||maxy-miny>13||maxy-miny<3)continue;
   const cx=(minx+maxx)/2;let blue=0,red=0;
   for(let yy=Math.max(48,miny-7);yy<Math.min(430,maxy+20);yy++)for(let xx=Math.floor(cx)-8;xx<=cx+8;xx++){const p=rgb(f,xx,yy),r=p>>>16,g=(p>>>8)&255,b=p&255;if(b>190&&r<40&&g>=50&&g<180&&yy>maxy)blue++;if(r>180&&g>35&&g<110&&b<40&&yy<=maxy+2)red++;}
   if(blue>=12&&red>=8){const p={x:Math.round(cx/16)*16,y:12+Math.round((maxy+4)/16)*16};p.score=Math.hypot(p.x-hint.x,p.y-hint.y);if(p.score<190)candidates.push(p);}
  }
  // Facing north hides the face; retain the red hair / blue clothing silhouette.
  seen.fill(0);function hair(x,y){const p=rgb(f,x,y),r=p>>>16,g=(p>>>8)&255,b=p&255;return r>190&&g>45&&g<90&&b<30;}
  for(let y=50;y<410;y++)for(let x=104;x<474;x++){
   const key=y*640+x;if(seen[key]||!hair(x,y))continue;const q=[[x,y]];seen[key]=1;let minx=x,maxx=x,miny=y,maxy=y;
   for(let n=0;n<q.length;n++){const [a,b]=q[n];minx=Math.min(minx,a);maxx=Math.max(maxx,a);miny=Math.min(miny,b);maxy=Math.max(maxy,b);for(const [xx,yy] of [[a-1,b],[a+1,b],[a,b-1],[a,b+1]]){const k=yy*640+xx;if(xx>=100&&xx<480&&yy>=48&&yy<430&&!seen[k]&&hair(xx,yy)){seen[k]=1;q.push([xx,yy]);}}}
   if(q.length<12||q.length>110||maxx-minx<4||maxx-minx>14||maxy-miny>13)continue;const cx=(minx+maxx)/2;let blue=0;
   for(let yy=maxy+2;yy<Math.min(430,miny+26);yy++)for(let xx=Math.floor(cx)-6;xx<=cx+6;xx++){const p=rgb(f,xx,yy),r=p>>>16,g=(p>>>8)&255,b=p&255;if(b>190&&r<40&&g>=50&&g<180)blue++;}
   if(blue<16)continue;const p={x:Math.round(cx/16)*16,y:12+Math.round((miny+16)/16)*16};p.score=Math.hypot(p.x-hint.x,p.y-hint.y)+3;if(p.score<190)candidates.push(p);
  }
  candidates.sort((a,b)=>a.score-b.score);return candidates[0]||null;
 }
 function ground(f,x,y){let green=0,sand=0,brown=0,black=0,red=0,blue=0,gray=0,total=0;
  if(x<108||x>472||y<56||y>422)return false;
  for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){const p=rgb(f,x+dx,y+dy),r=p>>>16,g=(p>>>8)&255,b=p&255;total++;if(g>90&&r<30&&b>=65&&b<125)green++;if(r>210&&g>165&&b>=65)sand++;if(r>=140&&r<190&&g>75&&g<120&&b<25)brown++;if(r<30&&g<30&&b<30)black++;if(r>180&&g<110&&b<50)red++;if(b>160&&b>r*1.4)blue++;if(r>=90&&r<160&&g>=90&&g<160&&b>120)gray++;}
  return green/total>.75||(green/total>.2&&(green+sand+brown+black)/total>.93&&red/total<.04)||(sand/total>.78&&red/total<.04)||(brown/total>.18&&black/total>.18&&red/total<.04&&blue/total<.14&&gray/total<.18&&(brown+black+sand)/total>.72);
 }
 function map(f,start){const origin={x:start.x-Math.floor((start.x-108)/16)*16,y:start.y-Math.floor((start.y-56)/16)*16},width=Math.floor((472-origin.x)/16)+1,height=Math.floor((422-origin.y)/16)+1,cells=new Uint8Array(width*height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)cells[y*width+x]=ground(f,origin.x+x*16,origin.y+y*16)?1:0;
  const startCell={x:Math.round((start.x-origin.x)/16),y:Math.round((start.y-origin.y)/16)};cells[startCell.y*width+startCell.x]=1;return {origin,width,height,cells,start:startCell};
 }
 function path(grid,start,target){const {width:w,height:h,cells}=grid;const key=p=>p.y*w+p.x,valid=p=>p.x>=0&&p.x<w&&p.y>=0&&p.y<h&&cells[key(p)];if(!valid(start)||!valid(target))return null;
  const from=new Int32Array(w*h).fill(-1),q=[key(start)],end=key(target);from[q[0]]=q[0];
  for(let i=0;i<q.length&&from[end]<0;i++){const k=q[i],x=k%w,y=Math.floor(k/w);for(const p of [{x:x+1,y},{x:x-1,y},{x,y:y+1},{x,y:y-1}])if(valid(p)&&from[key(p)]<0){from[key(p)]=k;q.push(key(p));}}
  if(from[end]<0)return null;const route=[];for(let k=end;k!==key(start);k=from[k])route.push({x:k%w,y:Math.floor(k/w)});return route.reverse();
 }
 // Register the scrolling map using non-water edges; the avatar and sea animation
 // occupy only a small part of the sampled background.
 function scroll(a,b){let best={x:0,y:0,score:-1};for(const dy of [-32,-16,0,16,32])for(const dx of [-32,-16,0,16,32]){let same=0,total=0;for(let y=84;y<390;y+=5)for(let x=140;x<440;x+=5){const p=rgb(a,x,y),edge=rgb(a,x+2,y+2);if((p&255)>(p>>>16)*1.5||p===edge)continue;const n=rgb(b,x+dx,y+dy);total++;if(p===n)same++;}const score=total?same/total:0;if(score>best.score+.005||(Math.abs(score-best.score)<.005&&Math.abs(dx)+Math.abs(dy)<Math.abs(best.x)+Math.abs(best.y)))best={x:dx,y:dy,score};}return best;}
 root.K2MobileNavigation={locate,ground,map,path,scroll,bounds};if(typeof module!=='undefined')module.exports=root.K2MobileNavigation;
})(typeof window==='undefined'?globalThis:window);
