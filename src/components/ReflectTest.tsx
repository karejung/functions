import * as THREE from 'three/webgpu'
import { reflector, uniform } from 'three/tsl'
// import { useControls } from 'leva'
import { useGLTF } from '@react-three/drei'
import React, { useMemo } from 'react'

export function ReflectTest() {
  const basePath = process.env.NODE_ENV === 'production' ? '/lightmap' : ''
  const { scene: floorScene } = useGLTF(`${basePath}/gltf/texture/floormesh.glb`)
  
  // const { reflectionIntensity } = useControls('Reflection', {
  //   reflectionIntensity: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'Intensity' },
  // })
  const reflectionIntensity = 0.5
  const floorOpacity = 0.05
  
  // reflector 생성
  const reflection = useMemo(() => {
    const ref = reflector({ resolutionScale: 0.5, depth: true, bounces: false })
    ref.target.rotateX(-Math.PI / 2)
    return ref
  }, [])
  
  const intensityUniform = useMemo(() => uniform(reflectionIntensity), [])
  
  // uniform 값 업데이트
  React.useEffect(() => {
    intensityUniform.value = reflectionIntensity
  }, [reflectionIntensity, intensityUniform])
  
  // 바닥 material
  const floorMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardNodeMaterial()
    mat.color = new THREE.Color(0x222222) // 어두운 회색 바닥
    mat.transparent = true
    mat.opacity = floorOpacity
    mat.emissiveNode = reflection.mul(intensityUniform)
    mat.roughness = 0.8
    mat.metalness = 0.1
    return mat
  }, [reflection, intensityUniform, floorOpacity])
  
  // floormesh.glb에 material 적용
  React.useEffect(() => {
    floorScene.traverse((child) => {
      if ((child as any).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.material = floorMaterial
        mesh.receiveShadow = true
      }
    })
  }, [floorScene, floorMaterial])

  return (
    <group>
      {/* reflection target (보이지 않는 가상 평면) */}
      <primitive object={reflection.target} position={[0, 0.01, 0]} />
      
      {/* floormesh.glb 바닥 */}
      <primitive object={floorScene} position={[0, 0.01, 0]} />
    </group>
  )
}

const basePath = process.env.NODE_ENV === 'production' ? '/lightmap' : ''
useGLTF.preload(`${basePath}/gltf/texture/floormesh.glb`)

