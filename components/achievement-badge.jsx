"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

const BADGE_COLORS = {
  none: ["#64748b", "#94a3b8", "#cbd5e1"],
  bronze: ["#9a5a2e", "#d98b49", "#ffe0b2"],
  silver: ["#94a3b8", "#e2e8f0", "#ffffff"],
  gold: ["#c9860a", "#ffd45a", "#fff4b8"],
  platinum: ["#7dd3fc", "#dbeafe", "#ffffff"]
};

function BadgeScene({ tier }) {
  const badgeRef = useRef(null);
  const ringRef = useRef(null);
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        angle: (Math.PI * 2 * index) / 18,
        radius: 0.78 + (index % 3) * 0.08,
        size: 0.018 + (index % 4) * 0.004
      })),
    []
  );
  const colors = BADGE_COLORS[tier] || BADGE_COLORS.none;

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;

    if (badgeRef.current) {
      badgeRef.current.rotation.y += delta * 0.72;
      badgeRef.current.rotation.x = Math.sin(elapsed * 0.9) * 0.12;
      badgeRef.current.scale.setScalar(1 + Math.sin(elapsed * 1.8) * 0.025);
    }

    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.85;
      ringRef.current.rotation.x = 1.15 + Math.sin(elapsed * 0.7) * 0.08;
    }
  });

  return (
    <group>
      <group ref={badgeRef}>
        <mesh>
          <cylinderGeometry args={[0.46, 0.46, 0.14, 6]} />
          <meshStandardMaterial color={colors[0]} metalness={0.58} roughness={0.2} emissive={colors[0]} emissiveIntensity={0.12} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.31, 0.31, 0.03, 6]} />
          <meshStandardMaterial color={colors[1]} metalness={0.72} roughness={0.16} emissive={colors[1]} emissiveIntensity={0.18} />
        </mesh>
        <mesh position={[0, 0.105, 0]}>
          <torusGeometry args={[0.22, 0.012, 8, 48]} />
          <meshBasicMaterial color={colors[2]} transparent opacity={0.7} />
        </mesh>
      </group>

      <mesh ref={ringRef} rotation={[1.15, 0, 0]}>
        <torusGeometry args={[0.68, 0.01, 8, 80]} />
        <meshBasicMaterial color={colors[2]} transparent opacity={0.55} />
      </mesh>

      {particles.map((particle, index) => (
        <mesh
          key={index}
          position={[
            Math.cos(particle.angle) * particle.radius,
            Math.sin(particle.angle * 1.3) * 0.08,
            Math.sin(particle.angle) * particle.radius
          ]}
        >
          <sphereGeometry args={[particle.size, 8, 8]} />
          <meshStandardMaterial color={index % 2 ? colors[1] : colors[2]} emissive={colors[1]} emissiveIntensity={0.65} />
        </mesh>
      ))}
    </group>
  );
}

export default function AchievementBadge({ tier = "none", label = "No badge yet" }) {
  return (
    <div className={`achievement-badge achievement-badge-${tier}`} aria-label={label} role="img">
      <Canvas camera={{ position: [0, 0, 2.45], fov: 42 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <ambientLight intensity={1.35} />
        <directionalLight intensity={2.2} position={[1.6, 2.4, 2.1]} />
        <pointLight color="#ffffff" intensity={2.4} position={[-1.4, -0.6, 1.8]} />
        <BadgeScene tier={tier} />
      </Canvas>
    </div>
  );
}
