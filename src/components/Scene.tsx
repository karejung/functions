"use client";

import { Suspense, useMemo, useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Model } from "./Model";
import { ReflectTest } from "./ReflectTest";
import { Reflector } from "./Reflector";
import * as THREE from "three/webgpu";
import { Sun, Moon } from "lucide-react";
import { useScreenSize } from "@/config/useScreenSize";
// import { useControls } from "leva";

// 카메라 설정 상수
const CAMERA_CONFIG = {
  perspective: {
    fov: 0.1,
    position: [2000, 2000, -2000] as [number, number, number],
    near: 1000,
    far: 10000
  },
  orthographic: {
    position: [10, 10, -10] as [number, number, number],
    zoom: 150,
    near: 0.01,
    far: 1000,
    frustumSize: 150
  }
};

// 스케일 및 위치 애니메이션을 위한 래퍼 컴포넌트
function AnimatedModels({ 
  targetScale, 
  targetPosition, 
  nightMix 
}: { 
  targetScale: number; 
  targetPosition: [number, number, number]; 
  nightMix: number 
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
      <Model nightMix={nightMix} />
      <ReflectTest />
      <Reflector />
    </group>
  );
}

export default function Scene({ 
  isNightMode, 
  setIsNightMode,
  isActive 
}: { 
  isNightMode: boolean; 
  setIsNightMode: (value: boolean) => void;
  isActive: boolean;
}) {
  // 반응형 화면 크기, 스케일, 위치
  const { scale, position } = useScreenSize();
  
  // WebGPU 지원 여부 확인 (지원되지 않으면 perspective 카메라 사용)
  const isPerspective = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !('gpu' in navigator);
  }, []);

  // 상태 관리
  const [uNightMix, setUNightMix] = useState(isNightMode ? 1 : 0);
  const animationFrameRef = useRef<number | null>(null);
  const uNightMixRef = useRef(isNightMode ? 1 : 0); // 현재 uNightMix 값을 추적하기 위한 ref

  // uNightMix가 변경될 때마다 ref 업데이트
  useEffect(() => {
    uNightMixRef.current = uNightMix;
  }, [uNightMix]);

  // // 통합 컨트롤: nightMix 값으로 다른 값들 자동 계산
  // const { uNightMix, isPerspective } = useControls('Scene Settings', {
  //   uNightMix: { value: 0, min: 0, max: 1, step: 0.01, label: 'Night Mix' },
  //   isPerspective: { value: false, label: 'Perspective Camera' }
  // })

  // nightMix 애니메이션
  useEffect(() => {
    const targetValue = isNightMode ? 1 : 0;
    const startValue = uNightMixRef.current; // ref에서 현재 값을 가져옴
    const startTime = Date.now();
    const duration = 800; // 800ms 애니메이션

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeInOutCubic easing
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      const newValue = startValue + (targetValue - startValue) * eased;
      setUNightMix(newValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isNightMode]);
  
  // nightMix에 따라 선형 보간 (lerp)
  const envIntensity = useMemo(() => {
    // nightMix 0 → 0.75, nightMix 1 → 0.25
    return 1 - (uNightMix * 0.75)
  }, [uNightMix])

  return (
    <div className="w-screen h-screen">
      <Canvas 
        frameloop={isActive ? 'always' : 'never'}
        orthographic={!isPerspective}
        camera={
          isPerspective
            ? {
                position: CAMERA_CONFIG.perspective.position,
                fov: CAMERA_CONFIG.perspective.fov,
                near: CAMERA_CONFIG.perspective.near,
                far: CAMERA_CONFIG.perspective.far
              }
            : {
                position: CAMERA_CONFIG.orthographic.position,
                zoom: CAMERA_CONFIG.orthographic.zoom,
                near: CAMERA_CONFIG.orthographic.near,
                far: CAMERA_CONFIG.orthographic.far
              }
        }
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
          <AnimatedModels targetScale={scale.main} targetPosition={position.main} nightMix={uNightMix} />
        </Suspense>

        <OrbitControls 
          autoRotate={true} 
          autoRotateSpeed={0.05} 
          enableDamping 
          makeDefault 
          target={[0, 1.5, 0]}
          maxPolarAngle={Math.PI / 2} // 수평 아래로 회전 제한
          minAzimuthAngle={-Math.PI / -2} // 좌측 90도 제한
          maxAzimuthAngle={Math.PI / -2} // 우측 90도 제한 (총 180도)
        />

      </Canvas>

      {/* 컨트롤 버튼 */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
        {/* Night Mode 토글 버튼 */}
        <button
          onClick={() => setIsNightMode(!isNightMode)}
          className={`
            relative w-16 h-8 rounded-full
            backdrop-blur-xl
            border border-white/20
            transition-all duration-300
            flex items-center
            ${isNightMode 
              ? 'bg-white/10' 
              : 'bg-white/30 hover:bg-white/60'
            }
          `}
        >
          {/* 해 아이콘 (낮 모드일 때 오른쪽에) */}
          <div
            className={`
              absolute top-1/2 -translate-y-1/2
              transition-all duration-300
              ${isNightMode ? 'left-[8px] opacity-0' : 'left-[calc(100%-22px)] opacity-100'}
            `}
          >
            <Sun className="w-4 h-4 text-yellow-300" />
          </div>

          {/* 달 아이콘 (밤 모드일 때 왼쪽에) */}
          <div
            className={`
              absolute top-1/2 -translate-y-1/2
              transition-all duration-300
              ${isNightMode ? 'left-[6px] opacity-100' : 'left-[calc(100%-28px)] opacity-0'}
            `}
          >
            <Moon className="w-4 h-4 text-blue-200" />
          </div>

          {/* 흰색 토글 원 */}
          <div
            className={`
              absolute top-[50%] -translate-y-1/2
              w-6 h-6 
              rounded-full
              transition-all duration-300
              ${isNightMode ? 'bg-blue-200 left-[calc(100%-28px)]' : 'bg-yellow-300 left-[4px]'}
            `}
          />
        </button>
      </div>
    </div>
  );
}
 

