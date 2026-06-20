import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Visualization, VizPlanet } from "../../types";

function Planet({ planet, index }: { planet: VizPlanet; index: number }) {
  const ref = useRef<THREE.Group>(null);
  const radius = planet.semi_major_au * 3;
  const speed = 0.4 / Math.sqrt(planet.semi_major_au); // Keplerian-ish
  const phase = index * 1.3;

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + phase;
    if (ref.current) {
      ref.current.position.x = Math.cos(t) * radius;
      ref.current.position.z = Math.sin(t) * radius;
    }
  });

  const size = Math.max(0.15, Math.min(1.2, planet.radius_earth * 0.12));
  const color = planet.is_rocky ? "#c08457" : "#9fb4d8";

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={planet.in_habitable_zone ? "#1b5e3a" : "#000"}
          emissiveIntensity={planet.in_habitable_zone ? 0.5 : 0}
        />
      </mesh>
      {planet.in_habitable_zone && (
        <Html distanceFactor={20}>
          <div className="text-[10px] text-cosmos-good whitespace-nowrap">🌍 habitable</div>
        </Html>
      )}
    </group>
  );
}

function Orbit({ radius }: { radius: number }) {
  const pts = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geom = new THREE.BufferGeometry().setFromPoints(pts);
  return (
    <primitive object={new THREE.LineLoop(geom, new THREE.LineBasicMaterial({ color: "#23294a" }))} />
  );
}

export function SolarSystemView({ viz }: { viz: Visualization }) {
  const planets = viz.solar_system.planets;
  return (
    <Canvas camera={{ position: [0, 12, 22], fov: 55 }}>
      <color attach="background" args={["#05060e"]} />
      <ambientLight intensity={0.25} />
      {/* the star */}
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color="#ffd479" />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={3} color="#fff2cc" distance={80} />
      {planets.map((p, i) => (
        <group key={i}>
          <Orbit radius={p.semi_major_au * 3} />
          <Planet planet={p} index={i} />
        </group>
      ))}
      {planets.length === 0 && (
        <Html center>
          <div className="text-gray-500 text-sm">No planets formed in this universe.</div>
        </Html>
      )}
      <OrbitControls enablePan enableZoom />
    </Canvas>
  );
}
