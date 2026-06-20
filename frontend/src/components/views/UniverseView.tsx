import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Visualization } from "../../types";

// Renders the cosmic web: galaxies as a point cloud, expanding outward.
function GalaxyField({ viz }: { viz: Visualization }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => {
    const gals = viz.universe.galaxies;
    const bright = viz.universe.brightness;
    const positions = new Float32Array(gals.length * 3);
    const colors = new Float32Array(gals.length * 3);
    const c = new THREE.Color();
    for (let i = 0; i < gals.length; i++) {
      positions[i * 3] = gals[i][0];
      positions[i * 3 + 1] = gals[i][1];
      positions[i * 3 + 2] = gals[i][2];
      const b = bright[i] ?? 0.6;
      c.setHSL(0.6 - b * 0.15, 0.7, 0.4 + b * 0.4);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, [viz]);

  // Subtle expansion drift proportional to the universe's expansion rate.
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.02;
  });

  if (positions.length === 0) return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={1.4}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function UniverseView({ viz }: { viz: Visualization }) {
  const empty = viz.universe.count === 0;
  return (
    <Canvas camera={{ position: [0, 40, 160], fov: 60 }}>
      <color attach="background" args={["#05060e"]} />
      <ambientLight intensity={0.4} />
      <GalaxyField viz={viz} />
      <OrbitControls enablePan enableZoom autoRotate={false} />
      {empty && <EmptyHint />}
    </Canvas>
  );
}

function EmptyHint() {
  return (
    <mesh>
      <sphereGeometry args={[2, 16, 16]} />
      <meshBasicMaterial color="#23294a" wireframe />
    </mesh>
  );
}
