"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, TransformControls, useGLTF } from "@react-three/drei";
import * as THREE from "three/webgpu";
import { ProgressiveLightMap } from "three/addons/misc/ProgressiveLightMapGPU.js";

// ShadowMap + LightMap Res and Number of Directional Lights
const shadowMapRes = 1024;
const lightMapRes = 1024;
const lightCount = 4;

// 모델 컴포넌트
function Model({
  progressiveLightMapRef,
  lightmapObjects,
  onModelLoaded,
}: {
  progressiveLightMapRef: React.MutableRefObject<ProgressiveLightMap | null>;
  lightmapObjects: React.MutableRefObject<(THREE.Mesh | THREE.DirectionalLight)[]>;
  onModelLoaded: (obj: THREE.Group) => void;
}) {
  const { scene: model } = useGLTF("/test/cylinder.gltf");
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (model && groupRef.current) {
      console.log("Model loaded:", model);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          console.log("Mesh found:", child.name);
          console.log("Has UV:", child.geometry.hasAttribute("uv"));
          console.log("Has Normal:", child.geometry.hasAttribute("normal"));

          child.name = "Loaded Mesh";
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = new THREE.MeshPhongMaterial({ color: 0xffffff });

          // This adds the model to the lightmap
          lightmapObjects.current.push(child);
          if (progressiveLightMapRef.current) {
            progressiveLightMapRef.current.addObjectsToLightMap(lightmapObjects.current);
            console.log("Added to lightmap, total objects:", lightmapObjects.current.length);
          }
        } else {
          child.layers.disableAll();
        }
      });

      onModelLoaded(groupRef.current);
    }
  }, [model, progressiveLightMapRef, lightmapObjects, onModelLoaded]);

  return (
    <group ref={groupRef} scale={100} position={[0, 0, 0]}>
      <primitive object={model} />
    </group>
  );
}

// Progressive Lights 컴포넌트
function ProgressiveLights({
  lightOriginPosition,
  targetPosition,
  params,
  lightmapObjects,
}: {
  lightOriginPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  params: {
    enable: boolean;
    lightRadius: number;
    ambientWeight: number;
  };
  lightmapObjects: React.MutableRefObject<(THREE.Mesh | THREE.DirectionalLight)[]>;
}) {
  const lightsRef = useRef<THREE.DirectionalLight[]>([]);

  useEffect(() => {
    // Add lights to lightmap objects
    lightsRef.current.forEach((light) => {
      if (light && !lightmapObjects.current.includes(light)) {
        lightmapObjects.current.push(light);
      }
    });
  }, [lightmapObjects]);

  useFrame(() => {
    if (!params.enable) return;

    lightsRef.current.forEach((light) => {
      if (!light) return;

      if (Math.random() > params.ambientWeight) {
        light.position.set(
          lightOriginPosition.x + Math.random() * params.lightRadius,
          lightOriginPosition.y + Math.random() * params.lightRadius,
          lightOriginPosition.z + Math.random() * params.lightRadius
        );
      } else {
        const lambda = Math.acos(2 * Math.random() - 1) - Math.PI / 2.0;
        const phi = 2 * Math.PI * Math.random();
        light.position.set(
          Math.cos(lambda) * Math.cos(phi) * 300 + targetPosition.x,
          Math.abs(Math.cos(lambda) * Math.sin(phi) * 300) + targetPosition.y + 50,
          Math.sin(lambda) * 300 + targetPosition.z
        );
      }
    });
  });

  return (
    <>
      {Array.from({ length: lightCount }).map((_, i) => (
        <directionalLight
          key={i}
          ref={(ref) => {
            if (ref && !lightsRef.current.includes(ref)) {
              lightsRef.current[i] = ref;
            }
          }}
          intensity={Math.PI / lightCount}
          position={[200, 200, 200]}
          castShadow
          shadow-mapSize-width={shadowMapRes}
          shadow-mapSize-height={shadowMapRes}
          shadow-camera-near={10}
          shadow-camera-far={5000}
          shadow-camera-right={250}
          shadow-camera-left={-250}
          shadow-camera-top={250}
          shadow-camera-bottom={-250}
          shadow-bias={-0.001}
        />
      ))}
    </>
  );
}

