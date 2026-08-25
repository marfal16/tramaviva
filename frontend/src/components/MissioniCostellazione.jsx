import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ChevronLeft, Gift, Lock } from "lucide-react";

const STAR_POSITIONS = [
  [-2.2,  1.1], [-0.7,  1.8], [ 0.8,  1.3], [ 2.3,  1.9], [ 2.9,  0.3],
  [ 1.6, -0.9], [ 0.2, -1.6], [-1.3, -1.4], [-2.5, -0.4], [ 0.4,  0.1],
];

const COLOR_DONE      = new THREE.Color(0xf59e0b);
const COLOR_AVAILABLE = new THREE.Color(0x38bdf8);
const COLOR_LOCKED    = new THREE.Color(0x1e3a5f);

function makeGalaxySpiral(count, arms, spread, radius) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const c0  = new THREE.Color(0x4466ff);
  const c1  = new THREE.Color(0xffffff);
  const c2  = new THREE.Color(0xaa66cc);
  for (let i = 0; i < count; i++) {
    const arm   = i % arms;
    const t     = Math.random();
    const angle = (arm / arms) * Math.PI * 2 + t * Math.PI * 4 + (Math.random() - 0.5) * spread;
    const r     = Math.sqrt(Math.random()) * radius;
    const sc    = (1 - t) * 0.6 + 0.1;
    pos[i*3]   = Math.cos(angle)*r + (Math.random()-0.5)*sc;
    pos[i*3+1] = (Math.random()-0.5)*sc*0.4;
    pos[i*3+2] = Math.sin(angle)*r + (Math.random()-0.5)*sc;
    const mix  = Math.random();
    const base = mix < 0.5 ? c0.clone().lerp(c1, mix*2) : c1.clone().lerp(c2, (mix-0.5)*2);
    col[i*3]   = base.r; col[i*3+1] = base.g; col[i*3+2] = base.b;
  }
  return { pos, col };
}

