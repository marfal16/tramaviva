import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls }   from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer }  from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass }      from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ChevronLeft, Gift, Lock } from "lucide-react";

// ── Palette Trama Viva ────────────────────────────────────────────────────────
const BG         = 0x030a05;
const C_CREAM    = new THREE.Color(0xf5f0e8);
const C_GOLD     = new THREE.Color(0xc8a030);   // missione completata
const C_BORD     = new THREE.Color(0x78141f);   // missione disponibile
const C_LOCKED   = new THREE.Color(0x1c2a1c);   // bloccata
const C_WEB      = new THREE.Color(0xd4c9a8);   // filo base
const C_WEB_DONE = new THREE.Color(0xe8d070);   // filo completato
const C_WEB_AVAIL= new THREE.Color(0xaa3020);   // filo disponibile

// ── Struttura ragnatela: 6 raggi × 4 anelli ──────────────────────────────────
const RADIALS = 6;
const RINGS   = [1.0, 1.85, 2.7, 3.5];

// 10 posizioni missioni sulla ragnatela (anello, raggio)
const MISSION_J = [
  [0,0],[0,2],[0,4],
  [1,1],[1,3],[1,5],
  [2,0],[2,2],[2,4],
  [3,3],
];

function jPos(ring, rad) {
  const a = (rad / RADIALS) * Math.PI * 2 + Math.PI * 0.5;
  const r = RINGS[ring];
  const z = Math.sin(a * 1.8) * 0.15 * (ring * 0.6 + 0.3);
  return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z);
}

function ease(t) { return t < 0.5 ? 2*t*t : 1-((-2*t+2)**2)*0.5; }

// ── Stringa filo con sag ──────────────────────────────────────────────────────
function makeThread(from, to, color, opacity, scene) {
  const mid = from.clone().lerp(to, 0.5);
  const dist = from.distanceTo(to);
  mid.y -= dist * 0.035;
  mid.z  = (from.z + to.z) * 0.5;
  const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
  const pts   = curve.getPoints(18);
  const geo   = new THREE.BufferGeometry().setFromPoints(pts);
  const mat   = new THREE.LineBasicMaterial({
    color, transparent:true, opacity,
    blending: THREE.AdditiveBlending, depthWrite:false,
  });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  return line;
}

// ── Ragno 3D ──────────────────────────────────────────────────────────────────
function buildSpider() {
  const g = new THREE.Group();

  const mBody = new THREE.MeshPhongMaterial({ color:0x0a120a, shininess:120, specular:0x334433 });
  const mAbd  = new THREE.MeshPhongMaterial({ color:0x78141f, shininess:60,  specular:0x441122, emissive:0x180005 });
  const mLeg  = new THREE.MeshPhongMaterial({ color:0x0d180d, shininess:50 });
  const mEye  = new THREE.MeshBasicMaterial({ color:0xddaa00 });

  // Torace
  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), mBody);
  g.add(thorax);

  // Addome (bordeaux, ovale)
  const abd = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 14), mAbd);
  abd.position.set(-0.26, -0.02, 0);
  abd.scale.set(1, 1.05, 1.12);
  g.add(abd);

  // 4 coppie di occhi sul torace anteriore
  [[-0.024, 0.044],[ 0.024, 0.044],[-0.048, 0.016],[ 0.048, 0.016]].forEach(([ez,ey]) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), mEye);
    eye.position.set(0.10, ey, ez);
    g.add(eye);
  });

  // Zampe: 4 per lato con TubeGeometry (CatmullRomCurve3)
  [0.12, 0.36, 0.63, 0.87].forEach((frac) => {
    [-1, 1].forEach(side => {
      const sx = -0.08 - frac * 0.06,  sy = -0.01, sz = side * 0.10;
      const kx = sx - 0.12,           ky = -0.03 - frac*0.02, kz = side*(0.10 + 0.20 + frac*0.12);
      const tx = kx - 0.09,           ty = ky - 0.06,         tz = side*(0.10 + 0.16 + frac*0.22);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sx, sy, sz),
        new THREE.Vector3(kx, ky, kz),
        new THREE.Vector3(tx, ty, tz),
      ]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 6, 0.014, 4, false), mLeg));
    });
  });

  return g;
}

