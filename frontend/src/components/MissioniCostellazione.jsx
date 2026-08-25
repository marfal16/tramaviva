import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ChevronLeft, Gift, Lock } from "lucide-react";

// ── Palette ────────────────────────────────────────────────────────────────────
const BG      = 0xf0ebe0;   // crema come logo
const WEB_DEF = 0xbcac90;   // filo default
const WEB_DN  = 0xc89020;   // filo completato (oro)
const WEB_AV  = 0x882015;   // filo disponibile (bordeaux)
const ND_DN   = 0xc8a020;   // nodo completato
const ND_AV   = 0x78141f;   // nodo disponibile
const ND_LK   = 0xc0b8a8;   // nodo bloccato
const SP_BDY  = 0xe07010;   // arancione logo
const SP_ABD  = 0xb85808;   // addome scuro
const SP_LEG  = 0x280c02;   // zampe scure
const SP_EYE  = 0xffee00;   // occhi gialli

// ── Struttura ragnatela ────────────────────────────────────────────────────────
const RADIALS = 6;
const RING_R  = [1.1, 2.1, 3.1, 4.1];
// Quali nodi hanno una missione (0=centro, 1-6=anello0, 7-12=anello1, ...)
const MISSION_IDX = [2, 4, 6, 8, 11, 14, 16, 19, 21, 23];

function buildGraph() {
  const pos = [new THREE.Vector3(0, 0, 0)];
  const adj = { 0: [] };
  const segs = [];

  for (let ring = 0; ring < 4; ring++) {
    for (let r = 0; r < RADIALS; r++) {
      const a = (r / RADIALS) * Math.PI * 2 - Math.PI / 2;
      pos.push(new THREE.Vector3(
        Math.cos(a) * RING_R[ring],
        0,
        Math.sin(a) * RING_R[ring]
      ));
      adj[pos.length - 1] = [];
    }
  }

  const link = (a, b) => {
    if (adj[a] && !adj[a].includes(b)) {
      adj[a].push(b); adj[b].push(a);
      segs.push([a, b]);
    }
  };

  for (let r = 0; r < RADIALS; r++) link(0, 1 + r);
  for (let ring = 0; ring < 3; ring++)
    for (let r = 0; r < RADIALS; r++)
      link(1 + ring * RADIALS + r, 1 + (ring + 1) * RADIALS + r);
  for (let ring = 0; ring < 4; ring++)
    for (let r = 0; r < RADIALS; r++)
      link(1 + ring * RADIALS + r, 1 + ring * RADIALS + (r + 1) % RADIALS);

  return { pos, adj, segs };
}

function bfs(adj, from, to) {
  if (from === to) return [from];
  const prev = { [from]: -1 };
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    for (const nb of (adj[cur] || [])) {
      if (prev[nb] === undefined) {
        prev[nb] = cur;
        if (nb === to) {
          const path = [];
          for (let n = to; n !== -1; n = prev[n]) path.unshift(n);
          return path;
        }
        q.push(nb);
      }
    }
  }
  return [from];
}

// ── Mesh ragno ────────────────────────────────────────────────────────────────
function buildSpider() {
  const g = new THREE.Group();

  const mOr  = new THREE.MeshPhongMaterial({ color: SP_BDY, shininess: 55 });
  const mAbd = new THREE.MeshPhongMaterial({ color: SP_ABD, shininess: 30 });
  const mLeg = new THREE.MeshPhongMaterial({ color: SP_LEG, shininess: 18 });
  const mEye = new THREE.MeshBasicMaterial({ color: SP_EYE });
  const mStr = new THREE.MeshPhongMaterial({ color: 0x1a0400 });

  // Torace
  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), mOr);
  thorax.position.y = 0.16;
  g.add(thorax);

  // Addome (ovale arancio scuro, dietro il torace)
  const abd = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), mAbd);
  abd.scale.set(0.82, 0.88, 1.18);
  abd.position.set(0, 0.14, -0.4);
  g.add(abd);

  // Strisce addome
  [-0.30, -0.42, -0.52].forEach((z, i) => {
    const r = 0.20 - i * 0.03;
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(r, 0.016, 5, 10), mStr);
    stripe.rotation.x = Math.PI / 2;
    stripe.position.set(0, 0.14, z);
    g.add(stripe);
  });

  // Occhi sul torace
  [[-0.048, 0.265, 0.10], [0.048, 0.265, 0.10], [-0.085, 0.250, 0.06], [0.085, 0.250, 0.06]].forEach(([ex, ey, ez]) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), mEye);
    e.position.set(ex, ey, ez);
    g.add(e);
  });

  // 8 zampe (4 per lato)
  const legData = [
    { xBase: 0.12, zBase: 0.10 },
    { xBase: 0.13, zBase: -0.02 },
    { xBase: 0.10, zBase: -0.14 },
    { xBase: 0.07, zBase: -0.26 },
  ];
  legData.forEach(({ xBase, zBase }) => {
    [-1, 1].forEach(side => {
      const base  = new THREE.Vector3(side * xBase, 0.10, zBase);
      const knee  = new THREE.Vector3(side * (xBase + 0.26), 0.22, zBase + side * 0.05);
      const tip   = new THREE.Vector3(side * (xBase + 0.52), 0.00, zBase + side * 0.10);
      const curve = new THREE.CatmullRomCurve3([base, knee, tip]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 6, 0.014, 4), mLeg));
    });
  });

  return g;
}

