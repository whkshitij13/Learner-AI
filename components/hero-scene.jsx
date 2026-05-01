"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, OrbitControls, Stars } from "@react-three/drei";
import { useRef } from "react";

function OrbitalShapes() {
  const group = useRef(null);

  useFrame((_, delta) => {
    if (!group.current) {
      return;
    }

    group.current.rotation.y += delta * 0.22;
    group.current.rotation.x += delta * 0.08;
  });

  return (
    <group ref={group}>
      <Float speed={2.2} rotationIntensity={1.2} floatIntensity={1.4}>
        <mesh position={[-1.8, 0.6, 0]}>
          <icosahedronGeometry args={[1, 1]} />
          <MeshDistortMaterial color="#ff7b54" distort={0.35} speed={2.4} roughness={0.1} />
        </mesh>
      </Float>

      <Float speed={1.8} rotationIntensity={1.6} floatIntensity={1.8}>
        <mesh position={[1.6, -0.2, -0.8]}>
          <torusKnotGeometry args={[0.7, 0.24, 180, 24]} />
          <meshStandardMaterial color="#7cf2d6" metalness={0.55} roughness={0.12} />
        </mesh>
      </Float>

      <Float speed={2.6} rotationIntensity={1.4} floatIntensity={1.2}>
        <mesh position={[0.4, 1.55, -1.6]}>
          <sphereGeometry args={[0.62, 64, 64]} />
          <meshStandardMaterial color="#f5f7ff" emissive="#8db1ff" emissiveIntensity={0.8} roughness={0.18} />
        </mesh>
      </Float>
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="hero-scene-shell" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 5.8], fov: 42 }}>
        <color attach="background" args={["#0a1020"]} />
        <fog attach="fog" args={["#0a1020", 4, 12]} />
        <ambientLight intensity={1.2} />
        <directionalLight color="#ffb489" intensity={2.1} position={[4, 3, 3]} />
        <pointLight color="#76ffe0" intensity={18} position={[-3, -2, 2]} />
        <Stars radius={70} depth={28} count={1800} factor={3} saturation={0} fade speed={0.5} />
        <OrbitalShapes />
        <OrbitControls autoRotate autoRotateSpeed={1.8} enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  );
}
