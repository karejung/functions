"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Model } from "./Model";
import * as THREE from "three";

export default function Scene3({ isActive }: { isActive: boolean }) {
  
  return (
    <div className="w-screen h-[100dvh] relative">
      <Canvas
        frameloop={isActive ? 'always' : 'never'}
        shadows
        orthographic
        camera={{
          position: [1, 3, 1],
          zoom: 100,
          near: 1,
          far: 1000
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}
      >
        <color attach="background" args={["#eee"]} />
        <directionalLight 
          position={[0, 5, -3]} 
          intensity={0.1} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />

        
        <Suspense fallback={null}>
          <Environment preset="city" />
          {/* 3개의 모듈 모델 배치 */}
          <Model modelType="S" position={[0, 0, 0]} rotation={[0, 0, 0]} scale={10} />
          <Model modelType="L" position={[0, 0, 0]} rotation={[0, 0, 0]} scale={10} />
          <Model modelType="Hole" position={[-0.2, 0, 0]} rotation={[0, 0, 0]} scale={10} />
            
          {/* 바닥 plane */}
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0, 0]} 
            receiveShadow
          >
            <planeGeometry args={[100, 100]} />
            <shadowMaterial transparent opacity={0.25} />
          </mesh>
        </Suspense>

        <OrbitControls 
          autoRotate={false}
          enableZoom={true}
          enablePan={false}
          enableRotate={true}
          enableDamping 
          makeDefault 
          target={[0, 0, 0]} 
        />
      </Canvas>
    </div>
  );
}

