"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

function BuildingOrbScene() {
  const orbRef = useRef(null);
  const particleGroupRef = useRef(null);
  const ringRef = useRef(null);
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 30;
        const band = index % 3;

        return {
          angle,
          radius: 0.74 + band * 0.13,
          y: (band - 1) * 0.18,
          size: 0.018 + (index % 4) * 0.006,
          speed: 0.75 + (index % 5) * 0.09
        };
      }),
    []
  );

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;

    if (orbRef.current) {
      orbRef.current.rotation.y += delta * 0.52;
      orbRef.current.rotation.x = Math.sin(elapsed * 0.9) * 0.08;
      orbRef.current.scale.setScalar(1 + Math.sin(elapsed * 1.6) * 0.025);
    }

    if (particleGroupRef.current) {
      particleGroupRef.current.rotation.y += delta * 1.25;
      particleGroupRef.current.rotation.z = Math.sin(elapsed * 0.72) * 0.24;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.82;
      ringRef.current.rotation.x = 1.18 + Math.sin(elapsed * 0.6) * 0.12;
    }
  });

  return (
    <group>
      <group ref={orbRef}>
        <mesh>
          <sphereGeometry args={[0.46, 48, 48]} />
          <meshPhysicalMaterial
            color="#78b582"
            clearcoat={1}
            clearcoatRoughness={0.08}
            emissive="#1d6b3d"
            emissiveIntensity={0.18}
            metalness={0.03}
            roughness={0.28}
            transmission={0.08}
          />
        </mesh>
        <mesh position={[-0.16, 0.18, 0.32]}>
          <sphereGeometry args={[0.15, 24, 24]} />
          <meshBasicMaterial color="#eef7e8" transparent opacity={0.58} />
        </mesh>
      </group>

      <group ref={particleGroupRef}>
        {particles.map((particle, index) => (
          <mesh
            key={index}
            position={[
              Math.cos(particle.angle) * particle.radius,
              particle.y + Math.sin(particle.angle * 1.7) * 0.08,
              Math.sin(particle.angle) * particle.radius
            ]}
          >
            <sphereGeometry args={[particle.size, 8, 8]} />
            <meshStandardMaterial
              color={index % 2 ? "#9be7ae" : "#d9f7c8"}
              emissive={index % 2 ? "#49c86f" : "#b9f5ac"}
              emissiveIntensity={0.72}
            />
          </mesh>
        ))}
      </group>

      <mesh ref={ringRef} rotation={[1.18, 0, 0]}>
        <torusGeometry args={[0.82, 0.012, 8, 96]} />
        <meshBasicMaterial color="#9be7ae" transparent opacity={0.58} />
      </mesh>
    </group>
  );
}

export default function TopicBuildingOrb() {
  return (
    <div className="ai-loader-orb ai-loader-orb-3d" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 2.7], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight color="#f4fff0" intensity={2.2} position={[-1.4, 2.2, 2.4]} />
        <pointLight color="#8cf2a2" intensity={4.8} position={[1.6, -1.1, 1.4]} />
        <BuildingOrbScene />
      </Canvas>
    </div>
  );
}
