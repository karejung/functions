import * as THREE from 'three/webgpu'
import { reflector, uniform } from 'three/tsl'
import { useControls } from 'leva'
import { useGLTF } from '@react-three/drei'
import React, { useMemo } from 'react'

type ReflectTestProps = {
  floorOpacity?: number
}

export function ReflectTest({ floorOpacity: floorOpacityProp = 0 }: ReflectTestProps) {
  const { scene: floorScene } = useGLTF('/gltf/texture/floormesh.glb')
  const { reflectionIntensity } = useControls('Reflection', {
    reflectionIntensity: { value: 0.75, min: 0, max: 1, step: 0.01, label: 'Intensity' },
  })
  
  // reflector 생성
  const reflection = useMemo(() => {
    const ref = reflector({ resolutionScale: 1 })
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
    mat.opacity = floorOpacityProp
    mat.emissiveNode = reflection.mul(intensityUniform)
    mat.roughness = 0.8
    mat.metalness = 0.1
    return mat
  }, [reflection, intensityUniform, floorOpacityProp])
  
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

useGLTF.preload('/gltf/texture/floormesh.glb')