// ── Grafo globale ─────────────────────────────────────────────────────────────
const GRAPH = buildGraph();

// ── Componente principale ──────────────────────────────────────────────────────
export const MissioniCostellazione = ({ missionsData, onBack }) => {
  const mountRef  = useRef();
  const labelsRef = useRef();
  const stateRef  = useRef({
    currentNode:  0,
    path:         [],
    segT:         0,
    isMoving:     false,
    spiderMesh:   null,
    controls:     null,
    hitMeshes:    [],
    cameraTarget: new THREE.Vector3(0, 0, 0),
    facingAngle:  0,
    frameId:      null,
    renderer:     null,
    camera:       null,
    _updateNeighborHighlights: null,
  });

  const [selected,  setSelected]  = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [labelData, setLabelData] = useState([]);
  const [hint,      setHint]      = useState(true);

  const missions = missionsData?.missions || [];
  const isMob    = window.innerWidth < 768;

  const nodeState = useCallback((nodeIdx) => {
    const mi = MISSION_IDX.indexOf(nodeIdx);
    if (mi < 0 || mi >= missions.length) return "none";
    const m = missions[mi];
    if (!m.unlocked) return "locked";
    if (m.current_count >= m.required_events) return "done";
    return "available";
  }, [missions]);

  const threadColor = useCallback((a, b) => {
    const sa = nodeState(a), sb = nodeState(b);
    if (sa === "done"      && sb === "done")      return { c: WEB_DN, o: 0.90 };
    if (sa === "done"      || sb === "done")      return { c: WEB_DN, o: 0.55 };
    if (sa === "available" || sb === "available") return { c: WEB_AV, o: 0.55 };
    return { c: WEB_DEF, o: 0.35 };
  }, [nodeState]);

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
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    s.renderer = renderer;

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    scene.fog        = new THREE.Fog(BG, 16, 28);

    // ── Camera ────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 50);
    camera.position.set(0, 7, 10);
    s.camera = camera;

    // ── Luci ──────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xfff8ee, 0.9));
    const sun = new THREE.DirectionalLight(0xfff5dd, 1.5);
    sun.position.set(4, 10, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xdde8ff, 0.4);
    fill.position.set(-5, 3, -3);
    scene.add(fill);

    // ── Piano ombre ───────────────────────────────────────────────────────────
    const webPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.ShadowMaterial({ opacity: 0.07 })
    );
    webPlane.rotation.x = -Math.PI / 2;
    webPlane.receiveShadow = true;
    scene.add(webPlane);

    // ── OrbitControls ─────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping  = true;
    controls.dampingFactor  = 0.07;
    controls.enablePan      = false;
    controls.minDistance    = 3;
    controls.maxDistance    = 16;
    controls.maxPolarAngle  = Math.PI * 0.56;
    controls.minPolarAngle  = Math.PI * 0.10;
    controls.target.set(0, 0, 0);
    s.controls = controls;

    // ── Fili ragnatela ────────────────────────────────────────────────────────
    GRAPH.segs.forEach(([a, b]) => {
      const { c, o } = threadColor(a, b);
      const pts = [GRAPH.pos[a].clone(), GRAPH.pos[b].clone()];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o });
      scene.add(new THREE.Line(geo, mat));
    });

    // ── Nodi ──────────────────────────────────────────────────────────────────
    const hitMeshes = [];

    GRAPH.pos.forEach((p, idx) => {
      const mi = MISSION_IDX.indexOf(idx);
      if (mi < 0) {
        // Nodo di percorso
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 8, 8),
          new THREE.MeshPhongMaterial({ color: 0xb0a090, shininess: 20 })
        );
        m.position.copy(p);
        scene.add(m);
      } else {
        // Nodo missione
        const miss = missions[mi];
        const st   = nodeState(idx);
        const col  = st === "done" ? ND_DN : st === "available" ? ND_AV : ND_LK;
        const radius = st === "done" ? 0.20 : st === "available" ? 0.16 : 0.11;
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 16, 16),
          new THREE.MeshPhongMaterial({ color: col, shininess: 60, emissive: st === "done" ? 0x0d0800 : 0x000000 })
        );
        mesh.position.copy(p);
        mesh.castShadow  = true;
        mesh.userData    = { nodeIdx: idx, isMission: true, mission: miss, state: st };
        scene.add(mesh);
      }

      // Hit sphere invisibile (più grande per facilità click)
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(isMob ? 0.58 : 0.40, 6, 6),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      hit.position.copy(p);
      hit.userData = { nodeIdx: idx };
      scene.add(hit);
      hitMeshes.push(hit);
    });
    s.hitMeshes = hitMeshes;

    // ── Highlight nodi adiacenti ──────────────────────────────────────────────
    let neighborRings = [];
    const updateNeighborHighlights = () => {
      neighborRings.forEach(r => scene.remove(r));
      neighborRings = [];
      if (s.isMoving) return;
      (GRAPH.adj[s.currentNode] || []).forEach(nb => {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.26, 0.35, 16),
          new THREE.MeshBasicMaterial({ color: 0x52a060, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(GRAPH.pos[nb]);
        ring.position.y = 0.01;
        scene.add(ring);
        neighborRings.push(ring);
      });
    };
    updateNeighborHighlights();
    s._updateNeighborHighlights = updateNeighborHighlights;

    // ── Ragno ─────────────────────────────────────────────────────────────────
    const spider = buildSpider();
    spider.castShadow = true;
    spider.position.copy(GRAPH.pos[0]);
    scene.add(spider);
    s.spiderMesh = spider;

    // ── Label DOM update ──────────────────────────────────────────────────────
    const updateLabels = () => {
      camera.updateMatrixWorld(true);
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      const ww = window.innerWidth, hh = window.innerHeight;
      const cont = labelsRef.current;
      if (!cont) return;
      MISSION_IDX.forEach((nodeIdx, li) => {
        const el = cont.children[li];
        if (!el) return;
        const v = GRAPH.pos[nodeIdx].clone().project(camera);
        el.style.left = ((v.x * 0.5 + 0.5) * ww) + "px";
        el.style.top  = ((-v.y * 0.5 + 0.5) * hh - (isMob ? 28 : 34)) + "px";
      });
    };

    // ── Click / touch ─────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();

    const moveTo = (targetNode) => {
      if (targetNode === s.currentNode || s.isMoving) return;
      const path = bfs(GRAPH.adj, s.currentNode, targetNode);
      if (path.length <= 1) return;
      s.path     = path.slice(1);
      s.segT     = 0;
      s.isMoving = true;
      setHint(false);
      s._updateNeighborHighlights();
    };

    const handleClick = (cx, cy) => {
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera({
        x:  ((cx - rect.left) / rect.width)  * 2 - 1,
        y: -(((cy - rect.top) / rect.height) * 2 - 1),
      }, camera);
      const hits = raycaster.intersectObjects(hitMeshes);
      if (hits.length > 0) moveTo(hits[0].object.userData.nodeIdx);
    };

    let lastTap = 0;
    const onClick    = (e) => handleClick(e.clientX, e.clientY);
    const onTouchEnd = (e) => {
      const now = Date.now();
      if (now - lastTap < 350) {
        const t = e.changedTouches[0];
        handleClick(t.clientX, t.clientY);
      }
      lastTap = now;
    };
    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.addEventListener("touchend", onTouchEnd, { passive: true });

    // ── Tastiera WASD / frecce ────────────────────────────────────────────────
    const onKey = (e) => {
      if (s.isMoving) return;
      const cur       = GRAPH.pos[s.currentNode];
      const neighbors = GRAPH.adj[s.currentNode] || [];
      if (!neighbors.length) return;

      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      camDir.y = 0; camDir.normalize();
      const camRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), camDir).normalize();

      let moveDir = null;
      if (e.key === "ArrowUp"    || e.key === "w" || e.key === "W") moveDir = camDir.clone().negate();
      if (e.key === "ArrowDown"  || e.key === "s" || e.key === "S") moveDir = camDir.clone();
      if (e.key === "ArrowLeft"  || e.key === "a" || e.key === "A") moveDir = camRight.clone().negate();
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") moveDir = camRight.clone();
      if (!moveDir) return;

      e.preventDefault();
      let best = -1, bestDot = -999;
      neighbors.forEach(nb => {
        const d   = GRAPH.pos[nb].clone().sub(cur).normalize();
        const dot = d.dot(moveDir);
        if (dot > bestDot) { bestDot = dot; best = nb; }
      });
      if (best >= 0) moveTo(best);
    };
    window.addEventListener("keydown", onKey);

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ── Loop ──────────────────────────────────────────────────────────────────
    const WALK_SPEED = 1.8;
    let frameT = 0;

    const animate = () => {
      s.frameId = requestAnimationFrame(animate);
      frameT += 0.016;

      // Movimento ragno lungo il percorso
      if (s.isMoving && s.path.length > 0) {
        const fromPos = GRAPH.pos[s.currentNode];
        const toPos   = GRAPH.pos[s.path[0]];
        const dist    = fromPos.distanceTo(toPos);
        s.segT       += (WALK_SPEED * 0.016) / dist;

        // Direzione facciale
        const dir = toPos.clone().sub(fromPos);
        if (dir.length() > 0.001) {
          const targetAngle = Math.atan2(dir.x, dir.z);
          let da = targetAngle - s.facingAngle;
          while (da >  Math.PI) da -= Math.PI * 2;
          while (da < -Math.PI) da += Math.PI * 2;
          s.facingAngle += da * 0.20;
        }

        spider.position.lerpVectors(fromPos, toPos, Math.min(s.segT, 1));

        if (s.segT >= 1) {
          s.segT        = 0;
          s.currentNode = s.path[0];
          s.path        = s.path.slice(1);
          if (s.path.length === 0) {
            s.isMoving = false;
            s._updateNeighborHighlights();
            // Arrivati — apri missione se presente
            const mi = MISSION_IDX.indexOf(s.currentNode);
            if (mi >= 0 && mi < missions.length) {
              setSelected(missions[mi]);
              setPanelOpen(true);
            }
          }
        }
      } else {
        // Idle: respiro addome
        if (spider.children[1]) {
          spider.children[1].scale.z = 1.18 + Math.sin(frameT * 1.4) * 0.025;
        }
      }

      spider.rotation.y = s.facingAngle;
      // Piccolo rimbalzo quando cammina
      spider.position.y = s.isMoving ? Math.abs(Math.sin(frameT * 14)) * 0.06 : Math.abs(Math.sin(frameT * 1.5)) * 0.006;

      // Camera segue il ragno
      s.cameraTarget.lerp(spider.position, 0.06);
      controls.target.copy(s.cameraTarget);
      controls.update();

      renderer.render(scene, camera);
      updateLabels();
    };
    animate();

    // Label data iniziali
    setLabelData(MISSION_IDX.map((nodeIdx, mi) => {
      const m  = missions[mi];
      if (!m) return null;
      const st = nodeState(nodeIdx);
      return { mission: m, state: st };
    }).filter(Boolean));

    return () => {
      cancelAnimationFrame(s.frameId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("touchend", onTouchEnd);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missions.length]);

  const closePanel = () => {
    setPanelOpen(false);
    setTimeout(() => setSelected(null), 350);
  };

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

      {/* Label missioni — posizionate via DOM nel loop */}
      <div ref={labelsRef} className="absolute inset-0 pointer-events-none">
        {labelData.map((lp, i) => {
          if (!lp) return null;
          const col  = lp.state === "done" ? "#7a6000" : lp.state === "available" ? "#78141f" : "#8a8070";
          const glow = lp.state === "done"
            ? "0 1px 6px rgba(180,140,20,0.45)"
            : lp.state === "available"
            ? "0 1px 6px rgba(120,20,31,0.35)"
            : "none";
          return (
            <div key={i} style={{ position: "absolute", transform: "translateX(-50%)", textAlign: "center" }}>
              <div style={{ fontSize: isMob ? 13 : 15, lineHeight: 1, filter: lp.state === "locked" ? "grayscale(1) opacity(0.32)" : "none" }}>
                {lp.mission.emoji}
              </div>
              <div style={{ fontSize: isMob ? 7 : 9, fontWeight: 900, marginTop: 2, color: col, textShadow: glow, maxWidth: isMob ? 62 : 76, lineHeight: 1.2 }}>
                {lp.mission.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hint iniziale */}
      {hint && (
        <div className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2">
          <div style={{ background: "rgba(5,47,23,0.10)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderRadius: 99, padding: isMob ? "8px 18px" : "9px 22px", border: "1px solid rgba(5,47,23,0.14)", fontSize: isMob ? 12 : 13, color: "rgba(5,47,23,0.58)", fontWeight: 700, whiteSpace: "nowrap" }}>
            {isMob ? "Tocca due volte un nodo per muovere il ragno 🕷️" : "Clicca un nodo per muovere il ragno · WASD o frecce"}
          </div>
        </div>
      )}

      {/* Back */}
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={onBack}
        style={{ position: "absolute", top: 14, left: 14, zIndex: 10, display: "flex", alignItems: "center", gap: 6, background: "rgba(5,47,23,0.09)", border: "1px solid rgba(5,47,23,0.15)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", color: "rgba(5,47,23,0.62)", borderRadius: 99, padding: isMob ? "8px 14px" : "9px 18px", fontSize: isMob ? 12 : 13, fontWeight: 700, cursor: "pointer" }}
      >
        <ChevronLeft size={13} /> Area soci
      </button>

      {/* Titolo */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <div style={{ fontWeight: 900, fontSize: isMob ? 14 : 17, color: "rgba(5,47,23,0.72)", letterSpacing: "0.01em" }}>
          La Ragnatela delle Missioni
        </div>
        <div style={{ fontSize: isMob ? 9 : 10, color: "rgba(5,47,23,0.36)", marginTop: 3, fontStyle: "italic" }}>
          Guida il ragno · scopri le missioni
        </div>
      </div>

      {/* Legenda */}
      <div className="pointer-events-none" style={{ position: "absolute", bottom: 22, right: 16, display: "flex", flexDirection: "column", gap: 6, opacity: panelOpen && isMob ? 0 : 1, transition: "opacity 0.3s" }}>
        {[
          { color: "#c8a020", label: "Completata" },
          { color: "#78141f", label: "Disponibile" },
          { color: "#c0b8a8", label: "Bloccata" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: "rgba(5,47,23,0.36)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Pannello dettaglio */}
      <div
        onPointerDown={e => e.stopPropagation()}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 20, transform: panelOpen ? "translateY(0)" : "translateY(110%)", transition: "transform 0.38s cubic-bezier(0.32,0.72,0,1)", background: "rgba(244,239,229,0.97)", borderTop: `2px solid ${accentHex}55`, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", padding: isMob ? "20px 18px 48px" : "26px 36px 52px", maxHeight: isMob ? "60vh" : "52vh", overflowY: "auto" }}
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
                    <span style={{ fontWeight: 900, fontSize: isMob ? 15 : 17, color: selected.unlocked ? "rgba(5,47,23,0.88)" : "rgba(5,47,23,0.3)" }}>
                      {selected.title}
                    </span>
                    {done  && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", background: "rgba(200,160,32,0.12)", color: "#7a6000", border: "1px solid rgba(200,160,32,0.38)", padding: "3px 8px", borderRadius: 99, textTransform: "uppercase" }}>★ Completata</span>}
                    {avail && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", background: "rgba(120,20,31,0.08)", color: "#78141f", border: "1px solid rgba(120,20,31,0.3)", padding: "3px 8px", borderRadius: 99, textTransform: "uppercase" }}>◉ In corso</span>}
                    {!selected.unlocked && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", background: "rgba(5,47,23,0.05)", color: "rgba(5,47,23,0.3)", border: "1px solid rgba(5,47,23,0.1)", padding: "3px 8px", borderRadius: 99, textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 3 }}><Lock size={8} /> Bloccata</span>}
                  </div>
                  <p style={{ fontSize: isMob ? 12 : 13, color: "rgba(5,47,23,0.48)", lineHeight: 1.65, margin: 0 }}>{selected.description}</p>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
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
