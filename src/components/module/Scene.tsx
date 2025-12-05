"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Model } from "./Model";
import { DraggableHole, Hole } from "./DraggableHole";
import * as THREE from "three";
import { useScreenSize } from "@/config/useScreenSize";

type ModelType = 'S' | 'L';

const COLLISION_DISTANCE = 0.24; // HOLE_RADIUS * 2

// 스케일, 위치, Z offset 애니메이션을 위한 래퍼 컴포넌트
function AnimatedModels({
  selectedModel,
  holes,
  allHoles,
  updateHolePosition,
  handleDragStateChange,
  targetScale,
  targetPosition,
  targetZ
}: {
  selectedModel: ModelType;
  holes: Hole[];
  allHoles: Hole[];
  updateHolePosition: (id: number, x: number) => void;
  handleDragStateChange: (isDragging: boolean) => void;
  targetScale: number;
  targetPosition: [number, number, number];
  targetZ: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const currentScaleRef = useRef(targetScale);
  const currentPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(...targetPosition));
  const currentZRef = useRef(targetZ);
  const isInitializedRef = useRef(false);

  // 초기화: 첫 렌더링 시 현재 스케일과 위치를 targetScale, targetPosition로 설정
  useEffect(() => {
    if (!isInitializedRef.current && groupRef.current) {
      currentScaleRef.current = targetScale;
      currentPositionRef.current.set(...targetPosition);
      currentZRef.current = targetZ;
      groupRef.current.scale.setScalar(targetScale);
      groupRef.current.position.copy(currentPositionRef.current);
      groupRef.current.position.z = targetZ;
      isInitializedRef.current = true;
    }
  }, [targetScale, targetPosition, targetZ]);

  useFrame(() => {
    if (groupRef.current && isInitializedRef.current) {
      // lerp로 부드럽게 스케일 변경 (0.1 = 보간 속도)
      currentScaleRef.current += (targetScale - currentScaleRef.current) * 0.1;
      
      // 거의 목표에 도달하면 정확한 값으로 설정
      if (Math.abs(targetScale - currentScaleRef.current) < 0.001) {
        currentScaleRef.current = targetScale;
      }
      
      groupRef.current.scale.setScalar(currentScaleRef.current);

      // lerp로 부드럽게 위치 변경 (X, Y)
      const targetPos = new THREE.Vector3(...targetPosition);
      currentPositionRef.current.lerp(targetPos, 0.1);
      
      // 거의 목표에 도달하면 정확한 값으로 설정
      if (currentPositionRef.current.distanceTo(targetPos) < 0.001) {
        currentPositionRef.current.copy(targetPos);
      }
      
      groupRef.current.position.x = currentPositionRef.current.x;
      groupRef.current.position.y = currentPositionRef.current.y;

      // Z lerp (selectedModel 변경 대응)
      currentZRef.current += (targetZ - currentZRef.current) * 0.1;
      
      if (Math.abs(targetZ - currentZRef.current) < 0.001) {
        currentZRef.current = targetZ;
      }
      
      groupRef.current.position.z = currentZRef.current;
    }
  });

  return (
    <group ref={groupRef}>
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
          allHoles={allHoles}
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
    </group>
  );
}