export const MissioniCostellazione = ({ missionsData, onBack }) => {
  const mountRef  = useRef();
  const labelsRef = useRef();
  const stateRef  = useRef({
    spider: null, controls: null, composer: null, renderer: null, camera: null,
    nodes: [], threads: [],
    spiderPos:   new THREE.Vector3(0,0,0.4),
    spiderTarget:new THREE.Vector3(0,0,0.4),
    spiderT:0, isCrawling:false, returnAfter:false,
    frameId: null, t:0,
  });

  const [selected, setSelected]   = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [labelData, setLabelData] = useState([]);

  const missions = missionsData?.missions || [];
  const isMob    = window.innerWidth < 768;

  useEffect(() => {
    const container = mountRef.current;
    const W = window.innerWidth, H = window.innerHeight;
    const s = stateRef.current;

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    scene.fog    = new THREE.FogExp2(BG, 0.055);
    scene.background = new THREE.Color(BG);

    const camera = new THREE.PerspectiveCamera(55, W/H, 0.1, 100);
    camera.position.set(0, 1.5, 8);
    s.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping        = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);
    s.renderer = renderer;

    // ── Luci ─────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0d1a0d, 0.8));
    const centerLight = new THREE.PointLight(0xf5eedd, 2.0, 12);
    centerLight.position.set(0, 0, 1.5);
    scene.add(centerLight);
    const rimLight = new THREE.PointLight(0x78141f, 0.8, 8);
    rimLight.position.set(-3, 2, -1);
    scene.add(rimLight);

    // ── OrbitControls ─────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping    = true;
    controls.dampingFactor    = 0.06;
    controls.autoRotate       = true;
    controls.autoRotateSpeed  = 0.35;
    controls.enablePan        = false;
    controls.minDistance      = 4;
    controls.maxDistance      = 14;
    controls.maxPolarAngle    = Math.PI * 0.72;
    controls.minPolarAngle    = Math.PI * 0.18;
    s.controls = controls;

    // ── Hub centrale ─────────────────────────────────────────────────────────
    const hub = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshBasicMaterial({ color:0xf5f0e8 })
    );
    scene.add(hub);

    // ── Fili ragnatela ────────────────────────────────────────────────────────
    const HUB   = new THREE.Vector3(0, 0, 0);
    const threads = [];

    // funzione di stato filo: max completamento delle missioni adiacenti
    const getMissionState = (ring, rad) => {
      const idx = MISSION_J.findIndex(([mr,mm]) => mr===ring && mm===rad);
      if (idx < 0 || idx >= missions.length) return "locked";
      const m = missions[idx];
      if (!m.unlocked) return "locked";
      if (m.current_count >= m.required_events) return "done";
      return "available";
    };

    const strandColor = (state) => state === "done" ? C_WEB_DONE : state === "available" ? C_WEB_AVAIL : C_WEB;
    const strandOpacity = (state) => state === "done" ? 0.85 : state === "available" ? 0.40 : 0.08;

    // Fili raggi (hub → ogni giunzione lungo ciascun raggio)
    for (let r = 0; r < RADIALS; r++) {
      let prev = HUB.clone();
      for (let ring = 0; ring < RINGS.length; ring++) {
        const next   = jPos(ring, r);
        const state  = getMissionState(ring, r);
        const line   = makeThread(prev, next, strandColor(state), strandOpacity(state), scene);
        threads.push(line);
        prev = next.clone();
      }
    }

    // Fili anello (tra raggi adiacenti per ogni anello)
    for (let ring = 0; ring < RINGS.length; ring++) {
      for (let r = 0; r < RADIALS; r++) {
        const from  = jPos(ring, r);
        const to    = jPos(ring, (r+1) % RADIALS);
        const s1    = getMissionState(ring, r);
        const s2    = getMissionState(ring, (r+1) % RADIALS);
        const state = (s1 === "done" || s2 === "done") ? "done" : (s1 === "available" || s2 === "available") ? "available" : "locked";
        const line  = makeThread(from, to, strandColor(state), strandOpacity(state), scene);
        threads.push(line);
      }
    }
    s.threads = threads;

    // ── Nodi missione ─────────────────────────────────────────────────────────
    const nodes    = [];
    const hitMeshes= [];

    missions.forEach((m, i) => {
      const [ring, rad] = MISSION_J[i % MISSION_J.length];
      const pos   = jPos(ring, rad);
      const done  = m.unlocked && m.current_count >= m.required_events;
      const avail = m.unlocked && !done;
      const locked= !m.unlocked;
      const color = done ? C_GOLD : avail ? C_BORD : C_LOCKED;
      const radius= done ? 0.14 : avail ? 0.11 : 0.07;

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 16, 16),
        new THREE.MeshPhongMaterial({ color, shininess:80, emissive: done ? 0x1a0f00 : avail ? 0x100003 : 0x000000 })
      );
      sphere.position.copy(pos);
      sphere.userData = { mission:m, done, avail, locked, pos:pos.clone() };
      scene.add(sphere);
      nodes.push(sphere);

      // Glow sprite per non-locked
      if (!locked) {
        const glowGeo = new THREE.SphereGeometry(radius * 3.5, 10, 10);
        const glowMat = new THREE.MeshBasicMaterial({
          color, transparent:true, opacity:0.08,
          blending: THREE.AdditiveBlending, depthWrite:false
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.copy(pos);
        scene.add(glow);
        sphere.userData.glow = glow;
      }

      // Hit sphere invisibile
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(isMob ? 0.4 : 0.28, 6, 6),
        new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false })
      );
      hit.position.copy(pos);
      hit.userData = sphere.userData;
      scene.add(hit);
      hitMeshes.push(hit);
    });
    s.nodes    = nodes;

    // ── Ragno ─────────────────────────────────────────────────────────────────
    const spider = buildSpider();
    spider.position.set(0, 0, 0.45);
    scene.add(spider);
    s.spider = spider;

    // Filo di seta che si srotola quando si muove (aggiornato ogni frame)
    const silkPoints = [new THREE.Vector3(0,0,0.45), new THREE.Vector3(0,0,0.45)];
    const silkGeo = new THREE.BufferGeometry().setFromPoints(silkPoints);
    const silkMat = new THREE.LineBasicMaterial({ color:0xf5f0e8, transparent:true, opacity:0.6, blending:THREE.AdditiveBlending });
    const silkLine = new THREE.Line(silkGeo, silkMat);
    scene.add(silkLine);

    // ── EffectComposer + Bloom ────────────────────────────────────────────────
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(isMob ? W/2 : W, isMob ? H/2 : H),
      isMob ? 0.8 : 1.0, 0.6, 0.15
    ));
    s.composer = composer;

    // ── Label DOM helper ──────────────────────────────────────────────────────
    const updateLabels = () => {
      camera.updateMatrixWorld(true);
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      const ww = window.innerWidth, hh = window.innerHeight;
      const off = isMob ? 22 : 26;
      const next = nodes.map(node => {
        const v = node.position.clone().project(camera);
        return { x:(v.x*0.5+0.5)*ww, y:(-v.y*0.5+0.5)*hh - off, mission:node.userData.mission, done:node.userData.done, avail:node.userData.avail, locked:node.userData.locked };
      });
      // direct DOM update
      const container = labelsRef.current;
      if (container) {
        next.forEach((lp, i) => {
          const el = container.children[i];
          if (!el) return;
          el.style.left = lp.x + "px";
          el.style.top  = lp.y + "px";
        });
      }
    };

    // ── Raycasting ────────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    let lastTap = 0;

    const pick = (cx, cy) => {
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera({
        x:((cx-rect.left)/rect.width)*2-1,
        y:-(((cy-rect.top)/rect.height)*2-1),
      }, camera);
      const hits = raycaster.intersectObjects(hitMeshes);
      return hits.length > 0 ? hits[0].object.userData : null;
    };

    // ── Click / touch ─────────────────────────────────────────────────────────
    const onClick = (e) => {
      const data = pick(e.clientX, e.clientY);
      if (data) {
        setSelected(data.mission);
        setPanelOpen(true);
        // Spider crawls to that node
        s.spiderTarget   = data.pos.clone().add(new THREE.Vector3(0, 0, 0.45));
        s.spiderT        = 0;
        s.isCrawling     = true;
        s.returnAfter    = false;
        controls.autoRotate = false;
      }
    };
    const onTouchEnd = (e) => {
      const now = Date.now();
      if (now - lastTap < 300) { // double tap for mobile as click
        const t = e.changedTouches[0];
        onClick({ clientX:t.clientX, clientY:t.clientY });
      }
      lastTap = now;
    };
    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.addEventListener("touchend", onTouchEnd, { passive:true });

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w=window.innerWidth, h=window.innerHeight;
      camera.aspect=w/h; camera.updateProjectionMatrix();
      renderer.setSize(w,h); composer.setSize(w,h);
    };
    window.addEventListener("resize", onResize);

    // ── Animation loop ────────────────────────────────────────────────────────
    const HUB3D = new THREE.Vector3(0, 0, 0.45);
    let t = 0;
    const animate = () => {
      s.frameId = requestAnimationFrame(animate);
      t += 0.012;
      s.t = t;

      controls.update();

      // Spider crawl
      if (s.isCrawling) {
        s.spiderT = Math.min(1, s.spiderT + 0.022);
        spider.position.lerpVectors(HUB3D, s.spiderTarget, ease(s.spiderT));
        spider.lookAt(s.spiderTarget);
        if (s.spiderT >= 1) s.isCrawling = false;
      }

      // Subtle spider idle animations
      spider.position.y += Math.sin(t * 2.5) * 0.0006;
      const abd = spider.children[1];
      if (abd) abd.scale.setScalar(1 + Math.sin(t * 1.8) * 0.025);

      // Update silk line: from center to spider
      const silkPts = [HUB3D.clone(), spider.position.clone()];
      silkGeo.setFromPoints(silkPts);
      silkGeo.attributes.position.needsUpdate = true;
      silkMat.opacity = s.isCrawling ? 0.7 : 0.3;

      // Pulse mission nodes
      nodes.forEach((node, i) => {
        if (!node.userData.locked) {
          const pulse = 1 + Math.sin(t + i * 1.1) * (node.userData.done ? 0.12 : 0.08);
          node.scale.setScalar(pulse);
          const glow = node.userData.glow;
          if (glow) glow.material.opacity = 0.08 + Math.sin(t + i * 1.1) * 0.04;
        }
      });

      centerLight.intensity = 1.8 + Math.sin(t * 1.2) * 0.4;

      composer.render();
      updateLabels();
    };
    animate();

    // ── Aggiungi label iniziali ───────────────────────────────────────────────
    setLabelData(missions.map((m, i) => {
      const done  = m.unlocked && m.current_count >= m.required_events;
      const avail = m.unlocked && !done;
      return { mission:m, done, avail, locked:!m.unlocked };
    }));

    return () => {
      cancelAnimationFrame(s.frameId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("touchend", onTouchEnd);
      controls.dispose();
      composer.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missions.length]);

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelected(null), 350);
    // Spider ritorna al centro
    const s = stateRef.current;
    s.spiderTarget   = new THREE.Vector3(0, 0, 0.45);
    s.spiderT        = 0;
    s.isCrawling     = true;
    if (s.controls) s.controls.autoRotate = true;
  };

  const accentHex = selected?.unlocked
    ? (selected.current_count >= selected.required_events ? "#c8a030" : "#78141f")
    : "rgba(255,255,255,0.3)";
  const pct = selected
    ? Math.min(100, Math.round((selected.current_count / selected.required_events) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none" style={{ background:"#030a05" }}>
      {/* Canvas Three.js — il renderer ci appende il suo canvas */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* Vignetta */}
      <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at center, transparent 55%, rgba(3,10,5,0.65) 100%)" }} />

      {/* Label missioni — posizionate dal loop via DOM */}
      <div ref={labelsRef} className="absolute inset-0 pointer-events-none">
        {labelData.map((lp, i) => {
          const col = lp.done ? "#c8a030" : lp.avail ? "#a03020" : "rgba(200,210,200,0.2)";
          return (
            <div key={i} style={{ position:"absolute", transform:"translateX(-50%)", textAlign:"center" }}>
              <div style={{ fontSize: isMob?12:14, lineHeight:1, filter:lp.locked?"grayscale(1) opacity(0.2)":"none" }}>{lp.mission.emoji}</div>
              <div style={{ fontSize:isMob?7:9, fontWeight:900, marginTop:2, color:col, textShadow:!lp.locked?`0 0 8px ${col}`:"none", maxWidth:isMob?62:78, lineHeight:1.2 }}>{lp.mission.title}</div>
            </div>
          );
        })}
      </div>

      {/* Titolo */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <div style={{ fontSize:8, fontWeight:900, letterSpacing:"0.45em", color:"rgba(212,201,168,0.4)", textTransform:"uppercase" }}>Trama Viva</div>
        <div style={{ fontWeight:900, fontSize:isMob?15:18, color:"rgba(245,240,232,0.85)", letterSpacing:"0.01em", marginTop:2 }}>La Ragnatela delle Missioni</div>
        <div style={{ fontSize:isMob?10:11, color:"rgba(212,201,168,0.4)", marginTop:3, fontStyle:"italic" }}>Trascina per ruotare · {isMob?"tocca":"clicca"} una missione</div>
      </div>

      {/* Back */}
      <button onPointerDown={(e)=>e.stopPropagation()} onClick={onBack} style={{ position:"absolute",top:14,left:14,zIndex:10,display:"flex",alignItems:"center",gap:6,background:"rgba(245,240,232,0.07)",border:"1px solid rgba(245,240,232,0.14)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",color:"rgba(245,240,232,0.55)",borderRadius:99,padding:isMob?"8px 14px":"9px 18px",fontSize:isMob?12:13,fontWeight:700,cursor:"pointer" }}>
        <ChevronLeft size={13}/> Area soci
      </button>

      {/* Legenda */}
      <div className="pointer-events-none" style={{ position:"absolute", ...(isMob?{bottom:52,left:14,display:"flex",flexDirection:"row",gap:14}:{bottom:30,right:20,display:"flex",flexDirection:"column",gap:8}), opacity:panelOpen&&isMob?0:1,transition:"opacity 0.3s" }}>
        {[
          { color:"#c8a030", glow:"rgba(200,160,48,0.7)", label:"Completata" },
          { color:"#78141f", glow:"rgba(120,20,31,0.7)",  label:"Disponibile" },
          { color:"#2a3a2a", glow:"none",                  label:"Bloccata" },
        ].map(({ color,glow,label }) => (
          <div key={label} style={{ display:"flex",alignItems:"center",gap:7 }}>
            <div style={{ width:9,height:9,borderRadius:"50%",background:color,boxShadow:glow!=="none"?`0 0 7px ${glow}`:undefined,flexShrink:0 }} />
            <span style={{ fontSize:9,color:"rgba(245,240,232,0.35)",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Pannello dettaglio */}
      <div onPointerDown={(e)=>e.stopPropagation()} style={{ position:"absolute",left:0,right:0,bottom:0,zIndex:20,transform:panelOpen?"translateY(0)":"translateY(110%)",transition:"transform 0.38s cubic-bezier(0.32,0.72,0,1)",background:"rgba(4,10,5,0.97)",borderTop:`1px solid ${accentHex}55`,backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",padding:isMob?"20px 18px 44px":"26px 36px 48px",maxHeight:isMob?"62vh":"55vh",overflowY:"auto" }}>

        <button onClick={closePanel} style={{ position:"absolute",top:14,right:14,width:30,height:30,borderRadius:99,background:"rgba(245,240,232,0.07)",border:"1px solid rgba(245,240,232,0.12)",color:"rgba(245,240,232,0.45)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,cursor:"pointer" }}>✕</button>

        {selected && (() => {
          const done = selected.current_count >= selected.required_events;
          return (
            <div style={{ maxWidth:540,margin:"0 auto" }}>
              <div style={{ display:"flex",gap:16,alignItems:"flex-start",marginBottom:18 }}>
                <div style={{ width:isMob?52:62,height:isMob?52:62,borderRadius:16,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isMob?24:28,background:`${accentHex}18`,border:`1px solid ${accentHex}40`,boxShadow:selected.unlocked?`0 0 24px ${accentHex}22`:"none",filter:selected.unlocked?"none":"grayscale(1) opacity(0.3)" }}>
                  {selected.emoji}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6 }}>
                    <span style={{ fontWeight:900,fontSize:isMob?15:17,color:selected.unlocked?"rgba(245,240,232,0.95)":"rgba(245,240,232,0.25)" }}>{selected.title}</span>
                    {selected.unlocked && done && <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.12em",background:"rgba(200,160,48,0.15)",color:"#c8a030",border:"1px solid rgba(200,160,48,0.38)",padding:"3px 8px",borderRadius:99,textTransform:"uppercase" }}>★ Completata</span>}
                    {selected.unlocked && !done && <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.12em",background:"rgba(120,20,31,0.15)",color:"#a03838",border:"1px solid rgba(120,20,31,0.4)",padding:"3px 8px",borderRadius:99,textTransform:"uppercase" }}>◉ In corso</span>}
                    {!selected.unlocked && <span style={{ fontSize:9,fontWeight:900,letterSpacing:"0.12em",background:"rgba(245,240,232,0.05)",color:"rgba(245,240,232,0.22)",border:"1px solid rgba(245,240,232,0.1)",padding:"3px 8px",borderRadius:99,textTransform:"uppercase",display:"inline-flex",alignItems:"center",gap:3 }}><Lock size={8}/> Bloccata</span>}
                  </div>
                  <p style={{ fontSize:isMob?12:13,color:"rgba(245,240,232,0.42)",lineHeight:1.65,margin:0 }}>{selected.description}</p>
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                  <span style={{ fontSize:10,color:"rgba(245,240,232,0.3)",fontWeight:800,letterSpacing:"0.1em",textTransform:"uppercase" }}>Progressione</span>
                  <span style={{ fontSize:12,color:selected.unlocked?accentHex:"rgba(245,240,232,0.2)",fontWeight:900 }}>{selected.current_count} / {selected.required_events}</span>
                </div>
                <div style={{ height:5,background:"rgba(245,240,232,0.08)",borderRadius:99,overflow:"hidden" }}>
                  <div style={{ height:"100%",width:`${pct}%`,borderRadius:99,background:selected.unlocked?(done?"linear-gradient(90deg,#c8a030,#e8c850)":"linear-gradient(90deg,#78141f,#a82030)"):"rgba(245,240,232,0.1)",boxShadow:selected.unlocked&&pct>0?`0 0 12px ${accentHex}88`:"none",transition:"width 1s ease" }} />
                </div>
              </div>

              {selected.reward && (
                <div style={{ display:"flex",alignItems:"center",gap:8,color:selected.unlocked?accentHex:"rgba(245,240,232,0.18)",fontSize:isMob?12:13,fontWeight:800,background:`${accentHex}14`,border:`1px solid ${accentHex}30`,padding:"10px 14px",borderRadius:12 }}>
                  <Gift size={14}/> {selected.reward}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default MissioniCostellazione;
