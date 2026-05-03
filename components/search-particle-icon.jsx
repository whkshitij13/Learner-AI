"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

function ParticleSearchGlyph({ active }) {
  const groupRef = useRef(null);
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 18;
        const radius = 0.72 + (index % 3) * 0.11;

        return {
          angle,
          radius,
          size: 0.018 + (index % 4) * 0.006,
          speed: 0.55 + (index % 5) * 0.08
        };
      }),
    []
  );

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }

    const speed = active ? 1.9 : 0.72;
    groupRef.current.rotation.z += delta * speed;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[0, 0, -0.18]}>
        <torusGeometry args={[0.28, 0.035, 12, 42]} />
        <meshStandardMaterial color="#ffffff" emissive="#73f0d3" emissiveIntensity={active ? 0.65 : 0.32} />
      </mesh>
      <mesh position={[0.28, -0.28, 0]} rotation={[0, 0, -0.78]}>
        <cylinderGeometry args={[0.035, 0.035, 0.34, 10]} />
        <meshStandardMaterial color="#ffffff" emissive="#8da2ff" emissiveIntensity={active ? 0.62 : 0.28} />
      </mesh>
      {particles.map((particle, index) => (
        <mesh
          key={index}
          position={[
            Math.cos(particle.angle) * particle.radius,
            Math.sin(particle.angle) * particle.radius,
            (index % 4) * 0.015
          ]}
          scale={active ? 1.22 : 1}
        >
          <sphereGeometry args={[particle.size, 8, 8]} />
          <meshStandardMaterial
            color={index % 2 ? "#73f0d3" : "#8da2ff"}
            emissive={index % 2 ? "#73f0d3" : "#8da2ff"}
            emissiveIntensity={active ? 1.2 : 0.55}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function SearchParticleIcon({ active = false }) {
  return (
    <span className="search-particle-icon" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 2.2], fov: 46 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1.4} />
        <pointLight color="#73f0d3" intensity={active ? 3.4 : 1.8} position={[1.5, 1.2, 1.8]} />
        <ParticleSearchGlyph active={active} />
      </Canvas>
    </span>
  );
}
