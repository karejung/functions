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
    zoom: 25,
    near: 0.01,
    far: 1000,
    frustumSize: 150
  }
};

// 카메라 전환을 위한 컴포넌트
function CameraController({ isPerspective }: { isPerspective: boolean }) {
  const { gl, set } = useThree();
  
  useEffect(() => {
    if (isPerspective) {
      // Perspective 카메라로 전환
      const config = CAMERA_CONFIG.perspective;
      const perspectiveCamera = new THREE.PerspectiveCamera(
        config.fov, 
        gl.domElement.width / gl.domElement.height, 
        config.near, 
        config.far
      );
      perspectiveCamera.position.set(...config.position);
      set({ camera: perspectiveCamera });
    } else {
      // Orthographic 카메라로 전환
      const config = CAMERA_CONFIG.orthographic;
      const aspect = gl.domElement.width / gl.domElement.height;
      const orthographicCamera = new THREE.OrthographicCamera(
        -config.frustumSize * aspect / 2,
        config.frustumSize * aspect / 2,
        config.frustumSize / 2,
        -config.frustumSize / 2,
        config.near,
        config.far
      );
      orthographicCamera.position.set(...config.position);
      orthographicCamera.zoom = config.zoom;
      set({ camera: orthographicCamera });
    }
  }, [isPerspective, gl, set]);
  
  return null;
}

export default function Scene() {
  // WebGPU 지원 여부 확인 (지원되지 않으면 perspective 카메라 사용)
  const isWebGPUSupported = useMemo(() => {
    if (typeof window === 'undefined') return true;
    return 'gpu' in navigator;
  }, []);

  // 상태 관리
  const [isPerspective, setIsPerspective] = useState(!isWebGPUSupported);
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

  // 카메라 설정 (초기값)
  const cameraConfig = useMemo(() => {
    if (isPerspective) {
      return {
        orthographic: false,
        camera: {
          position: CAMERA_CONFIG.perspective.position,
          fov: CAMERA_CONFIG.perspective.fov,
          near: CAMERA_CONFIG.perspective.near,
          far: CAMERA_CONFIG.perspective.far
        }
      }
    } else {
      return {
        orthographic: true,
        camera: {
          position: CAMERA_CONFIG.orthographic.position,
          zoom: CAMERA_CONFIG.orthographic.zoom,
          near: CAMERA_CONFIG.orthographic.near,
          far: CAMERA_CONFIG.orthographic.far
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

        <OrbitControls 
          autoRotate={true} 
          autoRotateSpeed={0.05} 
          enableDamping 
          makeDefault 
          target={[0, 1.5, 0]}
          maxPolarAngle={Math.PI / 2} // 수평 아래로 회전 제한
        />

      </Canvas>

      {/* 컨트롤 버튼 */}
      <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
        {/* Perspective 원형 버튼 */}
        <button
          onClick={() => setIsPerspective(!isPerspective)}
          disabled={!isWebGPUSupported}
          className={`
            w-12 h-12 rounded-full
            backdrop-blur-xl
            border border-white/20
            transition-all duration-300
            flex items-center justify-center
            text-sm font-medium
            shadow-lg
            ${!isWebGPUSupported 
              ? 'bg-gray-500/30 text-white/30 cursor-not-allowed' 
              : isPerspective 
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
 

