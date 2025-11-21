"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Model } from "./Model";
import * as THREE from "three/webgpu";
import { BASE_PATH } from "@/config/basePath";
import { useScreenSize } from "@/config/useScreenSize";

// 스케일 및 위치 애니메이션을 위한 래퍼 컴포넌트
function AnimatedModel({ 
  targetScale, 
  targetPosition,
  textureUrl 
}: { 
  targetScale: number; 
  targetPosition: [number, number, number];
  textureUrl: string 
}) {
  const groupRef = useRef<THREE.Group>(null);
  const currentScaleRef = useRef(targetScale);
  const currentPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(...targetPosition));
  const isInitializedRef = useRef(false);

  // 초기화: 첫 렌더링 시 현재 스케일과 위치를 targetScale, targetPosition로 설정
  useEffect(() => {
    if (!isInitializedRef.current && groupRef.current) {
      currentScaleRef.current = targetScale;
      currentPositionRef.current.set(...targetPosition);
      groupRef.current.scale.setScalar(targetScale);
      groupRef.current.position.copy(currentPositionRef.current);
      isInitializedRef.current = true;
    }
  }, [targetScale, targetPosition]);

  useFrame(() => {
    if (groupRef.current && isInitializedRef.current) {
      // lerp로 부드럽게 스케일 변경 (0.1 = 보간 속도)
      currentScaleRef.current += (targetScale - currentScaleRef.current) * 0.1;
      
      // 거의 목표에 도달하면 정확한 값으로 설정
      if (Math.abs(targetScale - currentScaleRef.current) < 0.001) {
        currentScaleRef.current = targetScale;
      }
      
      groupRef.current.scale.setScalar(currentScaleRef.current);

      // lerp로 부드럽게 위치 변경
      const targetPos = new THREE.Vector3(...targetPosition);
      currentPositionRef.current.lerp(targetPos, 0.1);
      
      // 거의 목표에 도달하면 정확한 값으로 설정
      if (currentPositionRef.current.distanceTo(targetPos) < 0.001) {
        currentPositionRef.current.copy(targetPos);
      }
      
      groupRef.current.position.copy(currentPositionRef.current);
    }
  });

  return (
    <group ref={groupRef}>
      <Model scale={1} position={[0, 0, 0]} textureUrl={textureUrl} />
    </group>
  );
}

export default function Scene2() {
  // 반응형 화면 크기, 스케일, 위치
  const { scale, position } = useScreenSize();
  
  const [textureUrl, setTextureUrl] = useState(`${BASE_PATH}/test/textures/Cylinder_Bake1_CyclesBake_COMBINED.webp`);
  
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
        <ambientLight intensity={1} />
        <directionalLight 
          position={[-0.3, 2, 1]} 
          intensity={1} 
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
          <AnimatedModel targetScale={scale.test} targetPosition={position.test} textureUrl={textureUrl} />
            
          {/* 바닥 plane */}
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={position.test} 
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
          onClick={() => setTextureUrl(`${BASE_PATH}/test/textures/Cylinder_Bake1_CyclesBake_COMBINED.webp`)}
          className={`
            w-14 h-14 rounded-full
            transition-all duration-300
            border-4
            shadow-lg hover:scale-110
            ${textureUrl === `${BASE_PATH}/test/textures/Cylinder_Bake1_CyclesBake_COMBINED.webp`
              ? 'border-white scale-110' 
              : 'border-gray-400/50'
            }
          `}
          style={{ backgroundColor: '#4ade80' }}
          aria-label="Green texture"
        />

        {/* 검정색 버튼 */}
        <button
          onClick={() => setTextureUrl(`${BASE_PATH}/test/textures/black.webp`)}
          className={`
            w-14 h-14 rounded-full
            transition-all duration-300
            border-4
            shadow-lg hover:scale-110
            ${textureUrl === `${BASE_PATH}/test/textures/black.webp`
              ? 'border-white scale-110' 
              : 'border-gray-400/50'
            }
          `}
          style={{ backgroundColor: '#000000' }}
          aria-label="Black texture"
        />

        {/* 흰색 버튼 */}
        <button
          onClick={() => setTextureUrl(`${BASE_PATH}/test/textures/white.webp`)}
          className={`
            w-14 h-14 rounded-full
            transition-all duration-300
            border-4
            shadow-lg hover:scale-110
            ${textureUrl === `${BASE_PATH}/test/textures/white.webp`
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

