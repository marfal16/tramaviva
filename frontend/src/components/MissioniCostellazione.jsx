import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass }     from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ChevronLeft, Gift, Lock } from "lucide-react";

const STAR_POSITIONS = [
  [-2.2,  1.1], [-0.7,  1.8], [ 0.8,  1.3], [ 2.3,  1.9], [ 2.9,  0.3],
  [ 1.6, -0.9], [ 0.2, -1.6], [-1.3, -1.4], [-2.5, -0.4], [ 0.4,  0.1],
];

// Colori realistici: stelle bianche/bianco-calde/spente
const COLOR_DONE      = new THREE.Color(0xfff7e8); // bianco caldo (tipo G/F)
const COLOR_AVAILABLE = new THREE.Color(0xeaf2ff); // bianco freddo (tipo B/A)
const COLOR_LOCKED    = new THREE.Color(0x0d1825); // quasi spenta

// ── Texture stellare Gaussian con o senza diffraction spikes ─────────────────
function makeStarTex(spiked, size = 128) {
  const c   = document.createElement("canvas");
  c.width   = c.height = size;
  const ctx = c.getContext("2d");
  const h   = size / 2;

  const g = ctx.createRadialGradient(h, h, 0, h, h, h);
  g.addColorStop(0,    "rgba(255,255,255,1)");
  g.addColorStop(0.04, "rgba(255,255,255,0.95)");
  g.addColorStop(0.12, "rgba(255,255,255,0.65)");
  g.addColorStop(0.35, "rgba(255,255,255,0.18)");
  g.addColorStop(0.65, "rgba(255,255,255,0.04)");
  g.addColorStop(1,    "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  if (spiked) {
    [0, Math.PI / 2].forEach(angle => {
      ctx.save();
      ctx.translate(h, h);
      ctx.rotate(angle);
      const sg = ctx.createLinearGradient(-h, 0, h, 0);
      sg.addColorStop(0,    "rgba(255,255,255,0)");
      sg.addColorStop(0.28, "rgba(255,255,255,0.08)");
      sg.addColorStop(0.46, "rgba(255,255,255,0.38)");
      sg.addColorStop(0.5,  "rgba(255,255,255,0.85)");
      sg.addColorStop(0.54, "rgba(255,255,255,0.38)");
      sg.addColorStop(0.72, "rgba(255,255,255,0.08)");
      sg.addColorStop(1,    "rgba(255,255,255,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(-h, -0.7, size, 1.4);
      ctx.restore();
    });
  }
  return new THREE.CanvasTexture(c);
}

// ── Texture galassia ellittica fuzzy ─────────────────────────────────────────
function makeGalaxyTex(r, g, b) {
  const c   = document.createElement("canvas");
  c.width   = 256; c.height = 128;
  const ctx = c.getContext("2d");
  const grd = ctx.createRadialGradient(128, 64, 0, 128, 64, 90);
  grd.addColorStop(0,    `rgba(${r},${g},${b},0.9)`);
  grd.addColorStop(0.2,  `rgba(${r},${g},${b},0.5)`);
  grd.addColorStop(0.55, `rgba(${r},${g},${b},0.15)`);
  grd.addColorStop(1,    `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 256, 128);
  return new THREE.CanvasTexture(c);
}

// Distribuzione cromatica realistica (spettro O/B/A/F/G/K/M)
const PALETTE = (() => {
  const out = [];
  [[0xffffff,28],[0xdde8ff,22],[0xeef1ff,18],
   [0xfff5d0,12],[0xffe8a0,8],[0xffd070,6],
   [0xffb050,3],[0xff7040,2],[0xff4030,1]]
  .forEach(([hex,w]) => { for(let i=0;i<w;i++) out.push(new THREE.Color(hex)); });
  return out;
})();

export const MissioniCostellazione = ({ missionsData, onBack }) => {
  const canvasRef = useRef();
  const labelsRef = useRef();
  const stateRef  = useRef({
    camera: null, renderer: null, composer: null,
    meshes: [], hitMeshes: [],
    panOffset: {x:0,y:0}, targetPan: {x:0,y:0},
    zoom: 7, targetZoom: 7,
    isDragging: false, mouseDownX:0, mouseDownY:0,
    panAtDown: {x:0,y:0}, hasDragged: false,
    pinchDist: null, touchStartX:0, touchStartY:0,
    touchPanAtDown: {x:0,y:0}, touchHasDragged: false,
    frameId: null,
  });

  const [selected, setSelected]   = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const missions = missionsData?.missions || [];
  const isMob    = window.innerWidth < 768;

  useEffect(() => {
    const canvas = canvasRef.current;
    const W = window.innerWidth, H = window.innerHeight;
    const s = stateRef.current;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W/H, 0.1, 500);
    camera.position.set(0, 0, 7);
    s.camera = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000);
    renderer.toneMapping        = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    s.renderer = renderer;

    // Textures
    const starTex  = makeStarTex(false, 64);
    const spikeTex = makeStarTex(true,  256);

    // ── Stelle sfondo ─────────────────────────────────────────────────────────
    const N   = isMob ? 3500 : 5500;
    const bPos = new Float32Array(N*3);
    const bCol = new Float32Array(N*3);
    for (let i=0; i<N; i++) {
      bPos[i*3]   = (Math.random()-0.5)*140;
      bPos[i*3+1] = (Math.random()-0.5)*140;
      bPos[i*3+2] = (Math.random()-0.5)*50 - 10;
      const col    = PALETTE[Math.floor(Math.random()*PALETTE.length)];
      const bright = 0.35 + Math.random()*0.65;
      bCol[i*3]=col.r*bright; bCol[i*3+1]=col.g*bright; bCol[i*3+2]=col.b*bright;
    }
    const bGeo = new THREE.BufferGeometry();
    bGeo.setAttribute("position", new THREE.BufferAttribute(bPos,3));
    bGeo.setAttribute("color",    new THREE.BufferAttribute(bCol,3));
    const bgStars = new THREE.Points(bGeo, new THREE.PointsMaterial({
      size: isMob ? 0.2 : 0.16, map: starTex, vertexColors: true,
      transparent: true, opacity: 1, sizeAttenuation: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    scene.add(bgStars);

    // ── Via Lattea ────────────────────────────────────────────────────────────
    const mwN  = isMob ? 1500 : 2800;
    const mwPos = new Float32Array(mwN*3);
    const mwCol = new Float32Array(mwN*3);
    for (let i=0; i<mwN; i++) {
      const t  = (Math.random()-0.5)*Math.PI*1.8;
      const r  = 8 + Math.random()*45;
      const sp = (Math.random()-0.5)*8;
      const x  = Math.cos(t)*r;
      const z  = Math.sin(t)*r - 15;
      mwPos[i*3]   = x;
      mwPos[i*3+1] = sp*0.28 + z*0.08;    // banda inclinata ~25°
      mwPos[i*3+2] = z;
      const br = 0.12 + Math.random()*0.38;
      mwCol[i*3]=br*0.78; mwCol[i*3+1]=br*0.86; mwCol[i*3+2]=br;
    }
    const mwGeo = new THREE.BufferGeometry();
    mwGeo.setAttribute("position", new THREE.BufferAttribute(mwPos,3));
    mwGeo.setAttribute("color",    new THREE.BufferAttribute(mwCol,3));
    scene.add(new THREE.Points(mwGeo, new THREE.PointsMaterial({
      size:0.11, map: starTex, vertexColors: true, transparent: true,
      opacity:0.85, sizeAttenuation: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })));

    // ── Galassie sprite ───────────────────────────────────────────────────────
    [
      { rgb:[160,180,255], pos:[12,-7,-22], sx:16, sy:7,  rot:0.4,  op:0.6 },
      { rgb:[190,165,255], pos:[-15,8,-28], sx:10, sy:12, rot:-0.7, op:0.5 },
      { rgb:[200,195,230], pos:[4,-13,-18], sx:7,  sy:4,  rot:1.2,  op:0.45 },
    ].forEach(({ rgb:[r,g,b], pos, sx, sy, rot, op }) => {
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeGalaxyTex(r,g,b), transparent: true, opacity: op,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      spr.scale.set(sx, sy, 1);
      spr.position.set(...pos);
      spr.material.rotation = rot;
      scene.add(spr);
    });

    // ── Nebulose ──────────────────────────────────────────────────────────────
    [
      { col:[0.55,0.20,0.80], pos:[-6, 3,-11], n:280, sp:[12,5,2], op:0.22 },
      { col:[0.12,0.32,0.85], pos:[ 7,-5, -9], n:230, sp:[ 9,7,2], op:0.20 },
      { col:[0.78,0.24,0.32], pos:[-2,-7, -8], n:180, sp:[ 8,4,2], op:0.16 },
      { col:[0.24,0.70,0.55], pos:[ 5, 5,-13], n:160, sp:[ 7,5,2], op:0.13 },
    ].forEach(({ col, pos, n, sp, op }) => {
      const p = new Float32Array(n*3);
      for(let i=0;i<n;i++){p[i*3]=(Math.random()-0.5)*sp[0];p[i*3+1]=(Math.random()-0.5)*sp[1];p[i*3+2]=(Math.random()-0.5)*sp[2];}
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(p,3));
      const np = new THREE.Points(g, new THREE.PointsMaterial({
        color: new THREE.Color(...col), size:0.55, map: starTex,
        transparent: true, opacity: op, sizeAttenuation: true,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      np.position.set(...pos);
      scene.add(np);
    });

    // ── Stelle missione (Sprite con spike) ────────────────────────────────────
    const meshes=[], hitMeshes=[];
    missions.forEach((m, i) => {
      const [x,y] = STAR_POSITIONS[i % STAR_POSITIONS.length];
      const done      = m.unlocked && m.current_count >= m.required_events;
      const available = m.unlocked && !done;
      const locked    = !m.unlocked;
      const color     = done ? COLOR_DONE : available ? COLOR_AVAILABLE : COLOR_LOCKED;
      const sz        = done ? 1.3 : available ? 0.85 : 0.28; // solo dimensione distingue gli stati

      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: locked ? starTex : spikeTex,
        color, blending: THREE.AdditiveBlending,
        transparent: true, opacity: locked ? 0.10 : done ? 1.0 : 0.78,
        depthWrite: false,
      }));
      sprite.scale.set(sz, sz, 1);
      sprite.position.set(x, y, 0.01);
      sprite.userData = { mission: m, done, available, locked, sz };
      scene.add(sprite);
      meshes.push(sprite);

      // Alone pulsante (non-locked)
      if (!locked) {
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({
          map: starTex, color,
          blending: THREE.AdditiveBlending, transparent: true,
          opacity: done ? 0.14 : 0.08, depthWrite: false,
        }));
        halo.scale.set(sz*4, sz*4, 1);
        halo.position.set(x, y, 0);
        scene.add(halo);
        sprite.userData.halo = halo;
      }

      // Hit sphere invisibile per raycasting
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(isMob ? 0.52 : 0.32, 6, 6),
        new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false })
      );
      hit.position.set(x, y, 0);
      hit.userData = sprite.userData;
      scene.add(hit);
      hitMeshes.push(hit);
    });
    s.meshes    = meshes;
    s.hitMeshes = hitMeshes;

    // ── Linee costellazione ───────────────────────────────────────────────────
    if (missions.length >= 2) {
      const pts = missions.map((_,i) => { const [x,y]=STAR_POSITIONS[i%STAR_POSITIONS.length]; return new THREE.Vector3(x,y,0); });
      scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color:0xaaccee, transparent:true, opacity:0.06 })
      ));
    }

    // ── EffectComposer + UnrealBloomPass ──────────────────────────────────────
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(isMob ? W/2 : W, isMob ? H/2 : H),
      isMob ? 0.55 : 0.75,  // strength — contenuto, non neon
      0.55,                  // radius
      0.22,                  // threshold — solo le stelle più luminose
    ));
    s.composer = composer;

    // ── Label DOM helper ──────────────────────────────────────────────────────
    const updateLabelDOM = () => {
      const container = labelsRef.current;
      if (!container) return;
      camera.updateMatrixWorld(true);
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      const ww = window.innerWidth, hh = window.innerHeight;
      const off = isMob ? 22 : 28;
      meshes.forEach((sprite, i) => {
        const el = container.children[i];
        if (!el) return;
        const v = sprite.position.clone().project(camera);
        el.style.left = ((v.x*0.5+0.5)*ww) + "px";
        el.style.top  = ((-v.y*0.5+0.5)*hh - off) + "px";
      });
    };

    // ── Raycasting ────────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pick = (cx, cy) => {
      const rect = canvas.getBoundingClientRect();
      raycaster.setFromCamera({ x:((cx-rect.left)/rect.width)*2-1, y:-(((cy-rect.top)/rect.height)*2-1) }, camera);
      const hits = raycaster.intersectObjects(hitMeshes);
      return hits.length > 0 ? hits[0].object.userData.mission : null;
    };

    const clampPan = () => { const lim=4; s.targetPan.x=Math.max(-lim,Math.min(lim,s.targetPan.x)); s.targetPan.y=Math.max(-lim,Math.min(lim,s.targetPan.y)); };

    // ── Animation loop ────────────────────────────────────────────────────────
    let t = 0;
    const animate = () => {
      s.frameId = requestAnimationFrame(animate);
      t += 0.01;

      s.panOffset.x += (s.targetPan.x-s.panOffset.x)*0.08;
      s.panOffset.y += (s.targetPan.y-s.panOffset.y)*0.08;
      s.zoom        += (s.targetZoom-s.zoom)*0.08;
      camera.position.set(s.panOffset.x, s.panOffset.y, s.zoom);
      camera.lookAt(s.panOffset.x, s.panOffset.y, 0);

      bgStars.rotation.y = Math.sin(t*0.025)*0.03;
      bgStars.rotation.x = Math.cos(t*0.018)*0.015;

      meshes.forEach((sprite, i) => {
        if (!sprite.userData.locked) {
          const pulse = 1 + Math.sin(t + i*1.4)*0.1;
          const { sz } = sprite.userData;
          sprite.scale.setScalar(sz * pulse);
          const h = sprite.userData.halo;
          if (h) {
            h.scale.setScalar(sz*4*(1+Math.sin(t+i*1.4)*0.2));
            h.material.opacity = (sprite.userData.done ? 0.14 : 0.08) + Math.sin(t+i*1.4)*0.04;
          }
        }
      });

      composer.render();
      updateLabelDOM();
    };
    animate();

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w=window.innerWidth, h=window.innerHeight;
      camera.aspect=w/h; camera.updateProjectionMatrix();
      renderer.setSize(w,h); composer.setSize(w,h);
    };
    window.addEventListener("resize", onResize);

    // ── Mouse ─────────────────────────────────────────────────────────────────
    const onMouseDown = (e) => { s.isDragging=true; s.hasDragged=false; s.mouseDownX=e.clientX; s.mouseDownY=e.clientY; s.panAtDown={x:s.targetPan.x,y:s.targetPan.y}; };
    const onMouseMove = (e) => {
      if (!s.isDragging) return;
      const dx=e.clientX-s.mouseDownX, dy=e.clientY-s.mouseDownY;
      if(Math.abs(dx)>3||Math.abs(dy)>3) s.hasDragged=true;
      const f=s.zoom/window.innerWidth*1.8;
      s.targetPan.x=s.panAtDown.x-dx*f; s.targetPan.y=s.panAtDown.y+dy*f; clampPan();
    };
    const onMouseUp = (e) => {
      if(!s.isDragging) return; s.isDragging=false;
      if(!s.hasDragged){ const m=pick(e.clientX,e.clientY); if(m){setSelected(m);setPanelOpen(true);}else{setPanelOpen(false);setTimeout(()=>setSelected(null),300);} }
    };
    const onWheel = (e) => { e.preventDefault(); s.targetZoom=Math.max(3.5,Math.min(14,s.targetZoom+e.deltaY*0.01)); };

    // ── Touch ─────────────────────────────────────────────────────────────────
    const getTD = (ts) => Math.hypot(ts[0].clientX-ts[1].clientX, ts[0].clientY-ts[1].clientY);
    const onTouchStart = (e) => {
      if(e.touches.length===1){ s.touchStartX=e.touches[0].clientX; s.touchStartY=e.touches[0].clientY; s.touchPanAtDown={x:s.targetPan.x,y:s.targetPan.y}; s.touchHasDragged=false; s.pinchDist=null; }
      else if(e.touches.length===2) s.pinchDist=getTD(e.touches);
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      if(e.touches.length===1){ const dx=e.touches[0].clientX-s.touchStartX,dy=e.touches[0].clientY-s.touchStartY; if(Math.abs(dx)>6||Math.abs(dy)>6)s.touchHasDragged=true; const f=s.zoom/window.innerWidth*2.5; s.targetPan.x=s.touchPanAtDown.x-dx*f; s.targetPan.y=s.touchPanAtDown.y+dy*f; clampPan(); }
      else if(e.touches.length===2&&s.pinchDist!==null){ const d=getTD(e.touches); s.targetZoom=Math.max(3.5,Math.min(14,s.targetZoom-(d-s.pinchDist)*0.02)); s.pinchDist=d; }
    };
    const onTouchEnd = (e) => {
      if(e.changedTouches.length===1&&!s.touchHasDragged){ const m=pick(e.changedTouches[0].clientX,e.changedTouches[0].clientY); if(m){setSelected(m);setPanelOpen(true);}else{setPanelOpen(false);setTimeout(()=>setSelected(null),300);} }
      s.pinchDist=null;
    };

    canvas.addEventListener("mousedown",   onMouseDown);
    window.addEventListener("mousemove",   onMouseMove);
    window.addEventListener("mouseup",     onMouseUp);
    canvas.addEventListener("wheel",       onWheel,      { passive:false });
    canvas.addEventListener("touchstart",  onTouchStart, { passive:true });
    canvas.addEventListener("touchmove",   onTouchMove,  { passive:false });
    canvas.addEventListener("touchend",    onTouchEnd,   { passive:true });

    return () => {
      cancelAnimationFrame(s.frameId);
      window.removeEventListener("resize",    onResize);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
      canvas.removeEventListener("wheel",     onWheel);
      canvas.removeEventListener("touchstart",onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend",  onTouchEnd);
      composer.dispose();
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missions.length]);

  const pct = selected ? Math.min(100, Math.round((selected.current_count/selected.required_events)*100)) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ background:"#000", cursor:"grab" }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ touchAction:"none" }} />

      {/* Vignetta telescopica */}
      <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.72) 100%)" }} />

      {/* Label stelle — aggiornate ogni frame via DOM */}
      <div ref={labelsRef} className="absolute inset-0 pointer-events-none select-none">
        {missions.map((m, i) => (
          <div key={i} style={{ position:"absolute", transform:"translateX(-50%)", textAlign:"center" }}>
            <div style={{ fontSize: isMob?12:14, lineHeight:1, filter: !m.unlocked ? "grayscale(1) opacity(0.2)" : "none" }}>{m.emoji}</div>
            <div style={{ fontSize: isMob?7:9, fontWeight:800, letterSpacing:"0.04em", marginTop:2, color: !m.unlocked ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.72)", maxWidth: isMob?60:78, lineHeight:1.2, textShadow: !m.unlocked ? "none" : "0 1px 10px rgba(0,0,0,1)" }}>{m.title}</div>
          </div>
        ))}
      </div>

      {/* Titolo */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
        <div style={{ fontSize:8, fontWeight:900, letterSpacing:"0.4em", color:"rgba(200,220,255,0.3)", textTransform:"uppercase" }}>Trama Viva</div>
        <div style={{ fontWeight:900, fontSize: isMob?14:16, color:"rgba(255,255,255,0.72)", lineHeight:1.2, marginTop:2 }}>Costellazione delle Missioni</div>
      </div>

      {/* Back */}
      <button onPointerDown={(e)=>e.stopPropagation()} onClick={onBack} style={{ position:"absolute", top:14, left:14, zIndex:10, display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", color:"rgba(255,255,255,0.45)", borderRadius:99, padding: isMob?"8px 14px":"8px 16px", fontSize: isMob?12:13, fontWeight:700, cursor:"pointer" }}>
        <ChevronLeft size={13}/> Area soci
      </button>

      {/* Legenda */}
      <div className="pointer-events-none select-none" style={{ position:"absolute", ...(isMob?{bottom:48,left:14,display:"flex",flexDirection:"row",gap:12}:{bottom:28,right:18,display:"flex",flexDirection:"column",gap:6}), opacity: panelOpen&&isMob?0:1, transition:"opacity 0.3s" }}>
        {[{color:"#fff7e8",label:"Completata"},{color:"#ddeeff",label:"Sbloccata"},{color:"#1a2535",label:"Bloccata",border:"rgba(255,255,255,0.12)"}].map(({color,label,border})=>(
          <div key={label} style={{ display:"flex",alignItems:"center",gap:6 }}>
            <div style={{ width:8,height:8,borderRadius:"50%",flexShrink:0,background:color,boxShadow:`0 0 6px ${color}`,border:border?`1px solid ${border}`:undefined }} />
            <span style={{ fontSize:9,color:"rgba(255,255,255,0.27)",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Hint */}
      {!panelOpen && <div className="pointer-events-none select-none" style={{ position:"absolute", bottom: isMob?26:28, left:"50%", transform:"translateX(-50%)", fontSize:9, color:"rgba(255,255,255,0.13)", fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", textAlign:"center", whiteSpace:"nowrap" }}>{isMob?"Trascina · Pizzica per zoomare · Tocca una stella":"Trascina per navigare · Scroll per zoomare · Clicca una stella"}</div>}

      {/* Pannello dettaglio */}
      <div onPointerDown={(e)=>e.stopPropagation()} style={{ position:"absolute",left:0,right:0,bottom:0,zIndex:20, transform:panelOpen?"translateY(0)":"translateY(110%)", transition:"transform 0.35s cubic-bezier(0.32,0.72,0,1)", background:"rgba(1,3,12,0.97)", borderTop:"1px solid rgba(200,220,255,0.1)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", padding: isMob?"18px 18px 40px":"24px 32px 44px", maxHeight: isMob?"58vh":"52vh", overflowY:"auto" }}>
        <button onClick={()=>{setPanelOpen(false);setTimeout(()=>setSelected(null),300);}} style={{ position:"absolute",top:14,right:14,width:28,height:28,borderRadius:99,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,cursor:"pointer" }}>✕</button>

        {selected && (
          <div style={{ maxWidth:520, margin:"0 auto" }}>
            <div style={{ display:"flex",gap:14,alignItems:"flex-start",marginBottom:14 }}>
              <div style={{ width:isMob?46:54,height:isMob?46:54,borderRadius:13,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isMob?20:24, background:selected.unlocked?"rgba(255,250,242,0.07)":"rgba(255,255,255,0.04)", border:selected.unlocked?"1px solid rgba(255,250,242,0.18)":"1px solid rgba(255,255,255,0.08)", boxShadow:selected.unlocked?"0 0 16px rgba(255,250,242,0.08)":"none", filter:selected.unlocked?"none":"grayscale(1) opacity(0.35)" }}>{selected.emoji}</div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:5 }}>
                  <span style={{ fontWeight:900,fontSize:isMob?14:15,color:selected.unlocked?"white":"rgba(255,255,255,0.25)",lineHeight:1.2 }}>{selected.title}</span>
                  {selected.unlocked&&selected.current_count>=selected.required_events&&<span style={{ fontSize:8,fontWeight:900,letterSpacing:"0.15em",background:"rgba(255,247,232,0.1)",color:"rgba(255,247,232,0.85)",border:"1px solid rgba(255,247,232,0.25)",padding:"2px 7px",borderRadius:99,textTransform:"uppercase" }}>✓ Completata</span>}
                  {selected.unlocked&&selected.current_count<selected.required_events&&<span style={{ fontSize:8,fontWeight:900,letterSpacing:"0.15em",background:"rgba(220,238,255,0.1)",color:"rgba(220,238,255,0.75)",border:"1px solid rgba(220,238,255,0.2)",padding:"2px 7px",borderRadius:99,textTransform:"uppercase" }}>In corso</span>}
                  {!selected.unlocked&&<span style={{ fontSize:8,fontWeight:900,letterSpacing:"0.15em",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.1)",padding:"2px 7px",borderRadius:99,textTransform:"uppercase",display:"inline-flex",alignItems:"center",gap:3 }}><Lock size={7}/> Bloccata</span>}
                </div>
                <p style={{ fontSize:isMob?11:12,color:"rgba(255,255,255,0.4)",lineHeight:1.6,margin:0 }}>{selected.description}</p>
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                <span style={{ fontSize:9,color:"rgba(255,255,255,0.27)",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" }}>Progressione</span>
                <span style={{ fontSize:10,color:selected.unlocked?"rgba(220,238,255,0.8)":"rgba(255,255,255,0.2)",fontWeight:800 }}>{selected.current_count} / {selected.required_events} eventi</span>
              </div>
              <div style={{ height:4,background:"rgba(255,255,255,0.07)",borderRadius:99,overflow:"hidden" }}>
                <div style={{ height:"100%",width:`${pct}%`,borderRadius:99, background:pct>=100?"rgba(255,250,242,0.7)":selected.unlocked?"rgba(220,235,255,0.55)":"rgba(255,255,255,0.07)", boxShadow:"none",transition:"width 0.9s ease" }} />
              </div>
            </div>
            {selected.reward&&<div style={{ display:"flex",alignItems:"center",gap:7,color:selected.unlocked?"rgba(255,250,230,0.75)":"rgba(255,255,255,0.16)",fontSize:isMob?11:12,fontWeight:700 }}><Gift size={12}/> {selected.reward}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default MissioniCostellazione;
