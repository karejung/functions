"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
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
          
          // shadowMap 설정을 init() 전에
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.VSMShadowMap;
          
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1;
          
          await renderer.init();
          return renderer;
        }}
      >
        <color attach="background" args={["#fff"]} />
        <ambientLight intensity={1.5} />
        <directionalLight 
          position={[-0.2, 2, 1]} 
          intensity={0.5} 
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
          <Model scale={10} position={[0, -2, 0]} textureUrl={textureUrl} />
            
          {/* 바닥 plane */}
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -2, 0]} 
            receiveShadow
          >
            <planeGeometry args={[100, 100]} />
            <shadowMaterial transparent opacity={0.2} />
          </mesh>
        </Suspense>

        <OrbitControls 
          autoRotate={true}
          autoRotateSpeed={0.2}
          enableZoom={false}
          enablePan={false}
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