// Light Origin 컴포넌트
function LightOrigin({
  position,
  onPositionChange,
}: {
  position: THREE.Vector3;
  onPositionChange: (pos: THREE.Vector3) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null);

  useEffect(() => {
    if (meshRef.current) {
      setMesh(meshRef.current);
    }
  }, []);

  return (
    <>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[5, 16, 16]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
      {mesh && (
        <TransformControls
          object={mesh}
          mode="translate"
          onObjectChange={() => {
            if (meshRef.current) {
              onPositionChange(meshRef.current.position.clone());
            }
          }}
        />
      )}
    </>
  );
}

// Model Transform Controls
function ModelTransformControls({ modelRef }: { modelRef: React.MutableRefObject<THREE.Group | null> }) {
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    if (modelRef.current) {
      setModel(modelRef.current);
    }
  }, [modelRef]);

  return (
    <>
      {model && (
        <TransformControls object={model} mode="translate" />
      )}
    </>
  );
}

// Scene Content 컴포넌트
function SceneContent({
  params,
  lightOriginPosition,
  setLightOriginPosition,
  progressiveLightMapRef,
}: {
  params: {
    enable: boolean;
    blurEdges: boolean;
    blendWindow: number;
    lightRadius: number;
    ambientWeight: number;
  };
  lightOriginPosition: THREE.Vector3;
  setLightOriginPosition: (pos: THREE.Vector3) => void;
  progressiveLightMapRef: React.MutableRefObject<ProgressiveLightMap | null>;
}) {
  const { gl, camera } = useThree();
  const [targetPosition] = useState(new THREE.Vector3(0, 0, 0));
  const lightmapObjects = useRef<(THREE.Mesh | THREE.DirectionalLight)[]>([]);
  const modelRef = useRef<THREE.Group | null>(null);
  const groundMeshRef = useRef<THREE.Mesh>(null);

  // ProgressiveLightMap 초기화
  useEffect(() => {
    if (gl instanceof THREE.WebGPURenderer) {
      const progressiveLightMap = new ProgressiveLightMap(gl, lightMapRes);
      progressiveLightMapRef.current = progressiveLightMap;

      console.log("ProgressiveLightMap initialized");

      return () => {
        if (typeof (progressiveLightMap as any).dispose === 'function') {
          (progressiveLightMap as any).dispose();
        }
      };
    }
  }, [gl, progressiveLightMapRef]);

  // Ground mesh를 lightmap objects에 추가
  useEffect(() => {
    if (groundMeshRef.current && !lightmapObjects.current.includes(groundMeshRef.current)) {
      lightmapObjects.current.push(groundMeshRef.current);
      console.log("Ground added to lightmap objects");
    }
  }, []);

  // useFrame에서 progressive lightmap update
  useFrame(() => {
    if (params.enable && progressiveLightMapRef.current && camera instanceof THREE.PerspectiveCamera) {
      progressiveLightMapRef.current.update(camera, params.blendWindow, params.blurEdges);
    }
  });

  const handleModelLoaded = (obj: THREE.Group) => {
    modelRef.current = obj;
  };

  return (
    <>
      <color attach="background" args={["#949494"]} />
      <fog attach="fog" args={["#949494", 1000, 3000]} />

      {/* Progressive Lights */}
      <ProgressiveLights
        lightOriginPosition={lightOriginPosition}
        targetPosition={targetPosition}
        params={params}
        lightmapObjects={lightmapObjects}
      />

      {/* Light Origin */}
      <LightOrigin position={lightOriginPosition} onPositionChange={setLightOriginPosition} />

      {/* Ground */}
      <mesh
        ref={groundMeshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -20, 0]}
        receiveShadow
      >
        <planeGeometry args={[600, 600]} />
        <meshPhongMaterial color={0xffffff} depthWrite={true} />
      </mesh>

      {/* Model */}
      <Suspense fallback={null}>
        <Model
          progressiveLightMapRef={progressiveLightMapRef}
          lightmapObjects={lightmapObjects}
          onModelLoaded={handleModelLoaded}
        />
      </Suspense>

      {/* Model Transform Controls */}
      <ModelTransformControls modelRef={modelRef} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        screenSpacePanning
        minDistance={10}
        maxDistance={500}
        maxPolarAngle={Math.PI / 1.5}
        target={[0, 0, 0]}
        makeDefault
      />
    </>
  );
}

