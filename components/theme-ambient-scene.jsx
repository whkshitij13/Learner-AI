"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";

const THEME_SCENES = {
  "aurora-notes": { color: "#8da2ff", accent: "#73f0d3", mode: "particles" },
  "voyager-postcards": { color: "#ff0033", accent: "#3ea6ff", mode: "video" },
  "pixel-arcade": { color: "#66c0f4", accent: "#a4d007", mode: "gaming" },
  "ocean-logbook": { color: "#1db954", accent: "#6ee7b7", mode: "music" },
  "forest-camp": { color: "#4ade80", accent: "#f4b860", mode: "nature" },
  "sports-pulse": { color: "#ff5a36", accent: "#ffd166", mode: "sports" },
  "studio-ink": { color: "#9ca3af", accent: "#111827", mode: "minimal" },
  "retro-terminal": { color: "#ffa116", accent: "#2cbb5d", mode: "code" },
  "sunset-journal": { color: "#ff996f", accent: "#7bdff2", mode: "travel" },
  "festival-pop": { color: "#3772ff", accent: "#ffb703", mode: "creative" }
};

function useThemePreset() {
  const [preset, setPreset] = useState("aurora-notes");

  useEffect(() => {
    function syncPreset() {
      setPreset(document.body.dataset.themePreset || "aurora-notes");
    }

    syncPreset();
    const observer = new MutationObserver(syncPreset);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-theme-preset"] });

    return () => observer.disconnect();
  }, []);

  return preset;
}

function AmbientGlyphs({ scene }) {
  const groupRef = useRef(null);
  const codeLines = useMemo(
    () => ["const learn = true", "while(flow) study()", "map(topic => skill)", "return mastery"],
    []
  );

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y += delta * 0.08;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.12;
  });

  return (
    <group ref={groupRef}>
      {scene.mode === "nature" ? (
        <>
          {[-2.8, -1.6, -0.4, 0.8, 2.1].map((x, index) => (
            <group key={x} position={[x, -1.35 + (index % 2) * 0.16, -index * 0.12]}>
              <mesh>
                <coneGeometry args={[0.34, 1.1, 7]} />
                <meshStandardMaterial color={scene.color} roughness={0.72} />
              </mesh>
              <mesh position={[0, -0.72, 0]}>
                <cylinderGeometry args={[0.055, 0.075, 0.52, 6]} />
                <meshStandardMaterial color="#7c4f2d" roughness={0.85} />
              </mesh>
            </group>
          ))}
          <mesh position={[1.95, 0.15, -0.7]} rotation={[0.2, 0, -0.24]}>
            <planeGeometry args={[0.5, 2.8, 12, 12]} />
            <meshStandardMaterial color={scene.accent} transparent opacity={0.42} />
          </mesh>
        </>
      ) : null}

      {scene.mode === "code" ? (
        codeLines.map((line, index) => (
          <Float floatIntensity={0.5} key={line} speed={1 + index * 0.15}>
            <mesh position={[-2.4 + index * 0.38, 1.2 - index * 0.55, -index * 0.18]} rotation={[0, 0, -0.05]}>
              <boxGeometry args={[line.length * 0.055, 0.035, 0.035]} />
              <meshStandardMaterial color={index % 2 ? scene.accent : scene.color} emissive={index % 2 ? scene.accent : scene.color} emissiveIntensity={0.5} />
            </mesh>
          </Float>
        ))
      ) : null}

      {scene.mode === "gaming" ? (
        <>
          <Float speed={2} floatIntensity={0.8}>
            <mesh position={[-1.5, -0.2, 0]} rotation={[0.1, 0.25, 0]}>
              <boxGeometry args={[0.72, 0.42, 0.42]} />
              <meshStandardMaterial color={scene.color} metalness={0.35} roughness={0.22} />
            </mesh>
          </Float>
          {[0, 1, 2].map((item) => (
            <mesh key={item} position={[0.1 + item * 0.7, -0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.5, 12]} />
              <meshStandardMaterial color={scene.accent} emissive={scene.accent} emissiveIntensity={0.8} />
            </mesh>
          ))}
        </>
      ) : null}

      {scene.mode === "sports" ? (
        [0, 1, 2, 3].map((item) => (
          <Float floatIntensity={0.65} key={item} speed={1.7 + item * 0.2}>
            <mesh position={[-2 + item * 1.15, Math.sin(item) * 0.45, -item * 0.12]}>
              <sphereGeometry args={[0.18 + item * 0.025, 24, 24]} />
              <meshStandardMaterial color={item % 2 ? scene.accent : scene.color} emissive={item % 2 ? scene.accent : scene.color} emissiveIntensity={0.35} />
            </mesh>
          </Float>
        ))
      ) : null}

      {scene.mode === "travel" ? (
        <>
          <mesh position={[-1.1, 0.15, 0]} rotation={[0.2, 0, -0.45]}>
            <torusGeometry args={[0.72, 0.035, 12, 80]} />
            <meshStandardMaterial color={scene.accent} emissive={scene.accent} emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[0.9, -0.05, -0.3]} rotation={[0, 0, -0.62]}>
            <coneGeometry args={[0.22, 0.75, 3]} />
            <meshStandardMaterial color={scene.color} roughness={0.3} />
          </mesh>
        </>
      ) : null}

      {["particles", "video", "music", "minimal", "creative"].includes(scene.mode)
        ? [0, 1, 2, 3, 4, 5].map((item) => (
            <Float floatIntensity={0.45 + item * 0.05} key={item} speed={1.1 + item * 0.15}>
              <mesh position={[-2.4 + item * 0.9, Math.sin(item * 1.7) * 0.8, -item * 0.18]} rotation={[item * 0.2, item * 0.15, item * 0.3]}>
                {scene.mode === "video" ? <boxGeometry args={[0.42, 0.26, 0.04]} /> : scene.mode === "music" ? <torusGeometry args={[0.18, 0.035, 10, 24]} /> : <icosahedronGeometry args={[0.16, 1]} />}
                <meshStandardMaterial color={item % 2 ? scene.accent : scene.color} emissive={item % 2 ? scene.accent : scene.color} emissiveIntensity={0.24} roughness={0.32} />
              </mesh>
            </Float>
          ))
        : null}
    </group>
  );
}

export default function ThemeAmbientScene() {
  const preset = useThemePreset();
  const scene = THEME_SCENES[preset] || THEME_SCENES["aurora-notes"];

  return (
    <div className="theme-ambient-scene" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 5.2], fov: 48 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.9} />
        <directionalLight color={scene.color} intensity={1.1} position={[3, 4, 4]} />
        <pointLight color={scene.accent} intensity={5.4} position={[-3, -2, 2]} />
        <Stars radius={40} depth={18} count={preset === "studio-ink" ? 160 : 520} factor={preset === "studio-ink" ? 1.1 : 1.8} saturation={0} fade speed={0.18} />
        <AmbientGlyphs scene={scene} />
      </Canvas>
    </div>
  );
}
