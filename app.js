(function(){
  'use strict';
  const D=window.KORTEMME_DATA, R=D.residues;
  const ns='http://www.w3.org/2000/svg';
  const morph=document.getElementById('morphViz'), contact=document.getElementById('contactViz');
  const slider=document.getElementById('stateSlider'), stateLabel=document.getElementById('stateLabel');
  const search=document.getElementById('residueSearch'), list=document.getElementById('residueList');
  const tip=document.getElementById('tip');
  let selected=R.findIndex(r=>r.residue===89);

  function el(tag,attrs,parent){const n=document.createElementNS(ns,tag);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,v));if(parent)parent.appendChild(n);return n}
  function htmlEscape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function parseResidue(value){const m=String(value).toUpperCase().match(/(\d{1,3})/);if(!m)return -1;const num=+m[1];return R.findIndex(r=>r.residue===num)}
  function showTip(evt,text){tip.innerHTML=text;tip.style.display='block';tip.style.left=(evt.clientX+12)+'px';tip.style.top=(evt.clientY+12)+'px'}
  function hideTip(){tip.style.display='none'}
  R.forEach(r=>{const o=document.createElement('option');o.value=r.aa1+r.residue;o.label=r.residue+' - '+r.aa3;list.appendChild(o)});

  function fit(points,w,h,pad){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);const s=Math.min((w-2*pad)/(maxX-minX),(h-2*pad)/(maxY-minY));return p=>[pad+(p[0]-minX)*s,h-pad-(p[1]-minY)*s]}
  const all2d=R.flatMap(r=>[r.state1_2d,r.state2_2d]);const map=fit(all2d,680,430,34);
  function pathFor(points){return points.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}

  function drawMorph(){
    const t=+slider.value/100; morph.innerHTML='';
    const p1=R.map(r=>map(r.state1_2d)),p2=R.map(r=>map(r.state2_2d));
    const now=R.map((r,i)=>[p1[i][0]*(1-t)+p2[i][0]*t,p1[i][1]*(1-t)+p2[i][1]*t]);
    el('path',{d:pathFor(p1),fill:'none',stroke:'#3b5ccc','stroke-width':2,opacity:.18},morph);
    el('path',{d:pathFor(p2),fill:'none',stroke:'#d64f86','stroke-width':2,opacity:.18},morph);
    const color=t<.5?'#3b5ccc':'#d64f86';
    el('path',{d:pathFor(now),fill:'none',stroke:color,'stroke-width':4,'stroke-linejoin':'round','stroke-linecap':'round'},morph);
    now.forEach((p,i)=>{const c=el('circle',{cx:p[0],cy:p[1],r:i===selected?7:2.7,fill:i===selected?'#e3a008':color,stroke:i===selected?'#6d5000':'none','stroke-width':1.5},morph);c.style.cursor='pointer';c.addEventListener('click',()=>{selected=i;search.value=R[i].aa1+R[i].residue;drawAll()});c.addEventListener('mousemove',e=>showTip(e,'<b>'+R[i].aa3+' '+R[i].residue+'</b><br>'+R[i].displacement.toFixed(2)+' Å displacement'));c.addEventListener('mouseleave',hideTip)});
    const r=R[selected],p=now[selected];el('text',{x:Math.min(625,p[0]+10),y:Math.max(18,p[1]-10),fill:'#705200','font-size':13,'font-family':'system-ui'},morph).textContent=r.aa1+r.residue;
    stateLabel.textContent=t===0?'State 1':t===1?'State 2':Math.round(t*100)+'% toward state 2';
    document.getElementById('morphReadout').innerHTML='<b>'+r.aa3+' '+r.residue+'</b> moves '+r.displacement.toFixed(2)+' Å after global alignment. It participates in '+(r.state1_lost+r.state2_gained)+' state-specific contacts ('+r.state1_lost+' state 1-only, '+r.state2_gained+' state 2-only).'+(r.residue>=68&&r.residue<=74?' <span class="pill">68-74 focus segment</span>':'');
  }

  function drawContacts(){
    contact.innerHTML='';const W=680,H=340,left=38,right=16,top=28,bottom=42,mid=(top+H-bottom)/2,max=Math.max(...R.map(r=>Math.max(r.state2_gained,r.state1_lost)),1);const bw=(W-left-right)/R.length;
    el('line',{x1:left,y1:mid,x2:W-right,y2:mid,stroke:'#9aa4b5','stroke-width':1},contact);
    [0,2,4,6].filter(v=>v<=max).forEach(v=>{const y1=mid-v/max*(mid-top),y2=mid+v/max*(H-bottom-mid);el('line',{x1:left,y1:y1,x2:W-right,y2:y1,stroke:'#e2e6ee'},contact);if(v){el('line',{x1:left,y1:y2,x2:W-right,y2:y2,stroke:'#e2e6ee'},contact)}const tx=el('text',{x:left-8,y:y1+4,'text-anchor':'end',fill:'#7a8495','font-size':11,'font-family':'system-ui'},contact);tx.textContent=v;if(v){const tb=el('text',{x:left-8,y:y2+4,'text-anchor':'end',fill:'#7a8495','font-size':11,'font-family':'system-ui'},contact);tb.textContent='-'+v}});
    R.forEach((r,i)=>{const x=left+i*bw+.6,w=Math.max(1,bw-1.1),up=r.state2_gained/max*(mid-top),down=r.state1_lost/max*(H-bottom-mid);const g=el('g',{},contact);el('rect',{x,y:mid-up,width:w,height:up,fill:r.residue>=68&&r.residue<=74?'#e98bb1':'#d64f86'},g);el('rect',{x,y:mid,width:w,height:down,fill:r.residue>=68&&r.residue<=74?'#7790e0':'#3b5ccc'},g);const hit=el('rect',{x,y:top,width:Math.max(4,bw),height:H-bottom-top,fill:'transparent'},g);hit.style.cursor='pointer';hit.addEventListener('click',()=>{selected=i;search.value=r.aa1+r.residue;drawAll()});hit.addEventListener('mousemove',e=>showTip(e,'<b>'+r.aa3+' '+r.residue+'</b><br>state 2-only: '+r.state2_gained+'<br>state 1-only: '+r.state1_lost));hit.addEventListener('mouseleave',hideTip)});
    [5,20,40,60,80,94].forEach(n=>{const i=R.findIndex(r=>r.residue===n);if(i<0)return;const x=left+(i+.5)*bw;const t=el('text',{x,y:H-16,'text-anchor':'middle',fill:'#687285','font-size':11,'font-family':'system-ui'},contact);t.textContent=n});
    const bandStart=R.findIndex(r=>r.residue===68),bandEnd=R.findIndex(r=>r.residue===74);if(bandStart>=0){el('rect',{x:left+bandStart*bw,y:top,width:(bandEnd-bandStart+1)*bw,height:H-bottom-top,fill:'none',stroke:'#e3a008','stroke-width':1.5,'stroke-dasharray':'4 3'},contact)}
    const r=R[selected];document.getElementById('contactReadout').innerHTML='<b>'+r.aa3+' '+r.residue+'</b>: '+r.state2_gained+' contacts appear only in state 2 and '+r.state1_lost+' appear only in state 1. Across the protein, 134 contacts are shared and 44 are state-specific.';
  }
  function drawAll(){drawMorph();drawContacts()}
  slider.addEventListener('input',drawMorph);document.getElementById('inspectButton').addEventListener('click',()=>{const i=parseResidue(search.value);if(i>=0){selected=i;drawAll()}else{document.getElementById('morphReadout').innerHTML='<b>Residue not found.</b> Choose a position from 5 through 94.'}});search.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('inspectButton').click()});
  drawAll();
})();
