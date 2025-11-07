"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Model } from "./Model";
import { ReflectTest } from "./ReflectTest";
import { Reflector } from "./Reflector";
import * as THREE from "three/webgpu";
import { useControls } from "leva";

export default function Scene() {
  // 통합 컨트롤: nightMix 값으로 다른 값들 자동 계산
  const { uNightMix } = useControls('Scene Settings', {
    uNightMix: { value: 0, min: 0, max: 1, step: 0.01, label: 'Night Mix' }
  })
  
  // nightMix에 따라 선형 보간 (lerp)
  const envIntensity = useMemo(() => {
    // nightMix 0 → 0.75, nightMix 1 → 0.25
    return 0.75 - (uNightMix * 0.5)
  }, [uNightMix])
  
  const floorOpacity = useMemo(() => {
    // nightMix 0 → 0.05, nightMix 1 → 0.15
    return 0.05 + (uNightMix * 0.1)
  }, [uNightMix])

  return (
    <div className="w-screen h-screen">
      <Canvas 
        orthographic
        camera={{ 
          position: [10,10,-10], 
          zoom: 150,
          near: 0.01,
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

        <color attach="background" args={["#111"]} />
        <Environment preset="city" environmentIntensity={envIntensity} />
        <Suspense fallback={null}>
          <Model nightMix={uNightMix} />
          <ReflectTest floorOpacity={floorOpacity} />
          <Reflector />
        </Suspense>

        <OrbitControls enableDamping makeDefault target={[0, 1.5, 0]} />

      </Canvas>
    </div>
  );
}
 

