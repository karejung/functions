"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Model } from "./Model";
import { DraggableHole, Hole } from "./DraggableHole";
import * as THREE from "three";

type ModelType = 'S' | 'L';

const COLLISION_DISTANCE = 0.24; // HOLE_RADIUS * 2

export default function Scene3({ isActive }: { isActive: boolean }) {
  const [selectedModel, setSelectedModel] = useState<ModelType>('L');
  const [holes, setHoles] = useState<Hole[]>([{ id: 0, x: -0.4 }]);  // 모델 중심과 맞춤
  const [nextId, setNextId] = useState(1);
  const [isDraggingAny, setIsDraggingAny] = useState(false);

  const updateHolePosition = (id: number, newX: number) => {
    setHoles(prev => prev.map(h => h.id === id ? {...h, x: newX} : h));
  };

  const handleDragStateChange = (isDragging: boolean) => {
    setIsDraggingAny(isDragging);
  };

  const addHole = () => {
    if (holes.length >= 5) return;

    // 충돌하지 않는 위치 찾기 (모델 중심 -0.4 기준)
    const candidates = [-0.7, -0.1, -0.9, 0.1, -0.6, -0.2, -0.8, 0.0, -1.0, -0.3, -0.5, 0.05];
    let newX = -0.4;

    for (const candidate of candidates) {
      const hasCollision = holes.some(h => Math.abs(candidate - h.x) < COLLISION_DISTANCE);
      if (!hasCollision) {
        newX = candidate;
        break;
      }
    }

    setHoles(prev => [...prev, { id: nextId, x: newX }]);
    setNextId(prev => prev + 1);
  };
  
  return (
    <div className="w-screen h-[100dvh] relative">
      <Canvas
        frameloop={isActive ? 'always' : 'never'}
        shadows
        orthographic
        camera={{
          position: [-2, 2, -2],
          zoom: 200,
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
          {/* 선택된 모델만 표시 */}
          {selectedModel === 'L' && (
            <Model modelType="L" position={[-0.2, 0, 0]} rotation={[0, 0, 0]} scale={10} />
          )}
          {selectedModel === 'S' && (
            <Model modelType="S" position={[-0.2, 0, 0]} rotation={[0, 0, 0]} scale={10} />
          )}
          
          {/* 드래그 가능한 Hole 모델들 */}
          {holes.map(hole => (
            <DraggableHole
              key={hole.id}
              hole={hole}
              allHoles={holes}
              onUpdatePosition={updateHolePosition}
              onDragStateChange={handleDragStateChange}
            />
          ))}
            
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
          enableRotate={!isDraggingAny}
          enableDamping 
          makeDefault 
          target={[0, 0, 0]} 
        />
      </Canvas>

      {/* 모델 선택 버튼 */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-10">
        {/* Long 버튼 */}
        <button
          onClick={() => setSelectedModel('L')}
          className={`
            px-6 py-2 rounded-full
            transition-all duration-300
            border-2 hover:scale-105
            font-medium text-sm
            ${selectedModel === 'L'
              ? 'bg-gray-800 text-white border-gray-800' 
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }
          `}
          aria-label="Long model"
        >
          Long
        </button>

        {/* Short 버튼 */}
        <button
          onClick={() => setSelectedModel('S')}
          className={`
            px-6 py-2 rounded-full
            transition-all duration-300
            border-2 hover:scale-105
            font-medium text-sm
            ${selectedModel === 'S'
              ? 'bg-gray-800 text-white border-gray-800' 
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }
          `}
          aria-label="Short model"
        >
          Short
        </button>

        {/* Add 버튼 */}
        <button
          onClick={addHole}
          disabled={holes.length >= 5}
          className={`
            px-6 py-2 rounded-full
            transition-all duration-300
            border-2 hover:scale-105
            font-medium text-sm
            ${holes.length >= 5
              ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed' 
              : 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
            }
          `}
          aria-label="Add hole"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

