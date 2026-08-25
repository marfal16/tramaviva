import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer }  from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass }      from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ChevronLeft, Gift, Lock, Star } from "lucide-react";

// ── Posizioni costellazione ───────────────────────────────────────────────────
const STAR_POSITIONS = [
  [-2.2,  1.1], [-0.7,  1.8], [ 0.8,  1.3], [ 2.3,  1.9], [ 2.9,  0.3],
  [ 1.6, -0.9], [ 0.2, -1.6], [-1.3, -1.4], [-2.5, -0.4], [ 0.4,  0.1],
];

// ── Palette gioco ─────────────────────────────────────────────────────────────
const C_DONE      = new THREE.Color(0xffd166); // oro gioco
const C_AVAILABLE = new THREE.Color(0x06d6e0); // ciano gioco
const C_LOCKED    = new THREE.Color(0x2a2d4a); // grigio-viola spento

// ── Glow texture (canvas) ─────────────────────────────────────────────────────
function makeGlow(size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const h = size / 2;
  const g = ctx.createRadialGradient(h, h, 0, h, h, h);
  g.addColorStop(0,    "rgba(255,255,255,1)");
  g.addColorStop(0.08, "rgba(255,255,255,0.9)");
  g.addColorStop(0.25, "rgba(255,255,255,0.45)");
  g.addColorStop(0.55, "rgba(255,255,255,0.1)");
  g.addColorStop(1,    "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

// ── Nebulosa stylized (canvas) ────────────────────────────────────────────────
function makeNebula(r, g, b, w = 256, h = 256) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  // blob principale
  const g1 = ctx.createRadialGradient(w*0.5, h*0.5, 0, w*0.5, h*0.5, w*0.48);
  g1.addColorStop(0,   `rgba(${r},${g},${b},0.55)`);
  g1.addColorStop(0.4, `rgba(${r},${g},${b},0.25)`);
  g1.addColorStop(0.75,`rgba(${r},${g},${b},0.06)`);
  g1.addColorStop(1,   `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, h);
  // secondo blob offset
  const g2 = ctx.createRadialGradient(w*0.65, h*0.35, 0, w*0.65, h*0.35, w*0.3);
  g2.addColorStop(0,   `rgba(${r},${g},${b},0.3)`);
  g2.addColorStop(0.5, `rgba(${r},${g},${b},0.08)`);
  g2.addColorStop(1,   `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, h);
  return new THREE.CanvasTexture(c);
}

export const MissioniCostellazione = ({ missionsData, onBack }) => {
  const canvasRef = useRef();
  const labelsRef = useRef();
  const stateRef  = useRef({
    camera: null, renderer: null, composer: null,
    stars: [], hitMeshes: [], rings: [],
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

    // Scene + camera
    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(0x080918, 0.012); // nebbia profonda
    const camera = new THREE.PerspectiveCamera(60, W/H, 0.1, 300);
    camera.position.set(0, 0, 7);
    s.camera = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x080918);
    renderer.toneMapping        = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    s.renderer = renderer;

    const glowTex = makeGlow(128);

    // ── Stelle sfondo — bianche/blu/viola, varie dimensioni ──────────────────
    const BG = isMob ? 2500 : 4000;
    const bgPos = new Float32Array(BG*3);
    const bgCol = new Float32Array(BG*3);
    const bgPal = [
      [1.0, 1.0, 1.0], [0.85, 0.9, 1.0], [0.75, 0.8, 1.0],
      [0.9, 0.85, 1.0], [1.0, 0.95, 0.9],
    ];
    for (let i=0;i<BG;i++) {
      bgPos[i*3]   = (Math.random()-0.5)*100;
      bgPos[i*3+1] = (Math.random()-0.5)*100;
      bgPos[i*3+2] = (Math.random()-0.5)*30 - 8;
      const [r,g,b] = bgPal[Math.floor(Math.random()*bgPal.length)];
      const br = 0.3 + Math.random()*0.7;
      bgCol[i*3]=r*br; bgCol[i*3+1]=g*br; bgCol[i*3+2]=b*br;
    }
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos,3));
    bgGeo.setAttribute("color",    new THREE.BufferAttribute(bgCol,3));
    const bgStars = new THREE.Points(bgGeo, new THREE.PointsMaterial({
      size: 0.22, map: glowTex, vertexColors: true,
      transparent: true, opacity:1, sizeAttenuation:true,
      blending: THREE.AdditiveBlending, depthWrite:false,
    }));
    scene.add(bgStars);

    // ── Nebulose stylized (grandi sprite piani) ───────────────────────────────
    const nebs = [
      { rgb:[130,60,220], pos:[-5, 2,-14],  sx:18, sy:14, rot:0.5,  op:0.55 },
      { rgb:[20,160,220], pos:[ 6,-4,-12],  sx:16, sy:12, rot:-0.3, op:0.45 },
      { rgb:[220,50,120], pos:[-3,-6,-10],  sx:12, sy:10, rot:1.1,  op:0.40 },
      { rgb:[40,200,150], pos:[ 7, 6,-16],  sx:14, sy:11, rot:-0.8, op:0.35 },
    ];
    nebs.forEach(({ rgb:[r,g,b], pos, sx, sy, rot, op }) => {
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeNebula(r,g,b), transparent:true, opacity:op,
        blending: THREE.AdditiveBlending, depthWrite:false,
      }));
      spr.scale.set(sx, sy, 1);
      spr.position.set(...pos);
      spr.material.rotation = rot;
      scene.add(spr);
    });

    // ── Stelle missione ───────────────────────────────────────────────────────
    const stars    = [];
    const hitMeshes= [];
    const rings    = [];

    missions.forEach((m, i) => {
      const [x,y] = STAR_POSITIONS[i % STAR_POSITIONS.length];
      const done      = m.unlocked && m.current_count >= m.required_events;
      const available = m.unlocked && !done;
      const locked    = !m.unlocked;
      const color     = done ? C_DONE : available ? C_AVAILABLE : C_LOCKED;
      const radius    = done ? 0.18 : available ? 0.13 : 0.08;

      // Sfera core
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 20, 20),
        new THREE.MeshBasicMaterial({ color })
      );
      core.position.set(x, y, 0);
      core.userData = { mission:m, done, available, locked, radius };
      scene.add(core);
      stars.push(core);

      // Glow sprite sopra la sfera
      if (!locked) {
        const gsz = done ? 1.8 : 1.2;
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glowTex, color,
          blending: THREE.AdditiveBlending, transparent:true,
          opacity: done ? 0.7 : 0.5, depthWrite:false,
        }));
        glow.scale.set(gsz, gsz, 1);
        glow.position.set(x, y, 0.02);
        scene.add(glow);
        core.userData.glow = glow;

        // Anello orbitante (solo disponibili/completate)
        const ringGeo = new THREE.RingGeometry(radius*1.8, radius*2.1, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color, transparent:true,
          opacity: done ? 0.55 : 0.35,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(x, y, 0);
        ring.rotation.x = Math.PI * 0.18; // inclinato per effetto 3D
        scene.add(ring);
        rings.push({ mesh:ring, phase: i*0.9 });
      }

      // Hit sphere invisibile
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(isMob?0.55:0.35, 6,6),
        new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false })
      );
      hit.position.set(x, y, 0);
      hit.userData = core.userData;
      scene.add(hit);
      hitMeshes.push(hit);
    });
    s.stars     = stars;
    s.hitMeshes = hitMeshes;
    s.rings     = rings;

    // ── Linee costellazione glow ──────────────────────────────────────────────
    if (missions.length >= 2) {
      const pts = missions.map((_,i)=>{const[x,y]=STAR_POSITIONS[i%STAR_POSITIONS.length];return new THREE.Vector3(x,y,0);});
      // linea base sottile
      scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color:0x8899cc, transparent:true, opacity:0.25 })
      ));
    }

    // ── EffectComposer + Bloom ────────────────────────────────────────────────
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(isMob ? W/2 : W, isMob ? H/2 : H),
      isMob ? 1.1 : 1.5,  // strength — gioco, vivace
      0.7,                  // radius
      0.1,                  // threshold basso → tutto brilla un po'
    ));
    s.composer = composer;

    // ── Label DOM ─────────────────────────────────────────────────────────────
    const updateLabelDOM = () => {
      const container = labelsRef.current;
      if (!container) return;
      camera.updateMatrixWorld(true);
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      const ww = window.innerWidth, hh = window.innerHeight;
      const off = isMob ? 24 : 32;
      stars.forEach((star, i) => {
        const el = container.children[i];
        if (!el) return;
        const v = star.position.clone().project(camera);
        el.style.left = ((v.x*0.5+0.5)*ww) + "px";
        el.style.top  = ((-v.y*0.5+0.5)*hh - off) + "px";
      });
    };

    // ── Raycasting ────────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pick = (cx,cy) => {
      const rect=canvas.getBoundingClientRect();
      raycaster.setFromCamera({x:((cx-rect.left)/rect.width)*2-1,y:-(((cy-rect.top)/rect.height)*2-1)},camera);
      const hits=raycaster.intersectObjects(hitMeshes);
      return hits.length>0 ? hits[0].object.userData.mission : null;
    };

    const clampPan = () => { const L=4; s.targetPan.x=Math.max(-L,Math.min(L,s.targetPan.x)); s.targetPan.y=Math.max(-L,Math.min(L,s.targetPan.y)); };

    // ── Animation loop ────────────────────────────────────────────────────────
    let t = 0;
    const animate = () => {
      s.frameId = requestAnimationFrame(animate);
      t += 0.012;

      // camera smooth
      s.panOffset.x += (s.targetPan.x-s.panOffset.x)*0.09;
      s.panOffset.y += (s.targetPan.y-s.panOffset.y)*0.09;
      s.zoom        += (s.targetZoom-s.zoom)*0.09;
      camera.position.set(s.panOffset.x, s.panOffset.y, s.zoom);
      camera.lookAt(s.panOffset.x, s.panOffset.y, 0);

      // sfondo leggero drift
      bgStars.rotation.y = Math.sin(t*0.02)*0.04;
      bgStars.rotation.x = Math.cos(t*0.015)*0.02;

      // stelle missione
      stars.forEach((star, i) => {
        const { done, available, locked, radius, glow } = star.userData;
        if (!locked) {
          // pulsazione scala
          const pulse = 1 + Math.sin(t + i*1.3) * (done ? 0.14 : 0.1);
          star.scale.setScalar(pulse);
          if (glow) {
            glow.material.opacity = (done ? 0.7 : 0.5) + Math.sin(t+i*1.3)*0.15;
            const gsz = (done ? 1.8 : 1.2) * (1 + Math.sin(t+i*1.3)*0.2);
            glow.scale.setScalar(gsz);
          }
        }
      });

      // anelli rotanti
      rings.forEach(({ mesh, phase }) => {
        mesh.rotation.z = t*0.4 + phase;
        mesh.material.opacity = 0.35 + Math.sin(t + phase)*0.15;
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
    const onMouseDown=(e)=>{s.isDragging=true;s.hasDragged=false;s.mouseDownX=e.clientX;s.mouseDownY=e.clientY;s.panAtDown={x:s.targetPan.x,y:s.targetPan.y};};
    const onMouseMove=(e)=>{if(!s.isDragging)return;const dx=e.clientX-s.mouseDownX,dy=e.clientY-s.mouseDownY;if(Math.abs(dx)>3||Math.abs(dy)>3)s.hasDragged=true;const f=s.zoom/window.innerWidth*1.8;s.targetPan.x=s.panAtDown.x-dx*f;s.targetPan.y=s.panAtDown.y+dy*f;clampPan();};
    const onMouseUp=(e)=>{if(!s.isDragging)return;s.isDragging=false;if(!s.hasDragged){const m=pick(e.clientX,e.clientY);if(m){setSelected(m);setPanelOpen(true);}else{setPanelOpen(false);setTimeout(()=>setSelected(null),300);}}};
    const onWheel=(e)=>{e.preventDefault();s.targetZoom=Math.max(3.5,Math.min(14,s.targetZoom+e.deltaY*0.01));};

    // ── Touch ─────────────────────────────────────────────────────────────────
    const getTD=(ts)=>Math.hypot(ts[0].clientX-ts[1].clientX,ts[0].clientY-ts[1].clientY);
    const onTouchStart=(e)=>{if(e.touches.length===1){s.touchStartX=e.touches[0].clientX;s.touchStartY=e.touches[0].clientY;s.touchPanAtDown={x:s.targetPan.x,y:s.targetPan.y};s.touchHasDragged=false;s.pinchDist=null;}else if(e.touches.length===2)s.pinchDist=getTD(e.touches);};
    const onTouchMove=(e)=>{e.preventDefault();if(e.touches.length===1){const dx=e.touches[0].clientX-s.touchStartX,dy=e.touches[0].clientY-s.touchStartY;if(Math.abs(dx)>6||Math.abs(dy)>6)s.touchHasDragged=true;const f=s.zoom/window.innerWidth*2.5;s.targetPan.x=s.touchPanAtDown.x-dx*f;s.targetPan.y=s.touchPanAtDown.y+dy*f;clampPan();}else if(e.touches.length===2&&s.pinchDist!==null){const d=getTD(e.touches);s.targetZoom=Math.max(3.5,Math.min(14,s.targetZoom-(d-s.pinchDist)*0.02));s.pinchDist=d;}};
    const onTouchEnd=(e)=>{if(e.changedTouches.length===1&&!s.touchHasDragged){const m=pick(e.changedTouches[0].clientX,e.changedTouches[0].clientY);if(m){setSelected(m);setPanelOpen(true);}else{setPanelOpen(false);setTimeout(()=>setSelected(null),300);}}s.pinchDist=null;};

    canvas.addEventListener("mousedown",   onMouseDown);
    window.addEventListener("mousemove",   onMouseMove);
    window.addEventListener("mouseup",     onMouseUp);
    canvas.addEventListener("wheel",       onWheel,       {passive:false});
    canvas.addEventListener("touchstart",  onTouchStart,  {passive:true});
    canvas.addEventListener("touchmove",   onTouchMove,   {passive:false});
    canvas.addEventListener("touchend",    onTouchEnd,    {passive:true});

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
      composer.dispose(); renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missions.length]);

  const done = selected ? selected.current_count >= selected.required_events : false;
  const pct  = selected ? Math.min(100, Math.round((selected.current_count/selected.required_events)*100)) : 0;
  const accentColor = selected?.unlocked ? (done ? "#ffd166" : "#06d6e0") : "rgba(255,255,255,0.3)";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none" style={{ background:"#080918", cursor:"grab" }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ touchAction:"none" }} />

      {/* Vignetta */}
      <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at center, transparent 50%, rgba(8,9,24,0.6) 100%)" }} />

      {/* Label stelle */}
      <div ref={labelsRef} className="absolute inset-0 pointer-events-none">
        {missions.map((m, i) => {
          const done = m.unlocked && m.current_count >= m.required_events;
          const col  = done ? "#ffd166" : m.unlocked ? "#06d6e0" : "rgba(255,255,255,0.2)";
          return (
            <div key={i} style={{ position:"absolute", transform:"translateX(-50%)", textAlign:"center" }}>
              <div style={{ fontSize: isMob?13:15, lineHeight:1, filter: !m.unlocked ? "grayscale(1) opacity(0.25)" : "none" }}>{m.emoji}</div>
              <div style={{ fontSize: isMob?8:10, fontWeight:900, letterSpacing:"0.05em", marginTop:3, color:col, textShadow: m.unlocked ? `0 0 12px ${col}` : "none", maxWidth: isMob?68:85, lineHeight:1.2 }}>{m.title}</div>
            </div>
          );
        })}
      </div>

      {/* Titolo */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <div style={{ fontSize:8, fontWeight:900, letterSpacing:"0.45em", color:"rgba(180,200,255,0.35)", textTransform:"uppercase" }}>Trama Viva</div>
        <div style={{ fontWeight:900, fontSize: isMob?15:18, color:"rgba(255,255,255,0.85)", letterSpacing:"0.02em", marginTop:2 }}>✦ Costellazione delle Missioni ✦</div>
      </div>

      {/* Back */}
      <button onPointerDown={(e)=>e.stopPropagation()} onClick={onBack} style={{ position:"absolute",top:14,left:14,zIndex:10,display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.14)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",color:"rgba(255,255,255,0.55)",borderRadius:99,padding:isMob?"8px 14px":"9px 18px",fontSize:isMob?12:13,fontWeight:700,cursor:"pointer",letterSpacing:"0.03em" }}>
        <ChevronLeft size={13}/> Area soci
      </button>

      {/* Legenda */}
      <div className="pointer-events-none" style={{ position:"absolute", ...(isMob?{bottom:52,left:14,display:"flex",flexDirection:"row",gap:14}:{bottom:30,right:20,display:"flex",flexDirection:"column",gap:8}), opacity:panelOpen&&isMob?0:1, transition:"opacity 0.3s" }}>
        {[
          { color:"#ffd166", glow:"rgba(255,209,102,0.6)", label:"Completata" },
          { color:"#06d6e0", glow:"rgba(6,214,224,0.5)",   label:"Sbloccata"  },
          { color:"#444466", glow:"none",                   label:"Bloccata"   },
        ].map(({ color, glow, label }) => (
          <div key={label} style={{ display:"flex",alignItems:"center",gap:7 }}>
            <div style={{ width:9,height:9,borderRadius:"50%",background:color,boxShadow:glow!=="none"?`0 0 8px ${glow}`:undefined,flexShrink:0 }} />
            <span style={{ fontSize:9,color:"rgba(255,255,255,0.35)",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Hint */}
      {!panelOpen && (
        <div className="pointer-events-none" style={{ position:"absolute",bottom:isMob?28:30,left:"50%",transform:"translateX(-50%)",fontSize:9,color:"rgba(255,255,255,0.18)",fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",textAlign:"center",whiteSpace:"nowrap" }}>
          {isMob ? "Trascina · Pizzica · Tocca una stella" : "Trascina per navigare · Scroll per zoomare · Clicca una stella"}
        </div>
      )}

      {/* Pannello dettaglio */}
      <div onPointerDown={(e)=>e.stopPropagation()} style={{ position:"absolute",left:0,right:0,bottom:0,zIndex:20,transform:panelOpen?"translateY(0)":"translateY(110%)",transition:"transform 0.38s cubic-bezier(0.32,0.72,0,1)",background:"rgba(8,9,28,0.97)",borderTop:`1px solid ${accentColor}40`,backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",padding:isMob?"20px 18px 44px":"26px 36px 48px",maxHeight:isMob?"60vh":"54vh",overflowY:"auto" }}>

        <button onClick={()=>{setPanelOpen(false);setTimeout(()=>setSelected(null),300);}} style={{ position:"absolute",top:14,right:14,width:30,height:30,borderRadius:99,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.45)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer" }}>✕</button>

        {selected && (
          <div style={{ maxWidth:540,margin:"0 auto" }}>
            {/* Header */}
            <div style={{ display:"flex",gap:16,alignItems:"flex-start",marginBottom:18 }}>
              <div style={{ width:isMob?52:62,height:isMob?52:62,borderRadius:16,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isMob?24:28, background:`${accentColor}14`, border:`1px solid ${accentColor}30`, boxShadow:selected.unlocked?`0 0 24px ${accentColor}20`:"none", filter:selected.unlocked?"none":"grayscale(1) opacity(0.3)" }}>
                {selected.emoji}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6 }}>
                  <span style={{ fontWeight:900,fontSize:isMob?15:17,color:selected.unlocked?"white":"rgba(255,255,255,0.25)",letterSpacing:"0.01em" }}>{selected.title}</span>
                  {selected.unlocked && done && <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.15em",background:"rgba(255,209,102,0.15)",color:"#ffd166",border:"1px solid rgba(255,209,102,0.35)",padding:"3px 8px",borderRadius:99,textTransform:"uppercase" }}>★ Completata</span>}
                  {selected.unlocked && !done && <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.15em",background:"rgba(6,214,224,0.12)",color:"#06d6e0",border:"1px solid rgba(6,214,224,0.3)",padding:"3px 8px",borderRadius:99,textTransform:"uppercase" }}>◉ In corso</span>}
                  {!selected.unlocked && <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.15em",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.25)",border:"1px solid rgba(255,255,255,0.12)",padding:"3px 8px",borderRadius:99,textTransform:"uppercase",display:"inline-flex",alignItems:"center",gap:3 }}><Lock size={8}/> Bloccata</span>}
                </div>
                <p style={{ fontSize:isMob?12:13,color:"rgba(255,255,255,0.45)",lineHeight:1.65,margin:0 }}>{selected.description}</p>
              </div>
            </div>

            {/* Barra progresso */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                <span style={{ fontSize:10,color:"rgba(255,255,255,0.3)",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase" }}>Progresso</span>
                <span style={{ fontSize:12,color:selected.unlocked?accentColor:"rgba(255,255,255,0.2)",fontWeight:900 }}>{pct}%</span>
              </div>
              <div style={{ height:5,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden" }}>
                <div style={{ height:"100%",width:`${pct}%`,borderRadius:99,background:selected.unlocked?(done?`linear-gradient(90deg,#ffd166,#ffb347)`:`linear-gradient(90deg,#06d6e0,#4fc3f7)`):"rgba(255,255,255,0.1)",boxShadow:selected.unlocked&&pct>0?`0 0 12px ${accentColor}80`:"none",transition:"width 1s ease" }} />
              </div>
              <div style={{ marginTop:6,fontSize:10,color:"rgba(255,255,255,0.25)",fontWeight:700,textAlign:"right" }}>{selected.current_count} / {selected.required_events} eventi</div>
            </div>

            {/* Premio */}
            {selected.reward && (
              <div style={{ display:"flex",alignItems:"center",gap:8,color:selected.unlocked?accentColor:"rgba(255,255,255,0.18)",fontSize:isMob?12:13,fontWeight:800, background:`${selected.unlocked?accentColor:"rgba(255,255,255,0.05)"}12`, border:`1px solid ${selected.unlocked?accentColor:"rgba(255,255,255,0.08)"}28`, padding:"10px 14px", borderRadius:12 }}>
                <Gift size={14}/> {selected.reward}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MissioniCostellazione;
