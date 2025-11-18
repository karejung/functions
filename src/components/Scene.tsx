"use client";

import { Suspense, useMemo, useEffect, useState, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Model } from "./Model";
import { ReflectTest } from "./ReflectTest";
import { Reflector } from "./Reflector";
import * as THREE from "three/webgpu";
import { Sun, Moon, Box } from "lucide-react";
// import { useControls } from "leva";

// 카메라 전환을 위한 컴포넌트
function CameraController({ isPerspective }: { isPerspective: boolean }) {
  const { camera, gl, set } = useThree();
  
  useEffect(() => {
    if (isPerspective) {
      // Perspective 카메라로 전환
      const perspectiveCamera = new THREE.PerspectiveCamera(30, gl.domElement.width / gl.domElement.height, 0.01, 1000);
      perspectiveCamera.position.set(5, 5, -5);
      set({ camera: perspectiveCamera });
    } else {
      // Orthographic 카메라로 전환
      const aspect = gl.domElement.width / gl.domElement.height;
      const frustumSize = 150;
      const orthographicCamera = new THREE.OrthographicCamera(
        -frustumSize * aspect / 2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        -frustumSize / 2,
        1,
        1000
      );
      orthographicCamera.position.set(10, 10, -10);
      orthographicCamera.zoom = 25;
      set({ camera: orthographicCamera });
    }
  }, [isPerspective, gl, set]);
  
  return null;
}

export default function Scene() {
  // 상태 관리
  const [isPerspective, setIsPerspective] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [uNightMix, setUNightMix] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // // 통합 컨트롤: nightMix 값으로 다른 값들 자동 계산
  // const { uNightMix, isPerspective } = useControls('Scene Settings', {
  //   uNightMix: { value: 0, min: 0, max: 1, step: 0.01, label: 'Night Mix' },
  //   isPerspective: { value: false, label: 'Perspective Camera' }
  // })

  // nightMix 애니메이션
  useEffect(() => {
    const targetValue = isNightMode ? 1 : 0;
    const startValue = uNightMix;
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

  // 카메라 설정
  const cameraConfig = useMemo(() => {
    if (isPerspective) {
      return {
        orthographic: false,
        camera: {
          position: [5, 5, -5],
          fov: 45,
          near: 0.01,
          far: 1000
        }
      }
    } else {
      return {
        orthographic: true,
        camera: {
          position: [10, 10, -10],
          zoom: 150,
          near: 0.01,
          far: 1000
        }
      }
    }
  }, [isPerspective])

  return (
    <div className="w-screen h-screen">
      <Canvas 
        orthographic={!isPerspective}
        camera={cameraConfig.camera as any}
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
        <CameraController isPerspective={isPerspective} />
        
        <color attach="background" args={["#111"]} />
        <Environment preset="city" environmentIntensity={envIntensity} />
        <Suspense fallback={null}>
          <Model nightMix={uNightMix} />
          <ReflectTest />
          <Reflector />
        </Suspense>

        <OrbitControls autoRotate={true} autoRotateSpeed={0.1} enableDamping makeDefault target={[0, 1.5, 0]} />

      </Canvas>

      {/* 컨트롤 버튼 */}
      <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
        {/* Perspective 원형 버튼 */}
        <button
          onClick={() => setIsPerspective(!isPerspective)}
          className={`
            w-12 h-12 rounded-full
            backdrop-blur-xl
            border border-white/20
            transition-all duration-300
            flex items-center justify-center
            text-sm font-medium
            shadow-lg
            ${isPerspective 
              ? 'bg-blue-500/80 text-white' 
              : 'bg-white/10 text-white/70 hover:bg-white/20'
            }
          `}
        >
          <Box className="w-5 h-5" />
        </button>

        {/* Night Mode 토글 버튼 */}
        <button
          onClick={() => setIsNightMode(!isNightMode)}
          className={`
            relative w-20 h-12 rounded-full
            backdrop-blur-xl
            border border-white/20
            transition-all duration-300
            shadow-lg
            flex items-center
            ${isNightMode 
              ? 'bg-white/10' 
              : 'bg-white/50 hover:bg-white/60'
            }
          `}
        >
          {/* 해 아이콘 (낮 모드일 때 오른쪽에) */}
          <div
            className={`
              absolute top-1/2 -translate-y-1/2
              transition-all duration-300
              ${isNightMode ? 'left-[8px] opacity-0' : 'left-[calc(100%-30px)] opacity-100'}
            `}
          >
            <Sun className="w-5 h-5 text-yellow-300" />
          </div>

          {/* 달 아이콘 (밤 모드일 때 왼쪽에) */}
          <div
            className={`
              absolute top-1/2 -translate-y-1/2
              transition-all duration-300
              ${isNightMode ? 'left-[8px] opacity-100' : 'left-[calc(100%-28px)] opacity-0'}
            `}
          >
            <Moon className="w-5 h-5 text-blue-200" />
          </div>

          {/* 흰색 토글 원 */}
          <div
            className={`
              absolute top-[5px] 
              w-[36px] h-[36px] 
              rounded-full
              transition-all duration-300
              shadow-md
              ${isNightMode ? 'bg-blue-200 left-[calc(100%-41px)]' : 'bg-yellow-300 left-[5px]'}
            `}
          />
        </button>
      </div>
    </div>
  );
}
 