export default function Scene3({ isActive }: { isActive: boolean }) {
  // 반응형 화면 크기, 스케일, 위치
  const { scale, position } = useScreenSize();
  
  const [selectedModel, setSelectedModel] = useState<ModelType>('L');
  const [holes, setHoles] = useState<Hole[]>([{ id: 0, x: -0.4 }]);  // 모델 중심과 맞춤
  const [nextId, setNextId] = useState(1);
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  
  // selectedModel에 따른 Z offset
  const targetZ = selectedModel === 'L' ? 0.1 : -0.1;

  const updateHolePosition = (id: number, newX: number) => {
    setHoles(prev => prev.map(h => h.id === id ? {...h, x: newX} : h));
  };

  const handleDragStateChange = (isDragging: boolean) => {
    setIsDraggingAny(isDragging);
  };

  // 공간이 있는지 체크
  const hasAvailableSpace = () => {
    const candidates = [-0.7, -0.1, -0.9, 0.1, -0.6, -0.2, -0.8, 0.0, -1.0, -0.3, -0.5, 0.05];
    for (const candidate of candidates) {
      const hasCollision = holes.some(h => Math.abs(candidate - h.x) < COLLISION_DISTANCE);
      if (!hasCollision) {
        return true;
      }
    }
    return false;
  };

  const addHole = () => {
    if (holes.length >= 5) return;

    // 충돌하지 않는 위치 찾기 (모델 중심 -0.4 기준)
    const candidates = [-0.7, -0.1, -0.9, 0.1, -0.6, -0.2, -0.8, 0.0, -1.0, -0.3, -0.5, 0.05];
    let newX: number | null = null;

    for (const candidate of candidates) {
      const hasCollision = holes.some(h => Math.abs(candidate - h.x) < COLLISION_DISTANCE);
      if (!hasCollision) {
        newX = candidate;
        break;
      }
    }

    // 자리가 없으면 추가하지 않음
    if (newX === null) {
      console.warn('No available space to add new hole');
      return;
    }

    setHoles(prev => [...prev, { id: nextId, x: newX }]);
    setNextId(prev => prev + 1);
  };

  const removeHole = () => {
    if (holes.length <= 1) return; // 최소 1개는 유지
    setHoles(prev => prev.slice(0, -1)); // 마지막 hole 제거
  };
  
  return (
    <div className="w-screen h-[100dvh] relative">
      <Canvas
        frameloop={isActive ? 'always' : 'never'}
        shadows
        orthographic
        camera={{
          position: [-2, 2, -2],
          zoom: 180,
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
          <AnimatedModels
            selectedModel={selectedModel}
            holes={holes}
            allHoles={holes}
            updateHolePosition={updateHolePosition}
            handleDragStateChange={handleDragStateChange}
            targetScale={scale.module}
            targetPosition={position.module}
            targetZ={targetZ}
          />
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
      <div className="cursor-pointer fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {/* Long/Short 슬라이딩 버튼 */}
        <div className="relative inline-flex gap-2 bg-white/40 backdrop-blur-xl rounded-full p-1 border border-white/20">
          {/* 슬라이딩 배경 */}
          <div
            className={`absolute top-1 bottom-1 bg-white/100 transition-all duration-300 rounded-full ${
              selectedModel === 'L' ? 'left-1 right-[calc(50%+0.25rem)]' : 'left-[calc(50%+0.25rem)] right-1'
            }`}
          />
          
          {/* 텍스트 레이블들 */}
          <button
            onClick={() => setSelectedModel('L')}
            className={`relative z-10 px-6 py-2 font-medium text-sm transition-all duration-300 ${
              selectedModel === 'L' ? 'text-black' : 'text-gray-400'
            }`}
            aria-label="Long model"
          >
            Long
          </button>
          <button
            onClick={() => setSelectedModel('S')}
            className={`relative z-10 px-6 py-2 font-medium text-sm transition-all duration-300 ${
              selectedModel === 'S' ? 'text-black' : 'text-gray-400'
            }`}
            aria-label="Short model"
          >
            Short
          </button>
        </div>

        {/* Hole 개수 조절 버튼 */}
        <div className="flex items-center gap-2 bg-white backdrop-blur-xl rounded-full px-1 py-1 border border-white/20">
          {/* - 버튼 */}
          <button
            onClick={removeHole}
            disabled={holes.length <= 1}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-300
              font-medium text-sm
              ${holes.length <= 1
                ? 'bg-white/20 text-gray-400 cursor-not-allowed' 
                : 'bg-black text-white hover:scale-110'
              }
            `}
            aria-label="Remove hole"
          >
            −
          </button>

          {/* 숫자 표시 */}
          <span className="text-black font-medium text-sm min-w-[2ch] text-center">
            {holes.length}
          </span>

          {/* + 버튼 */}
          <button
            onClick={addHole}
            disabled={holes.length >= 5 || !hasAvailableSpace()}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-300
              font-medium text-sm
              ${holes.length >= 5 || !hasAvailableSpace()
                ? 'bg-white/20 text-gray-400 cursor-not-allowed' 
                : 'bg-black text-white hover:scale-110'
              }
            `}
            aria-label="Add hole"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

