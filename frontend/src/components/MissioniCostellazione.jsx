import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ChevronLeft, Gift, Lock } from "lucide-react";

// ── Palette ────────────────────────────────────────────────────────────────────
const BG     = 0xf0ebe0;
const WEB_C  = 0xbcac90;
const WEB_DN = 0xc89020;
const WEB_AV = 0x882015;
const ND_DN  = 0xc8a020;
const ND_AV  = 0x78141f;
const ND_LK  = 0xd0c8b8;
const SP_BDY = 0xe07010;
const SP_ABD = 0xb85808;
const SP_LEG = 0x280c02;
const SP_EYE = 0xffee00;

// ── Ragnatela ─────────────────────────────────────────────────────────────────
const RADIALS = 6;
const RING_R  = [1.2, 2.3, 3.4, 4.5];

// 10 nodi missione (ring, radial)
const MISSION_DEFS = [
  [0,0],[0,2],[0,4],
  [1,1],[1,3],[1,5],
  [2,0],[2,2],[2,4],
  [3,3],
];

function ringPos(ring, r) {
  const a = (r / RADIALS) * Math.PI * 2 - Math.PI / 2;
  return new THREE.Vector3(Math.cos(a) * RING_R[ring], 0, Math.sin(a) * RING_R[ring]);
}

function buildWeb() {
  const nodes = [new THREE.Vector3(0, 0, 0)]; // 0 = centro
  for (let ring = 0; ring < 4; ring++)
    for (let r = 0; r < RADIALS; r++)
      nodes.push(ringPos(ring, r));

  const segs = [];
  for (let r = 0; r < RADIALS; r++) segs.push([0, 1 + r]);
  for (let ring = 0; ring < 3; ring++)
    for (let r = 0; r < RADIALS; r++)
      segs.push([1 + ring*RADIALS + r, 1 + (ring+1)*RADIALS + r]);
  for (let ring = 0; ring < 4; ring++)
    for (let r = 0; r < RADIALS; r++)
      segs.push([1 + ring*RADIALS + r, 1 + ring*RADIALS + (r+1)%RADIALS]);

  return { nodes, segs };
}

// ── Spider mesh — stile cartoon gentile ───────────────────────────────────────
function buildSpider() {
  const g = new THREE.Group();

  const mOr    = new THREE.MeshPhongMaterial({ color: 0xee7515, shininess: 90 });
  const mAbd   = new THREE.MeshPhongMaterial({ color: 0xcc5808, shininess: 50 });
  const mLeg   = new THREE.MeshPhongMaterial({ color: 0x220800, shininess: 30 });
  const mEyeY  = new THREE.MeshPhongMaterial({ color: 0xffee22, shininess: 120, emissive: 0x221100 });
  const mPupil = new THREE.MeshBasicMaterial({ color: 0x110000 });
  const mHl    = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mCheek = new THREE.MeshPhongMaterial({ color: 0xff9090, transparent: true, opacity: 0.45 });
  const mStr   = new THREE.MeshPhongMaterial({ color: 0x441800 });

  // Testa/torace grande e rotonda
  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), mOr);
  thorax.position.y = 0.22;
  g.add(thorax);

  // Addome più piccolo e carino
  const abd = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), mAbd);
  abd.scale.set(0.80, 0.92, 1.10);
  abd.position.set(0, 0.20, -0.42);
  g.add(abd);

  // Strisce addome
  [[-0.32, 0.19], [-0.43, 0.15], [-0.52, 0.11]].forEach(([z, r]) => {
    const s = new THREE.Mesh(new THREE.TorusGeometry(r, 0.014, 5, 10), mStr);
    s.rotation.x = Math.PI / 2;
    s.position.set(0, 0.20, z);
    g.add(s);
  });

  // Occhi grandi cartoon (due principali)
  [-0.10, 0.10].forEach(ex => {
    const eyeOut = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 12), mEyeY);
    eyeOut.position.set(ex, 0.35, 0.18);
    g.add(eyeOut);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), mPupil);
    pupil.position.set(ex, 0.35, 0.24);
    g.add(pupil);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.020, 6, 6), mHl);
    hl.position.set(ex + 0.028, 0.375, 0.27);
    g.add(hl);
  });

  // Occhi secondari piccoli
  [-0.20, 0.20].forEach(ex => {
    const eyeS = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), mEyeY);
    eyeS.position.set(ex, 0.30, 0.14);
    g.add(eyeS);
    const pupilS = new THREE.Mesh(new THREE.SphereGeometry(0.020, 6, 6), mPupil);
    pupilS.position.set(ex, 0.30, 0.19);
    g.add(pupilS);
  });

  // Guancette rosse (cute!)
  [-0.19, 0.19].forEach(ex => {
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mCheek);
    cheek.scale.set(1, 0.55, 0.35);
    cheek.position.set(ex, 0.235, 0.17);
    g.add(cheek);
  });

  // Zampe corte e cicciotte
  [
    { xBase: 0.18, zBase:  0.10 },
    { xBase: 0.20, zBase: -0.02 },
    { xBase: 0.17, zBase: -0.14 },
    { xBase: 0.13, zBase: -0.26 },
  ].forEach(({ xBase, zBase }) => {
    [-1, 1].forEach(side => {
      const base  = new THREE.Vector3(side * xBase, 0.14, zBase);
      const knee  = new THREE.Vector3(side * (xBase + 0.20), 0.30, zBase + side * 0.04);
      const tip   = new THREE.Vector3(side * (xBase + 0.38), 0.01, zBase + side * 0.08);
      const curve = new THREE.CatmullRomCurve3([base, knee, tip]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 6, 0.022, 5), mLeg));
    });
  });

  return g;
}

