import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Visualization } from "../../types";

// Map stellar mass to a blackbody-ish color (cool red dwarfs -> hot blue giants).
function massToColor(mass: number, c: THREE.Color) {
  const t = Math.min(1, Math.log10(mass + 0.1) / 2 + 0.4);
  c.setHSL(0.62 - t * 0.55, 0.8, 0.55 + t * 0.2);
  return c;
}

function StarField({ viz }: { viz: Visualization }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors, sizes } = useMemo(() => {
    const stars = viz.galaxy.stars;
    const masses = viz.galaxy.masses;
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);
    const c = new THREE.Color();
    for (let i = 0; i < stars.length; i++) {
      positions[i * 3] = stars[i][0];
      positions[i * 3 + 1] = stars[i][1];
      positions[i * 3 + 2] = stars[i][2];
      massToColor(masses[i] ?? 1, c);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = 0.3 + Math.min(2, Math.log10((masses[i] ?? 1) + 1));
    }
    return { positions, colors, sizes };
  }, [viz]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.05;
  });

  if (positions.length === 0) return null;
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.6}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function GalaxyView({ viz }: { viz: Visualization }) {
  return (
    <Canvas camera={{ position: [0, 18, 38], fov: 55 }}>
      <color attach="background" args={["#05060e"]} />
      <StarField viz={viz} />
      {/* central black hole / bulge */}
      <mesh>
        <sphereGeometry args={[0.8, 24, 24]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={2} color="#ffd479" distance={20} />
      <OrbitControls enablePan enableZoom />
    </Canvas>
  );
}
