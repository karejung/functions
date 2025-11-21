import * as THREE from 'three'
import React, { useRef, useEffect } from 'react'
import { useGLTF, useAnimations, useTexture } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    Cylinder_1: THREE.Mesh
  }
  materials: {
    Cylinder_Baked: THREE.MeshStandardMaterial
  }
}

type ActionName = 'CylinderAction.001'
type GLTFActions = Record<ActionName, THREE.AnimationAction>

type ModelProps = React.ComponentProps<'group'> & {
  textureUrl: string
}

export function Model({ textureUrl, ...props }: ModelProps) {
  const group = useRef<THREE.Group>(null)
  const { nodes, materials, animations } = useGLTF('/test/cylinder.gltf') as unknown as GLTFResult
  const { actions } = useAnimations(animations, group)
  const meshRef = useRef<THREE.Mesh>(null)
  const originalPropsRef = useRef<{
    roughnessMap: THREE.Texture | null
    metalnessMap: THREE.Texture | null
    roughness: number
    metalness: number
  } | null>(null)
  
  // 동적 텍스처 로드
  const texture = useTexture(textureUrl)
  
  // 한 번만 geometry 설정 및 원본 material 속성 저장
  useEffect(() => {
    if (nodes.Cylinder_1.geometry) {
      nodes.Cylinder_1.geometry.computeVertexNormals()
    }
    
    // 원본 material 속성 저장
    if (materials.Cylinder_Baked && !originalPropsRef.current) {
      originalPropsRef.current = {
        roughnessMap: materials.Cylinder_Baked.roughnessMap,
        metalnessMap: materials.Cylinder_Baked.metalnessMap,
        roughness: materials.Cylinder_Baked.roughness,
        metalness: materials.Cylinder_Baked.metalness
      }
    }
  }, [nodes, materials])
  
  // 텍스처 변경 시에만 업데이트
  useEffect(() => {
    if (meshRef.current && meshRef.current.material && originalPropsRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      
      // 텍스처 설정
      texture.flipY = false
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
      
      // baseColor 텍스처만 교체 (emissive 제거)
      mat.map = texture
      mat.emissiveMap = null
      mat.emissive = new THREE.Color(0, 0, 0)
      
      // roughness/metalness 속성 유지
      mat.roughnessMap = originalPropsRef.current.roughnessMap
      mat.metalnessMap = originalPropsRef.current.metalnessMap
      mat.roughness = originalPropsRef.current.roughness
      mat.metalness = originalPropsRef.current.metalness
      
      mat.flatShading = false
      mat.needsUpdate = true
    }
  }, [texture])
  
  // 텍스처 URL 변경 시 애니메이션 재생
  useEffect(() => {
    if (actions && actions['CylinderAction.001']) {
      const action = actions['CylinderAction.001']
      action.reset()
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.play()
    }
  }, [textureUrl, actions])
  
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <mesh
          ref={meshRef}
          name="Cylinder_1"
          castShadow
          receiveShadow
          geometry={nodes.Cylinder_1.geometry}
          material={materials.Cylinder_Baked}
          position={[0, 0.002, 0]}
        />
      </group>
    </group>
  )
}

useGLTF.preload('/test/cylinder.gltf')
