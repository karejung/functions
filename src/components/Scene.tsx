"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Model } from "./Model";

export default function Scene() {
  return (
    <div className="w-screen h-screen">
      <Canvas camera={{ position: [20, 20, 20], fov: 10 }}>

        <color attach="background" args={["#111111"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <Suspense fallback={null}>
          <Model />
        </Suspense>

        <OrbitControls enableDamping makeDefault />

      </Canvas>
    </div>
  );
}
 

