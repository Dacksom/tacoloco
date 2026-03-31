import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
// @ts-ignore - Let Vite handle it as a raw asset URL
import tacoObjUrl from '../../assets/taco-icon.obj?url';

function TacoModel() {
  const obj = useLoader(OBJLoader, tacoObjUrl);
  const meshRef = useRef<THREE.Group>(null);

  // Clone the object memoized so we can reuse the component safely
  const copiedScene = useMemo(() => {
    const clone = obj.clone();
    
    // Create a fun, flat/toonish material for the taco
    const material = new THREE.MeshStandardMaterial({
      color: '#ffa924',
      roughness: 0.3,
      metalness: 0.2,
    });

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
    
    return clone;
  }, [obj]);

  // Rotate slowly
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <primitive
      ref={meshRef}
      object={copiedScene}
      scale={0.28}
      position={[0, 0, 0]}
    />
  );
}

export default function Taco3D() {
  return (
    <div className="w-[60px] h-[60px] md:w-[75px] md:h-[75px] drop-shadow-xl select-none pointer-events-none">
      <Canvas camera={{ position: [0, 1.5, 4.8], fov: 50 }} style={{ background: 'transparent' }}>
        <ambientLight intensity={1.8} />
        <directionalLight position={[5, 10, 5]} intensity={2.5} />
        <directionalLight position={[-5, -5, -5]} intensity={1} color="#ff0000" />
        <TacoModel />
      </Canvas>
    </div>
  );
}
