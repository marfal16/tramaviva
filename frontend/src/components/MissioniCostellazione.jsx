import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ChevronLeft, Lock, Gift, CheckCircle } from "lucide-react";

// Posizioni predefinite per le stelle costellazione (x, y in unità scena)
const STAR_POSITIONS = [
  [-2.2,  1.1],
  [-0.7,  1.8],
  [ 0.8,  1.3],
  [ 2.3,  1.9],
  [ 2.9,  0.3],
  [ 1.6, -0.9],
  [ 0.2, -1.6],
  [-1.3, -1.4],
  [-2.5, -0.4],
  [ 0.4,  0.1],
];

const COLOR_DONE      = new THREE.Color(0xf59e0b); // ambra / completata
const COLOR_AVAILABLE = new THREE.Color(0x38bdf8); // sky blue / sbloccata
const COLOR_LOCKED    = new THREE.Color(0x1e3a5f); // blu scuro / bloccata

export const MissioniCostellazione = ({ missionsData, onBack }) => {
  const canvasRef   = useRef();
  const meshesRef   = useRef([]);
  const rendererRef = useRef();
  const frameRef    = useRef();

  const [labels, setLabels]           = useState([]);
  const [selected, setSelected]       = useState(null);
  const [panelVisible, setPanelVisible] = useState(false);

  const missions = missionsData?.missions || [];

  // ── Setup Three.js ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const W = window.innerWidth;
    const H = window.innerHeight;

    // Scene + camera
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500);
    camera.position.z = 7;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x05101e);
    rendererRef.current = renderer;

    // ── Stelle di sfondo ──────────────────────────────────────────────────────
    const N = 1800;
    const bgPos  = new Float32Array(N * 3);
    const bgAlpha = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      bgPos[i * 3]     = (Math.random() - 0.5) * 80;
      bgPos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      bgPos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
      bgAlpha[i] = Math.random();
    }
    const bgGeo = new THREE.BufferGeometry();
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    const bgMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.045, transparent: true, opacity: 0.5, sizeAttenuation: true });
    const bgStars = new THREE.Points(bgGeo, bgMat);
    scene.add(bgStars);

    // ── Stelle missione ───────────────────────────────────────────────────────
    const meshes  = [];
    const glows   = [];

    missions.forEach((m, i) => {
      const [x, y] = STAR_POSITIONS[i % STAR_POSITIONS.length];
      const done      = m.unlocked && m.current_count >= m.required_events;
      const available = m.unlocked && !done;
      const locked    = !m.unlocked;

      const color  = done ? COLOR_DONE : available ? COLOR_AVAILABLE : COLOR_LOCKED;
      const radius = done ? 0.13 : available ? 0.10 : 0.07;

      // Stella principale
      const geo  = new THREE.SphereGeometry(radius, 16, 16);
      const mat  = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0);
      mesh.userData = { mission: m, index: i, done, available, locked };
      scene.add(mesh);
      meshes.push(mesh);

      // Alone luminoso
      if (!locked) {
        const glowGeo = new THREE.SphereGeometry(radius * 3.5, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.07 });
        const glow    = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(x, y, 0);
        scene.add(glow);
        glows.push({ mesh: glow, baseOp: 0.07, phase: i * 1.3 });
      }
    });
    meshesRef.current = meshes;

    // ── Linee costellazione ───────────────────────────────────────────────────
    if (missions.length >= 2) {
      const pts = missions.map((_, i) => {
        const [x, y] = STAR_POSITIONS[i % STAR_POSITIONS.length];
        return new THREE.Vector3(x, y, 0);
      });
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.14 });
      scene.add(new THREE.Line(lineGeo, lineMat));
    }

    // ── Calcolo posizioni label (una volta sola) ──────────────────────────────
    const computeLabels = (w, h) =>
      meshes.map((mesh) => {
        const v = mesh.position.clone().project(camera);
        return {
          x: (v.x * 0.5 + 0.5) * w,
          y: (-v.y * 0.5 + 0.5) * h,
          mission: mesh.userData.mission,
          locked:  mesh.userData.locked,
        };
      });

    setLabels(computeLabels(W, H));

    // ── Animation loop ────────────────────────────────────────────────────────
    let t = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.012;

      bgStars.rotation.y = Math.sin(t * 0.04) * 0.025;
      bgStars.rotation.x = Math.sin(t * 0.025) * 0.012;

      meshes.forEach((mesh, i) => {
        if (!mesh.userData.locked) {
          mesh.scale.setScalar(1 + Math.sin(t + i * 1.4) * 0.12);
        }
      });
      glows.forEach(({ mesh, baseOp, phase }) => {
        mesh.material.opacity = baseOp + Math.sin(t + phase) * 0.045;
        mesh.scale.setScalar(1 + Math.sin(t + phase) * 0.25);
      });

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      setLabels(computeLabels(w, h));
    };
    window.addEventListener("resize", onResize);

    // ── Raycasting (click + touch) ────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    raycaster.params.Mesh = {};

    const pick = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const mx = ((clientX - rect.left) / rect.width)  * 2 - 1;
      const my = -((clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x: mx, y: my }, camera);
      const hits = raycaster.intersectObjects(meshes);
      if (hits.length > 0) {
        setSelected(hits[0].object.userData.mission);
        setPanelVisible(true);
      } else {
        setPanelVisible(false);
        setTimeout(() => setSelected(null), 300);
      }
    };

    const onClick    = (e) => pick(e.clientX, e.clientY);
    const onTouchEnd = (e) => { e.preventDefault(); pick(e.changedTouches[0].clientX, e.changedTouches[0].clientY); };

    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchend", onTouchEnd);
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missions.length]);

  const pct = selected
    ? Math.min(100, (selected.current_count / selected.required_events) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50" style={{ background: "#05101e" }}>
      {/* Canvas Three.js */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Titolo */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.35em", color: "rgba(56,189,248,0.5)", textTransform: "uppercase" }}>
          Trama Viva
        </div>
        <div style={{ fontWeight: 900, fontSize: 17, color: "rgba(255,255,255,0.8)", lineHeight: 1.2 }}>
          Costellazione delle Missioni
        </div>
      </div>

      {/* Back */}
      <button
        onClick={onBack}
        className="absolute top-5 left-5 flex items-center gap-2 text-sm font-bold transition-colors"
        style={{ color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: 99 }}
      >
        <ChevronLeft size={14} /> Area soci
      </button>

      {/* Legenda */}
      <div className="absolute bottom-6 right-5 flex flex-col gap-2 pointer-events-none select-none">
        {[
          { color: "#f59e0b", label: "Completata" },
          { color: "#38bdf8", label: "Sbloccata" },
          { color: "#1e3a5f", label: "Bloccata" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Label stelle */}
      {labels.map((lp, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none text-center"
          style={{ left: lp.x, top: lp.y - 28, transform: "translateX(-50%)" }}
        >
          <div style={{ fontSize: 14, lineHeight: 1, filter: lp.locked ? "grayscale(1) opacity(0.25)" : "none" }}>
            {lp.mission.emoji}
          </div>
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.05em", marginTop: 2,
            color: lp.locked ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.7)",
            maxWidth: 80, textAlign: "center", lineHeight: 1.2,
            textShadow: lp.locked ? "none" : "0 1px 8px rgba(0,0,0,0.8)",
          }}>
            {lp.mission.title}
          </div>
        </div>
      ))}

      {/* Pannello dettaglio missione */}
      <div
        className="absolute left-0 right-0 bottom-0 transition-transform duration-300 ease-out"
        style={{
          transform: panelVisible ? "translateY(0)" : "translateY(110%)",
          background: "rgba(8,18,38,0.97)",
          borderTop: "1px solid rgba(56,189,248,0.2)",
          backdropFilter: "blur(20px)",
          padding: "24px 24px 32px",
          maxHeight: "55vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {selected && (
          <div className="max-w-xl mx-auto">
            {/* Header missione */}
            <div className="flex items-start gap-4 mb-4">
              <div style={{
                width: 56, height: 56, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, flexShrink: 0,
                background: selected.unlocked ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)",
                border: selected.unlocked ? "1px solid rgba(245,158,11,0.35)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: selected.unlocked ? "0 0 20px rgba(245,158,11,0.2)" : "none",
                filter: selected.unlocked ? "none" : "grayscale(1) opacity(0.4)",
              }}>
                {selected.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span style={{ fontWeight: 900, fontSize: 16, color: selected.unlocked ? "white" : "rgba(255,255,255,0.3)", lineHeight: 1.2 }}>
                    {selected.title}
                  </span>
                  {selected.unlocked && selected.current_count >= selected.required_events && (
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.15em", background: "rgba(245,158,11,0.18)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.4)", padding: "2px 8px", borderRadius: 99, textTransform: "uppercase" }}>
                      ✓ Completata
                    </span>
                  )}
                  {selected.unlocked && selected.current_count < selected.required_events && (
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.15em", background: "rgba(56,189,248,0.15)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.35)", padding: "2px 8px", borderRadius: 99, textTransform: "uppercase" }}>
                      In corso
                    </span>
                  )}
                  {!selected.unlocked && (
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.15em", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 99, textTransform: "uppercase" }}>
                      <Lock size={8} style={{ display: "inline", marginRight: 3 }} />Bloccata
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0 }}>
                  {selected.description}
                </p>
              </div>
            </div>

            {/* Barra progresso */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Progressione</span>
                <span style={{ fontSize: 10, color: selected.unlocked ? "#38bdf8" : "rgba(255,255,255,0.25)", fontWeight: 800 }}>
                  {selected.current_count} / {selected.required_events} eventi
                </span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${pct}%`, borderRadius: 99,
                  background: selected.current_count >= selected.required_events
                    ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                    : selected.unlocked
                    ? "linear-gradient(90deg,#38bdf8,#818cf8)"
                    : "rgba(255,255,255,0.1)",
                  boxShadow: selected.unlocked ? "0 0 10px rgba(56,189,248,0.5)" : "none",
                  transition: "width 0.8s ease",
                }} />
              </div>
            </div>

            {/* Premio */}
            {selected.reward && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: selected.unlocked ? "#f59e0b" : "rgba(255,255,255,0.2)", fontSize: 12, fontWeight: 700 }}>
                <Gift size={13} /> {selected.reward}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hint tocca */}
      {labels.length > 0 && !panelVisible && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none select-none"
          style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", textAlign: "center" }}
        >
          Tocca una stella per scoprire la missione
        </div>
      )}
    </div>
  );
};

export default MissioniCostellazione;