// ── Joystick mobile (componente puro HTML/React) ───────────────────────────────
function Joystick({ onMove }) {
  const baseRef = useRef();
  const knobRef = useRef();
  const touch   = useRef(null);
  const R       = 50; // raggio joystick

  const onTouchStart = (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    touch.current = { id: t.identifier, bx: t.clientX, by: t.clientY };
  };
  const onTouchMove = (e) => {
    if (!touch.current) return;
    e.preventDefault();
    const t = Array.from(e.touches).find(t => t.identifier === touch.current.id);
    if (!t) return;
    const dx = t.clientX - touch.current.bx;
    const dy = t.clientY - touch.current.by;
    const dist = Math.min(Math.hypot(dx, dy), R);
    const a    = Math.atan2(dy, dx);
    const nx   = Math.cos(a) * dist / R;
    const ny   = Math.sin(a) * dist / R;
    onMove(nx, ny);
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(calc(-50% + ${nx*R}px), calc(-50% + ${ny*R}px))`;
    }
  };
  const onTouchEnd = (e) => {
    touch.current = null;
    onMove(0, 0);
    if (knobRef.current) knobRef.current.style.transform = "translate(-50%, -50%)";
  };

  return (
    <div
      ref={baseRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ position: "absolute", bottom: 36, left: 36, width: 100, height: 100, borderRadius: "50%", background: "rgba(5,47,23,0.12)", border: "2px solid rgba(5,47,23,0.22)", touchAction: "none", zIndex: 10 }}
    >
      <div
        ref={knobRef}
        style={{ position: "absolute", top: "50%", left: "50%", width: 42, height: 42, borderRadius: "50%", background: "rgba(5,47,23,0.30)", transform: "translate(-50%,-50%)", pointerEvents: "none" }}
      />
    </div>
  );
}

// ── Componente principale ──────────────────────────────────────────────────────
const WEB = buildWeb();

export const MissioniCostellazione = ({ missionsData, onBack }) => {
  const mountRef = useRef();
  const stateRef = useRef({
    pos:      new THREE.Vector3(0, 0, 0),
    yaw:      0,
    keys:     new Set(),
    joy:      { x: 0, y: 0 },
    spider:   null,
    camera:   null,
    renderer: null,
    frameId:  null,
    mNodes:   [],          // {pos, mesh, glowMesh, mission, state}
    legPhase: 0,
    camPos:   new THREE.Vector3(0, 1.1, 2.8),
    nearNode: -1,
    triggered:new Set(),   // indici già triggerati in questa sessione
  });

  const [selected,  setSelected]  = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isMob]                   = useState(() => window.innerWidth < 768);
  const [hint, setHint]           = useState(true);

  const missions = missionsData?.missions || [];

  const missionState = (m) => {
    if (!m?.unlocked) return "locked";
    if (m.current_count >= m.required_events) return "done";
    return "available";
  };

  useEffect(() => {
    if (!missions.length) return;
    const container = mountRef.current;
    const W = window.innerWidth, H = window.innerHeight;
    const s = stateRef.current;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    container.appendChild(renderer.domElement);
    s.renderer = renderer;

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    scene.fog        = new THREE.Fog(BG, 8, 22);

    // ── Camera (terza persona, segue il ragno) ────────────────────────────────
    const CAM_Z = isMob ? 2.2 : 2.8;
    const CAM_Y = isMob ? 0.9 : 1.1;
    const camera = new THREE.PerspectiveCamera(58, W / H, 0.05, 50);
    // Spider parte con yaw=0, forward=(0,0,1), quindi camera sta a z negativo
    camera.position.set(0, CAM_Y, -CAM_Z);
    s.camPos.set(0, CAM_Y, -CAM_Z);
    camera.lookAt(new THREE.Vector3(0, 0.3, 1.0));
    s.camera = camera;

    // ── Luci ──────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xfff8ee, 1.0));
    const sun = new THREE.DirectionalLight(0xfff0dd, 1.6);
    sun.position.set(5, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far  = 30;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -8;
    sun.shadow.camera.right = sun.shadow.camera.top   =  8;
    scene.add(sun);
    const fillLight = new THREE.DirectionalLight(0xddeeff, 0.35);
    fillLight.position.set(-4, 4, -3);
    scene.add(fillLight);

    // ── Piano (ombra sotto il ragno) ──────────────────────────────────────────
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.ShadowMaterial({ opacity: 0.06 })
    );
    floor.rotation.x  = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // ── Fili ragnatela con TubeGeometry (visibili da vicino) ──────────────────
    WEB.segs.forEach(([a, b]) => {
      const pA = WEB.nodes[a], pB = WEB.nodes[b];
      const isMissionA = MISSION_DEFS.some(([ring, r]) => {
        const idx = 1 + ring * RADIALS + r;
        return idx === a;
      });
      const isMissionB = MISSION_DEFS.some(([ring, r]) => {
        const idx = 1 + ring * RADIALS + r;
        return idx === b;
      });
      const col = (isMissionA || isMissionB) ? WEB_C : WEB_C;

      // Filo con leggero sag
      const mid = pA.clone().lerp(pB, 0.5);
      mid.y -= pA.distanceTo(pB) * 0.02;
      const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
      const geo   = new THREE.TubeGeometry(curve, 8, 0.018, 5, false);
      const mat   = new THREE.MeshPhongMaterial({ color: col, shininess: 10, transparent: true, opacity: 0.55 });
      const mesh  = new THREE.Mesh(geo, mat);
      scene.add(mesh);
    });

    // ── Nodi missione ─────────────────────────────────────────────────────────
    const mNodes = [];
    MISSION_DEFS.forEach(([ring, r], mi) => {
      const m   = missions[mi];
      const pos = ring === -1 ? new THREE.Vector3(0, 0, 0) : ringPos(ring, r);
      pos.y     = 0.01;
      const st  = missionState(m);
      const col = st === "done" ? ND_DN : st === "available" ? ND_AV : ND_LK;
      const rad = st === "done" ? 0.22 : st === "available" ? 0.18 : 0.12;

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(rad, 16, 16),
        new THREE.MeshPhongMaterial({ color: col, shininess: 80, emissive: st === "done" ? 0x0a0700 : 0 })
      );
      mesh.position.copy(pos);
      mesh.castShadow = true;
      scene.add(mesh);

      // Glow ring sotto
      const glowMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: THREE.DoubleSide });
      const glowRing = new THREE.Mesh(new THREE.RingGeometry(rad * 1.4, rad * 2.4, 20), glowMat);
      glowRing.rotation.x = -Math.PI / 2;
      glowRing.position.copy(pos);
      glowRing.position.y = 0.005;
      scene.add(glowRing);

      mNodes.push({ pos: pos.clone(), mesh, glowMesh: glowRing, glowMat, mission: m, state: st });
    });
    s.mNodes = mNodes;

    // Hub centrale
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), new THREE.MeshPhongMaterial({ color: 0xb0a080, shininess: 30 }));
    hub.position.set(0, 0.01, 0);
    scene.add(hub);

    // ── Ragno ─────────────────────────────────────────────────────────────────
    const spider = buildSpider();
    spider.castShadow = true;
    spider.receiveShadow = false;
    scene.add(spider);
    s.spider = spider;

    // ── Input tastiera ────────────────────────────────────────────────────────
    const onKeyDown = (e) => { s.keys.add(e.key); setHint(false); };
    const onKeyUp   = (e) => { s.keys.delete(e.key); };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup",   onKeyUp);

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ── Loop ──────────────────────────────────────────────────────────────────
    const TURN_SPEED = 2.2;
    const MOVE_SPEED = 1.8;
    const MAX_R      = 4.8;
    const TRIG_DIST  = 0.75;
    const dt         = 1 / 60;
    let frameT       = 0;

    const animate = () => {
      s.frameId = requestAnimationFrame(animate);
      frameT += dt;

      // ── Input ──────────────────────────────────────────────────────────────
      const K   = s.keys;
      const joy = s.joy;

      let turn  = 0, move = 0;
      if (K.has("ArrowLeft")  || K.has("a") || K.has("A")) turn += 1;
      if (K.has("ArrowRight") || K.has("d") || K.has("D")) turn -= 1;
      if (K.has("ArrowUp")    || K.has("w") || K.has("W")) move  = 1;
      if (K.has("ArrowDown")  || K.has("s") || K.has("S")) move  = -1;
      // Joystick
      if (Math.abs(joy.x) > 0.1) turn -= joy.x;
      if (Math.abs(joy.y) > 0.1) move  = -joy.y;

      // ── Movimento ragno ────────────────────────────────────────────────────
      s.yaw += turn * TURN_SPEED * dt;
      const fwd = new THREE.Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw));
      const vel = fwd.clone().multiplyScalar(move * MOVE_SPEED * dt);
      s.pos.add(vel);

      // Confine ragnatela
      const dist2d = Math.sqrt(s.pos.x * s.pos.x + s.pos.z * s.pos.z);
      if (dist2d > MAX_R) {
        s.pos.x *= MAX_R / dist2d;
        s.pos.z *= MAX_R / dist2d;
      }

      // ── Mesh ragno ────────────────────────────────────────────────────────
      spider.position.set(s.pos.x, 0, s.pos.z);
      spider.rotation.y = s.yaw;

      // Camminata: rimbalzo + zampe
      const isMoving = Math.abs(move) > 0.05 || Math.abs(joy.y) > 0.1;
      if (isMoving) {
        spider.position.y = Math.abs(Math.sin(frameT * 14)) * 0.05;
        s.legPhase += dt * 12;
        // Anima zampe
        spider.children.forEach((child, ci) => {
          if (ci > 6) child.rotation.z = Math.sin(s.legPhase + ci * 0.8) * 0.08;
        });
      } else {
        spider.position.y = Math.abs(Math.sin(frameT * 1.5)) * 0.006;
        // Respiro addome idle
        if (spider.children[1]) spider.children[1].scale.z = 1.20 + Math.sin(frameT * 1.3) * 0.02;
      }

      // ── Camera terza persona ───────────────────────────────────────────────
      const behind = fwd.clone().negate().multiplyScalar(CAM_Z);
      const desiredCam = new THREE.Vector3(
        s.pos.x + behind.x,
        CAM_Y,
        s.pos.z + behind.z
      );
      s.camPos.lerp(desiredCam, 0.09);
      camera.position.copy(s.camPos);
      const lookAt = new THREE.Vector3(s.pos.x + fwd.x * 1.2, 0.28, s.pos.z + fwd.z * 1.2);
      camera.lookAt(lookAt);

      // ── Proximity missioni ─────────────────────────────────────────────────
      s.mNodes.forEach((mn, i) => {
        const d = s.pos.distanceTo(mn.pos);
        const near = d < TRIG_DIST;
        // Glow ring
        mn.glowMat.opacity = near
          ? 0.35 + Math.sin(frameT * 5) * 0.12
          : Math.max(0, mn.glowMat.opacity - 0.04);
        // Trigger missione (solo se unlocked, solo una volta per sessione di avvicinamento)
        if (near && mn.state !== "locked" && !s.triggered.has(i)) {
          s.triggered.add(i);
          setSelected(mn.mission);
          setPanelOpen(true);
        }
        if (!near && s.triggered.has(i)) {
          s.triggered.delete(i); // reset quando si allontana
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(s.frameId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup",   onKeyUp);
      window.removeEventListener("resize",  onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missions.length]);

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelected(null), 350);
  };

  const onJoyMove = (x, y) => { stateRef.current.joy = { x, y }; setHint(false); };

  const accentHex = selected?.unlocked
    ? (selected.current_count >= selected.required_events ? "#c8a020" : "#78141f")
    : "#a09080";
  const pct = selected
    ? Math.min(100, Math.round((selected.current_count / selected.required_events) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none" style={{ background: "#f0ebe0" }}>
      {/* Canvas Three.js */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* Back */}
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={onBack}
        style={{ position: "absolute", top: 14, left: 14, zIndex: 11, display: "flex", alignItems: "center", gap: 6, background: "rgba(5,47,23,0.10)", border: "1px solid rgba(5,47,23,0.18)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", color: "rgba(5,47,23,0.65)", borderRadius: 99, padding: isMob ? "8px 14px" : "9px 18px", fontSize: isMob ? 12 : 13, fontWeight: 700, cursor: "pointer" }}
      >
        <ChevronLeft size={13} /> Area soci
      </button>

      {/* Titolo */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center pointer-events-none" style={{ zIndex: 11 }}>
        <div style={{ fontWeight: 900, fontSize: isMob ? 14 : 16, color: "rgba(5,47,23,0.70)" }}>La Ragnatela delle Missioni</div>
        <div style={{ fontSize: isMob ? 9 : 10, color: "rgba(5,47,23,0.35)", marginTop: 2, fontStyle: "italic" }}>
          Guida il ragno · scopri le missioni
        </div>
      </div>

      {/* Hint iniziale */}
      {hint && !panelOpen && (
        <div className="pointer-events-none" style={{ position: "absolute", bottom: isMob ? 160 : 30, left: "50%", transform: "translateX(-50%)", zIndex: 11 }}>
          <div style={{ background: "rgba(5,47,23,0.09)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderRadius: 99, padding: "8px 20px", border: "1px solid rgba(5,47,23,0.14)", fontSize: isMob ? 11 : 12, color: "rgba(5,47,23,0.55)", fontWeight: 700, whiteSpace: "nowrap" }}>
            {isMob ? "🕷️ Usa il joystick · avvicinati ai nodi per scoprire le missioni" : "🕷️ Usa le frecce · avvicinati ai nodi per scoprire le missioni"}
          </div>
        </div>
      )}

      {/* Joystick mobile */}
      {isMob && !panelOpen && <Joystick onMove={onJoyMove} />}

      {/* Legenda desktop */}
      {!isMob && (
        <div className="pointer-events-none" style={{ position: "absolute", bottom: 22, right: 16, display: "flex", flexDirection: "column", gap: 5, opacity: panelOpen ? 0 : 1, transition: "opacity 0.3s", zIndex: 11 }}>
          {[["#c8a020","Completata"],["#78141f","Disponibile"],["#c0b8a8","Bloccata"]].map(([color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
              <span style={{ fontSize: 9, color: "rgba(5,47,23,0.34)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pannello dettaglio missione */}
      <div
        onPointerDown={e => e.stopPropagation()}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 20, transform: panelOpen ? "translateY(0)" : "translateY(110%)", transition: "transform 0.38s cubic-bezier(0.32,0.72,0,1)", background: "rgba(244,239,229,0.97)", borderTop: `2px solid ${accentHex}55`, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", padding: isMob ? "20px 18px 52px" : "26px 36px 52px", maxHeight: isMob ? "60vh" : "50vh", overflowY: "auto" }}
      >
        <button onClick={closePanel} style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: 99, background: "rgba(5,47,23,0.07)", border: "1px solid rgba(5,47,23,0.12)", color: "rgba(5,47,23,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>✕</button>

        {selected && (() => {
          const done  = selected.current_count >= selected.required_events;
          const avail = selected.unlocked && !done;
          const color = done ? "#c8a020" : avail ? "#78141f" : "#9a9080";
          return (
            <div style={{ maxWidth: 540, margin: "0 auto" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
                <div style={{ width: isMob ? 52 : 62, height: isMob ? 52 : 62, borderRadius: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMob ? 24 : 28, background: `${color}18`, border: `1px solid ${color}44`, filter: selected.unlocked ? "none" : "grayscale(1) opacity(0.4)" }}>
                  {selected.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{ fontWeight: 900, fontSize: isMob ? 15 : 17, color: selected.unlocked ? "rgba(5,47,23,0.88)" : "rgba(5,47,23,0.3)" }}>{selected.title}</span>
                    {done  && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", background: "rgba(200,160,32,0.12)", color: "#7a6000", border: "1px solid rgba(200,160,32,0.38)", padding: "3px 8px", borderRadius: 99, textTransform: "uppercase" }}>★ Completata</span>}
                    {avail && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", background: "rgba(120,20,31,0.08)", color: "#78141f", border: "1px solid rgba(120,20,31,0.3)", padding: "3px 8px", borderRadius: 99, textTransform: "uppercase" }}>◉ In corso</span>}
                    {!selected.unlocked && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", background: "rgba(5,47,23,0.05)", color: "rgba(5,47,23,0.3)", border: "1px solid rgba(5,47,23,0.1)", padding: "3px 8px", borderRadius: 99, textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 3 }}><Lock size={8} /> Bloccata</span>}
                  </div>
                  <p style={{ fontSize: isMob ? 12 : 13, color: "rgba(5,47,23,0.48)", lineHeight: 1.65, margin: 0 }}>{selected.description}</p>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: "rgba(5,47,23,0.32)", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>Progressione</span>
                  <span style={{ fontSize: 12, color: selected.unlocked ? color : "rgba(5,47,23,0.22)", fontWeight: 900 }}>{selected.current_count} / {selected.required_events}</span>
                </div>
                <div style={{ height: 5, background: "rgba(5,47,23,0.08)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: selected.unlocked ? (done ? "linear-gradient(90deg,#c8a020,#e8c040)" : "linear-gradient(90deg,#78141f,#a82030)") : "rgba(5,47,23,0.1)", transition: "width 1s ease" }} />
                </div>
              </div>

              {selected.reward && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: selected.unlocked ? color : "rgba(5,47,23,0.2)", fontSize: isMob ? 12 : 13, fontWeight: 800, background: `${color}12`, border: `1px solid ${color}30`, padding: "10px 14px", borderRadius: 12 }}>
                  <Gift size={14} /> {selected.reward}
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
