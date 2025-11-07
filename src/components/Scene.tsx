"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Model } from "./Model";
import { Reflector } from "./Reflector";
import * as THREE from "three";

export default function Scene() {
  return (
    <div className="w-screen h-screen">
      <Canvas 
        camera={{ 
          position: [200, 150, -200], 
          fov: 1,
          zoom: 1,
          near: 100,
          far: 10000
        }}
        gl={{ 
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1
        }}
      >

        <color attach="background" args={["#111"]} />
        <Environment preset="city" />
        <Suspense fallback={null}>
          <Model />
          <Reflector />
        </Suspense>

        <OrbitControls enableDamping makeDefault />

      </Canvas>
    </div>
  );
}
 

