"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Model } from "./Model";
import * as THREE from "three/webgpu";

export default function Scene2() {
  const [textureUrl, setTextureUrl] = useState("/test/textures/Cylinder_Bake1_CyclesBake_COMBINED.webp");
  
  return (
    <div className="w-screen h-screen relative">
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
        <Environment preset="city" environmentIntensity={0.1} />
        
        {/* 조명 */}
        <directionalLight
          position={[0.25, 2, 1.5]}
          intensity={7}
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
          <Model scale={10} textureUrl={textureUrl} />
            
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
          autoRotateSpeed={0.1}
          enableRotate={true}
          enableDamping 
          makeDefault 
          target={[0, 0, 0]} 
        />
      </Canvas>

      {/* 컬러 버튼 */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-10">
        {/* 초록색 버튼 */}
        <button
          onClick={() => setTextureUrl("/test/textures/Cylinder_Bake1_CyclesBake_COMBINED.webp")}
          className={`
            w-14 h-14 rounded-full
            transition-all duration-300
            border-4
            shadow-lg hover:scale-110
            ${textureUrl === "/test/textures/Cylinder_Bake1_CyclesBake_COMBINED.webp" 
              ? 'border-white scale-110' 
              : 'border-gray-400/50'
            }
          `}
          style={{ backgroundColor: '#4ade80' }}
          aria-label="Green texture"
        />

        {/* 검정색 버튼 */}
        <button
          onClick={() => setTextureUrl("/test/textures/black.webp")}
          className={`
            w-14 h-14 rounded-full
            transition-all duration-300
            border-4
            shadow-lg hover:scale-110
            ${textureUrl === "/test/textures/black.webp" 
              ? 'border-white scale-110' 
              : 'border-gray-400/50'
            }
          `}
          style={{ backgroundColor: '#000000' }}
          aria-label="Black texture"
        />

        {/* 흰색 버튼 */}
        <button
          onClick={() => setTextureUrl("/test/textures/white.webp")}
          className={`
            w-14 h-14 rounded-full
            transition-all duration-300
            border-4
            shadow-lg hover:scale-110
            ${textureUrl === "/test/textures/white.webp" 
              ? 'border-white scale-110' 
              : 'border-gray-400/50'
            }
          `}
          style={{ backgroundColor: '#ffffff' }}
          aria-label="White texture"
        />
      </div>
    </div>
  );
}