// Control Panel 컴포넌트
function ControlPanel({
  params,
  setParams,
  progressiveLightMapRef,
}: {
  params: any;
  setParams: (params: any) => void;
  progressiveLightMapRef: React.MutableRefObject<ProgressiveLightMap | null>;
}) {
  return (
    <div className="fixed top-4 right-4 bg-black/70 text-white p-4 rounded-lg space-y-3 z-10">
      <h3 className="font-bold text-lg mb-2">Progressive Lightmap Settings</h3>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={params.enable}
          onChange={(e) => setParams({ ...params, enable: e.target.checked })}
        />
        <span>Enable</span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={params.blurEdges}
          onChange={(e) => setParams({ ...params, blurEdges: e.target.checked })}
        />
        <span>Blur Edges</span>
      </label>

      <div>
        <label className="block text-sm mb-1">Blend Window: {params.blendWindow}</label>
        <input
          type="range"
          min="1"
          max="500"
          value={params.blendWindow}
          onChange={(e) => setParams({ ...params, blendWindow: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Light Radius: {params.lightRadius}</label>
        <input
          type="range"
          min="0"
          max="200"
          step="10"
          value={params.lightRadius}
          onChange={(e) => setParams({ ...params, lightRadius: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">
          Ambient Weight: {params.ambientWeight.toFixed(1)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={params.ambientWeight}
          onChange={(e) => setParams({ ...params, ambientWeight: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={params.debugLightmap}
          onChange={(e) => {
            setParams({ ...params, debugLightmap: e.target.checked });
            if (progressiveLightMapRef.current) {
              progressiveLightMapRef.current.showDebugLightmap(e.target.checked);
            }
          }}
        />
        <span>Debug Lightmap</span>
      </label>
    </div>
  );
}

// 메인 Export
export default function Scene3() {
  const [lightOriginPosition, setLightOriginPosition] = useState(
    new THREE.Vector3(60, 80, 100)
  );
  const [params, setParams] = useState({
    enable: true,
    blurEdges: true,
    blendWindow: 200,
    lightRadius: 50,
    ambientWeight: 0.5,
    debugLightmap: false,
  });
  const progressiveLightMapRef = useRef<ProgressiveLightMap | null>(null);

  return (
    <div className="w-screen h-screen relative">
      <Canvas
        shadows
        camera={{
          position: [0, 50, 150],
          fov: 70,
          near: 1,
          far: 5000,
        }}
        gl={async (canvasProps) => {
          const renderer = new THREE.WebGPURenderer({
            canvas: canvasProps.canvas as HTMLCanvasElement,
            antialias: true,
          });

          renderer.shadowMap.enabled = true;
          await renderer.init();

          return renderer;
        }}
      >
        <SceneContent
          params={params}
          lightOriginPosition={lightOriginPosition}
          setLightOriginPosition={setLightOriginPosition}
          progressiveLightMapRef={progressiveLightMapRef}
        />
      </Canvas>

      {/* Control Panel */}
      <ControlPanel
        params={params}
        setParams={setParams}
        progressiveLightMapRef={progressiveLightMapRef}
      />

      {/* Info */}
      <div className="fixed top-4 left-4 text-white z-10">
        <div className="bg-black/70 p-4 rounded-lg">
          <h1 className="text-xl font-bold mb-2">Progressive Lightmaps</h1>
          <p className="text-sm">
            By{" "}
            <a
              href="https://github.com/zalo"
              target="_blank"
              rel="noopener"
              className="text-blue-400 underline"
            >
              zalo
            </a>
            . Inspired by{" "}
            <a
              href="http://madebyevan.com/shaders/lightmap/"
              target="_blank"
              rel="noopener"
              className="text-blue-400 underline"
            >
              evanw's Lightmap Generation
            </a>
            .
          </p>
          <p className="text-xs mt-2 text-gray-300">
            노란 구를 드래그하여 라이트 위치를 조정하세요
          </p>
        </div>
      </div>
    </div>
  );
}
