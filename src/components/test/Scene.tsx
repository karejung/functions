"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Model } from "./Model";
import * as THREE from "three/webgpu";

export default function Scene2() {
  return (
    <div className="w-screen h-screen">
      <Canvas
        shadows
        orthographic
        camera={{
          position: [-20, 15, 20],
          zoom: 100,
          near: 1,
          far: 1000
        }}
        gl={async (canvasProps) => {
          const renderer = new THREE.WebGPURenderer({
            canvas: canvasProps.canvas as HTMLCanvasElement,
            antialias: true
          });
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1;
          await renderer.init();
          return renderer;
        }}
      >
        <color attach="background" args={["#fff"]} />
        <Environment preset="city" environmentIntensity={1} />
        
        {/* 조명 */}
        <directionalLight
          position={[-1, 3, 1]}
          intensity={2}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.0001}
          shadow-radius={10}
        />
        
        <Suspense fallback={null}>
          <Model scale={10}/>
           
          {/* 바닥 plane */}
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0, 0]} 
            receiveShadow
          >
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
        </Suspense>

        <OrbitControls 
          autoRotate={true}
          autoRotateSpeed={1}
          enableDamping 
          makeDefault 
          target={[0, 0, 0]} 
        />
      </Canvas>
    </div>
  );
}

