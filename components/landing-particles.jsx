"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

function ParticleField() {
  const groupRef = useRef(null);
  const nodes = useMemo(
    () =>
      Array.from({ length: 90 }, (_, index) => {
        const lane = index % 6;
        return {
          x: -4.5 + (index % 18) * 0.52,
          y: -2.3 + lane * 0.82,
          z: -1.5 - (index % 9) * 0.12,
          size: 0.012 + (index % 5) * 0.006,
          speed: 0.18 + (index % 7) * 0.025,
          phase: index * 0.44
        };
      }),
    []
  );

  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y += delta * 0.035;
    groupRef.current.children.forEach((child, index) => {
      const node = nodes[index];
      child.position.y = node.y + Math.sin(state.clock.elapsedTime * node.speed + node.phase) * 0.18;
      child.position.x = node.x + Math.cos(state.clock.elapsedTime * node.speed * 0.8 + node.phase) * 0.16;
    });
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, index) => (
        <mesh key={index} position={[node.x, node.y, node.z]}>
          <sphereGeometry args={[node.size, 8, 8]} />
          <meshStandardMaterial
            color={index % 3 === 0 ? "#8da2ff" : index % 3 === 1 ? "#73f0d3" : "#ffe08a"}
            emissive={index % 3 === 0 ? "#8da2ff" : index % 3 === 1 ? "#73f0d3" : "#ffe08a"}
            emissiveIntensity={0.82}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function LandingParticles() {
  return (
    <div className="landing-particles" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 5.4], fov: 46 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <ambientLight intensity={1.6} />
        <pointLight color="#73f0d3" intensity={5} position={[-2.8, 1.8, 2.4]} />
        <pointLight color="#8da2ff" intensity={4.6} position={[3, -1.3, 2.2]} />
        <ParticleField />
      </Canvas>
    </div>
  );
}