export const MissioniCostellazione = ({ missionsData, onBack }) => {
  const canvasRef    = useRef();
  const labelsRef    = useRef();   // container DOM delle label — aggiornato direttamente nel loop
  const stateRef     = useRef({
    camera: null, renderer: null,
    meshes: [], hitMeshes: [], glows: [],
    isDragging: false,
    mouseDownX: 0, mouseDownY: 0, panAtDown: { x: 0, y: 0 }, hasDragged: false,
    panOffset: { x: 0, y: 0 }, targetPan: { x: 0, y: 0 },
    zoom: 7, targetZoom: 7,
    pinchDist: null,
    touchStartX: 0, touchStartY: 0, touchPanAtDown: { x: 0, y: 0 }, touchHasDragged: false,
    frameId: null,
  });

  const [selected, setSelected]   = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const missions = missionsData?.missions || [];
  const isMob    = window.innerWidth < 768;

  // ── Setup Three.js (una volta sola) ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const W = window.innerWidth, H = window.innerHeight;
    const s = stateRef.current;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500);
    camera.position.set(0, 0, 7);
    s.camera = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020b18);
    s.renderer = renderer;

    // Stelle sfondo
    const N = 5000;
    const bgPos = new Float32Array(N*3), bgCol = new Float32Array(N*3);
    const palette = [new THREE.Color(0xffffff), new THREE.Color(0xaaccff), new THREE.Color(0xffeebb), new THREE.Color(0xccaaff)];
    for (let i = 0; i < N; i++) {
      bgPos[i*3]   = (Math.random()-0.5)*120;
      bgPos[i*3+1] = (Math.random()-0.5)*120;
      bgPos[i*3+2] = (Math.random()-0.5)*40 - 8;
      const c = palette[i % palette.length];
      bgCol[i*3] = c.r; bgCol[i*3+1] = c.g; bgCol[i*3+2] = c.b;
    }
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    bgGeo.setAttribute("color",    new THREE.BufferAttribute(bgCol, 3));
    const bgStars = new THREE.Points(bgGeo, new THREE.PointsMaterial({
      size: isMob ? 0.07 : 0.055, vertexColors: true, transparent: true, opacity: 0.75, sizeAttenuation: true,
    }));
    scene.add(bgStars);

    // Galassie
    const addGalaxy = (count, arms, spread, radius, p, rz, op) => {
      const { pos, col } = makeGalaxySpiral(count, arms, spread, radius);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color",    new THREE.BufferAttribute(col, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: op, sizeAttenuation: true }));
      pts.position.set(...p); pts.rotation.z = rz; scene.add(pts); return pts;
    };
    const galaxy1 = addGalaxy(2200, 3, 1.2, 22, [8, -5, -18],  0.3,  0.35);
    const galaxy2 = addGalaxy(900,  2, 1.5, 10, [-12, 6, -22], -0.8, 0.25);

    // Nebulose
    [
      { color: 0x6633aa, spread: [14,6,3], pos:[-5, 3,-12], count:400, op:0.18 },
      { color: 0x003388, spread: [10,8,2], pos:[ 6,-4,-10], count:350, op:0.15 },
      { color: 0xaa3344, spread: [ 8,5,2], pos:[-2,-6, -8], count:280, op:0.12 },
    ].forEach(({ color, spread, pos, count, op }) => {
      const p = new Float32Array(count*3);
      for (let i=0;i<count;i++) { p[i*3]=(Math.random()-0.5)*spread[0]; p[i*3+1]=(Math.random()-0.5)*spread[1]; p[i*3+2]=(Math.random()-0.5)*spread[2]; }
      const ng = new THREE.BufferGeometry();
      ng.setAttribute("position", new THREE.BufferAttribute(p, 3));
      const np = new THREE.Points(ng, new THREE.PointsMaterial({ color, size:0.25, transparent:true, opacity:op, sizeAttenuation:true }));
      np.position.set(...pos); scene.add(np);
    });

    // Stelle missione
    const meshes=[], hitMeshes=[], glows=[];
    missions.forEach((m, i) => {
      const [x,y]  = STAR_POSITIONS[i % STAR_POSITIONS.length];
      const done   = m.unlocked && m.current_count >= m.required_events;
      const locked = !m.unlocked;
      const color  = done ? COLOR_DONE : !locked ? COLOR_AVAILABLE : COLOR_LOCKED;
      const radius = done ? 0.14 : !locked ? 0.11 : 0.08;

      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 16), new THREE.MeshBasicMaterial({ color }));
      mesh.position.set(x, y, 0);
      mesh.userData = { mission: m, done, locked };
      scene.add(mesh); meshes.push(mesh);

      const hitR    = isMob ? 0.45 : 0.28;
      const hitMesh = new THREE.Mesh(new THREE.SphereGeometry(hitR, 8, 8), new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false }));
      hitMesh.position.set(x, y, 0);
      hitMesh.userData = mesh.userData;
      scene.add(hitMesh); hitMeshes.push(hitMesh);

      if (!locked) {
        const glow = new THREE.Mesh(new THREE.SphereGeometry(radius*4, 16, 16), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.07 }));
        glow.position.set(x, y, 0); scene.add(glow);
        glows.push({ mesh: glow, base: 0.07, phase: i*1.4 });
      }
    });
    s.meshes=meshes; s.hitMeshes=hitMeshes; s.glows=glows;

    // Linee costellazione
    if (missions.length >= 2) {
      const pts = missions.map((_,i) => { const [x,y]=STAR_POSITIONS[i%STAR_POSITIONS.length]; return new THREE.Vector3(x,y,0); });
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color:0x38bdf8, transparent:true, opacity:0.12 })));
    }

    // ── Aggiorna posizioni label direttamente nel DOM (nessun React state) ───
    const updateLabelDOM = () => {
      const container = labelsRef.current;
      if (!container) return;
      const ww = renderer.domElement.width  / window.devicePixelRatio;
      const hh = renderer.domElement.height / window.devicePixelRatio;
      meshes.forEach((mesh, i) => {
        const el = container.children[i];
        if (!el) return;
        const v = mesh.position.clone().project(camera);
        const x = (v.x * 0.5 + 0.5) * ww;
        const y = (-v.y * 0.5 + 0.5) * hh;
        el.style.left = x + "px";
        el.style.top  = (y - (isMob ? 22 : 28)) + "px";
      });
    };

    // Raycasting
    const raycaster = new THREE.Raycaster();
    const pick = (cx, cy) => {
      const rect = canvas.getBoundingClientRect();
      raycaster.setFromCamera({ x: ((cx-rect.left)/rect.width)*2-1, y: -(((cy-rect.top)/rect.height)*2-1) }, camera);
      const hits = raycaster.intersectObjects(hitMeshes);
      return hits.length > 0 ? hits[0].object.userData.mission : null;
    };

    const clampPan = () => {
      const lim = 4;
      s.targetPan.x = Math.max(-lim, Math.min(lim, s.targetPan.x));
      s.targetPan.y = Math.max(-lim, Math.min(lim, s.targetPan.y));
    };

    // Animation loop
    let t = 0;
    const animate = () => {
      s.frameId = requestAnimationFrame(animate);
      t += 0.01;

      s.panOffset.x += (s.targetPan.x - s.panOffset.x) * 0.08;
      s.panOffset.y += (s.targetPan.y - s.panOffset.y) * 0.08;
      s.zoom        += (s.targetZoom  - s.zoom)         * 0.08;
      camera.position.set(s.panOffset.x, s.panOffset.y, s.zoom);
      camera.lookAt(s.panOffset.x, s.panOffset.y, 0);

      bgStars.rotation.y = Math.sin(t*0.025)*0.03;
      bgStars.rotation.x = Math.cos(t*0.018)*0.015;
      galaxy1.rotation.y = t*0.005;
      galaxy2.rotation.y = -t*0.008;

      meshes.forEach((mesh, i) => {
        if (!mesh.userData.locked) mesh.scale.setScalar(1 + Math.sin(t + i*1.4)*0.12);
      });
      glows.forEach(({ mesh, base, phase }) => {
        mesh.material.opacity = base + Math.sin(t+phase)*0.04;
        mesh.scale.setScalar(1 + Math.sin(t+phase)*0.25);
      });

      renderer.render(scene, camera);
      // Aggiorna label DOM ogni frame — nessun lag React
      updateLabelDOM();
    };
    animate();

    // Resize
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Mouse
    const onMouseDown = (e) => {
      s.isDragging=true; s.hasDragged=false;
      s.mouseDownX=e.clientX; s.mouseDownY=e.clientY;
      s.panAtDown={x:s.targetPan.x, y:s.targetPan.y};
    };
    const onMouseMove = (e) => {
      if (!s.isDragging) return;
      const dx=e.clientX-s.mouseDownX, dy=e.clientY-s.mouseDownY;
      if (Math.abs(dx)>3||Math.abs(dy)>3) s.hasDragged=true;
      const f = s.zoom/window.innerWidth*1.8;
      s.targetPan.x=s.panAtDown.x-dx*f; s.targetPan.y=s.panAtDown.y+dy*f;
      clampPan();
    };
    const onMouseUp = (e) => {
      if (!s.isDragging) return;
      s.isDragging=false;
      if (!s.hasDragged) {
        const m = pick(e.clientX, e.clientY);
        if (m) { setSelected(m); setPanelOpen(true); }
        else   { setPanelOpen(false); setTimeout(()=>setSelected(null), 300); }
      }
    };
    const onWheel = (e) => {
      e.preventDefault();
      s.targetZoom = Math.max(3.5, Math.min(14, s.targetZoom + e.deltaY*0.01));
    };

    // Touch
    const getTouchDist = (t) => Math.hypot(t[0].clientX-t[1].clientX, t[0].clientY-t[1].clientY);
    const onTouchStart = (e) => {
      if (e.touches.length===1) {
        s.touchStartX=e.touches[0].clientX; s.touchStartY=e.touches[0].clientY;
        s.touchPanAtDown={x:s.targetPan.x,y:s.targetPan.y}; s.touchHasDragged=false; s.pinchDist=null;
      } else if (e.touches.length===2) { s.pinchDist=getTouchDist(e.touches); }
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length===1) {
        const dx=e.touches[0].clientX-s.touchStartX, dy=e.touches[0].clientY-s.touchStartY;
        if (Math.abs(dx)>6||Math.abs(dy)>6) s.touchHasDragged=true;
        const f=s.zoom/window.innerWidth*2.5;
        s.targetPan.x=s.touchPanAtDown.x-dx*f; s.targetPan.y=s.touchPanAtDown.y+dy*f;
        clampPan();
      } else if (e.touches.length===2 && s.pinchDist!==null) {
        const d=getTouchDist(e.touches);
        s.targetZoom=Math.max(3.5, Math.min(14, s.targetZoom-(d-s.pinchDist)*0.02));
        s.pinchDist=d;
      }
    };
    const onTouchEnd = (e) => {
      if (e.changedTouches.length===1 && !s.touchHasDragged) {
        const m=pick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        if (m) { setSelected(m); setPanelOpen(true); }
        else   { setPanelOpen(false); setTimeout(()=>setSelected(null),300); }
      }
      s.pinchDist=null;
    };

    canvas.addEventListener("mousedown",   onMouseDown);
    window.addEventListener("mousemove",   onMouseMove);
    window.addEventListener("mouseup",     onMouseUp);
    canvas.addEventListener("wheel",       onWheel,       { passive: false });
    canvas.addEventListener("touchstart",  onTouchStart,  { passive: true });
    canvas.addEventListener("touchmove",   onTouchMove,   { passive: false });
    canvas.addEventListener("touchend",    onTouchEnd,    { passive: true });

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
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missions.length]);

  const pct = selected
    ? Math.min(100, Math.round((selected.current_count / selected.required_events) * 100))
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: "#020b18", cursor: "grab" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ touchAction: "none" }} />

      {/* ── Label stelle — posizionate da updateLabelDOM() ogni frame ── */}
      <div ref={labelsRef} className="absolute inset-0 pointer-events-none select-none">
        {missions.map((m, i) => (
          <div key={i} style={{ position: "absolute", transform: "translateX(-50%)", textAlign: "center" }}>
            <div style={{
              fontSize: isMob ? 12 : 14, lineHeight: 1,
              filter: !m.unlocked ? "grayscale(1) opacity(0.2)" : "none",
            }}>
              {m.emoji}
            </div>
            <div style={{
              fontSize: isMob ? 7 : 9, fontWeight: 800, letterSpacing: "0.04em", marginTop: 2,
              color: !m.unlocked ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.65)",
              maxWidth: isMob ? 60 : 78, lineHeight: 1.2,
              textShadow: !m.unlocked ? "none" : "0 1px 8px rgba(0,0,0,0.9)",
            }}>
              {m.title}
            </div>
          </div>
        ))}
      </div>

      {/* ── Titolo ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.4em", color: "rgba(56,189,248,0.4)", textTransform: "uppercase" }}>Trama Viva</div>
        <div style={{ fontWeight: 900, fontSize: isMob ? 14 : 16, color: "rgba(255,255,255,0.72)", lineHeight: 1.2, marginTop: 2 }}>Costellazione delle Missioni</div>
      </div>

      {/* ── Back ── */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onBack}
        style={{
          position: "absolute", top: 14, left: 14, zIndex: 10,
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          color: "rgba(255,255,255,0.5)", borderRadius: 99,
          padding: isMob ? "8px 14px" : "8px 16px",
          fontSize: isMob ? 12 : 13, fontWeight: 700, cursor: "pointer",
        }}
      >
        <ChevronLeft size={13} /> Area soci
      </button>

      {/* ── Legenda ── */}
      <div className="pointer-events-none select-none" style={{
        position: "absolute",
        ...(isMob
          ? { bottom: 48, left: 14, display: "flex", flexDirection: "row", gap: 12 }
          : { bottom: 28, right: 18, display: "flex", flexDirection: "column", gap: 6 }),
        opacity: panelOpen && isMob ? 0 : 1, transition: "opacity 0.3s",
      }}>
        {[
          { color: "#f59e0b", label: "Completata" },
          { color: "#38bdf8", label: "Sbloccata" },
          { color: "#2a4a7f", label: "Bloccata", border: "rgba(255,255,255,0.18)" },
        ].map(({ color, label, border }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: color, boxShadow: `0 0 6px ${color}`, border: border ? `1px solid ${border}` : undefined }} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── Hint ── */}
      {!panelOpen && (
        <div className="pointer-events-none select-none" style={{
          position: "absolute", bottom: isMob ? 26 : 28, left: "50%", transform: "translateX(-50%)",
          fontSize: 9, color: "rgba(255,255,255,0.16)", fontWeight: 700,
          letterSpacing: "0.15em", textTransform: "uppercase", textAlign: "center", whiteSpace: "nowrap",
        }}>
          {isMob ? "Trascina · Pizzica per zoomare · Tocca una stella" : "Trascina per navigare · Scroll per zoomare · Clicca una stella"}
        </div>
      )}

      {/* ── Pannello dettaglio ── */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 20,
          transform: panelOpen ? "translateY(0)" : "translateY(110%)",
          transition: "transform 0.35s cubic-bezier(0.32,0.72,0,1)",
          background: "rgba(4,10,28,0.97)",
          borderTop: "1px solid rgba(56,189,248,0.16)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          padding: isMob ? "18px 18px 40px" : "24px 32px 44px",
          maxHeight: isMob ? "58vh" : "52vh",
          overflowY: "auto",
        }}
      >
        <button
          onClick={() => { setPanelOpen(false); setTimeout(()=>setSelected(null),300); }}
          style={{
            position: "absolute", top: 14, right: 14,
            width: 28, height: 28, borderRadius: 99,
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, cursor: "pointer",
          }}
        >✕</button>

        {selected && (
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{
                width: isMob?46:54, height: isMob?46:54, borderRadius: 13, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isMob?20:24,
                background: selected.unlocked ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)",
                border: selected.unlocked ? "1px solid rgba(245,158,11,0.32)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: selected.unlocked ? "0 0 18px rgba(245,158,11,0.18)" : "none",
                filter: selected.unlocked ? "none" : "grayscale(1) opacity(0.35)",
              }}>
                {selected.emoji}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginBottom:5 }}>
                  <span style={{ fontWeight:900, fontSize:isMob?14:15, color:selected.unlocked?"white":"rgba(255,255,255,0.25)", lineHeight:1.2 }}>
                    {selected.title}
                  </span>
                  {selected.unlocked && selected.current_count>=selected.required_events && (
                    <span style={{ fontSize:8, fontWeight:900, letterSpacing:"0.15em", background:"rgba(245,158,11,0.18)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.38)", padding:"2px 7px", borderRadius:99, textTransform:"uppercase" }}>✓ Completata</span>
                  )}
                  {selected.unlocked && selected.current_count<selected.required_events && (
                    <span style={{ fontSize:8, fontWeight:900, letterSpacing:"0.15em", background:"rgba(56,189,248,0.14)", color:"#38bdf8", border:"1px solid rgba(56,189,248,0.32)", padding:"2px 7px", borderRadius:99, textTransform:"uppercase" }}>In corso</span>
                  )}
                  {!selected.unlocked && (
                    <span style={{ fontSize:8, fontWeight:900, letterSpacing:"0.15em", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.1)", padding:"2px 7px", borderRadius:99, textTransform:"uppercase", display:"inline-flex", alignItems:"center", gap:3 }}>
                      <Lock size={7}/> Bloccata
                    </span>
                  )}
                </div>
                <p style={{ fontSize:isMob?11:12, color:"rgba(255,255,255,0.4)", lineHeight:1.6, margin:0 }}>
                  {selected.description}
                </p>
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:9, color:"rgba(255,255,255,0.28)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>Progressione</span>
                <span style={{ fontSize:10, color:selected.unlocked?"#38bdf8":"rgba(255,255,255,0.2)", fontWeight:800 }}>
                  {selected.current_count} / {selected.required_events} eventi
                </span>
              </div>
              <div style={{ height:4, background:"rgba(255,255,255,0.07)", borderRadius:99, overflow:"hidden" }}>
                <div style={{
                  height:"100%", width:`${pct}%`, borderRadius:99,
                  background: pct>=100 ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : selected.unlocked ? "linear-gradient(90deg,#38bdf8,#818cf8)" : "rgba(255,255,255,0.07)",
                  boxShadow: selected.unlocked&&pct>0 ? "0 0 10px rgba(56,189,248,0.4)" : "none",
                  transition:"width 0.9s ease",
                }} />
              </div>
            </div>

            {selected.reward && (
              <div style={{ display:"flex", alignItems:"center", gap:7, color:selected.unlocked?"#f59e0b":"rgba(255,255,255,0.16)", fontSize:isMob?11:12, fontWeight:700 }}>
                <Gift size={12}/> {selected.reward}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MissioniCostellazione;
