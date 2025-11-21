import * as THREE from 'three/webgpu'
import { texture, uniform, mix } from 'three/tsl'
import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useGLTF, useAnimations, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
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
  
  // 텍스처 블렌딩을 위한 상태
  const [currentTextureUrl, setCurrentTextureUrl] = useState(textureUrl)
  const [previousTextureUrl, setPreviousTextureUrl] = useState(textureUrl)
  const [mixValue, setMixValue] = useState(1)
  const animationStartRef = useRef<number>(0)
  
  // 현재 및 이전 텍스처 로드
  const currentTexture = useTexture(currentTextureUrl)
  const previousTexture = useTexture(previousTextureUrl)
  
  // 텍스처 설정
  currentTexture.flipY = false
  currentTexture.colorSpace = THREE.SRGBColorSpace
  
  previousTexture.flipY = false
  previousTexture.colorSpace = THREE.SRGBColorSpace
  
  // TSL uniform 생성 (메모이제이션)
  const mixUniform = useMemo(() => uniform(mixValue), [])
  
  // mixValue 업데이트
  useEffect(() => {
    mixUniform.value = mixValue
  }, [mixValue, mixUniform])
  
  // TSL 노드로 텍스처 블렌딩 구현
  const currentTextureNode = useMemo(() => texture(currentTexture), [currentTexture])
  const previousTextureNode = useMemo(() => texture(previousTexture), [previousTexture])
  
  const blendedColorNode = useMemo(
    () => mix(previousTextureNode, currentTextureNode, mixUniform),
    [previousTextureNode, currentTextureNode, mixUniform]
  )
  
  // Geometry 설정 및 Material 교체
  useEffect(() => {
    if (nodes.Cylinder_1) {
      const mesh = nodes.Cylinder_1
      const g = mesh.geometry as THREE.BufferGeometry
      
      // 스무스 쉐이딩을 위한 vertex normals 재계산
      if (!mesh.userData.normalsComputed) {
        mesh.userData.normalsComputed = true
        g.computeVertexNormals()
      }
      
      // Material을 TSL 기반 NodeMaterial로 교체 (또는 업데이트)
      if (!mesh.userData.tslMaterialApplied) {
        mesh.userData.tslMaterialApplied = true
        
        const nodeMaterial = new THREE.MeshStandardNodeMaterial()
        
        // baseColor와 emissive 둘 다 블렌딩된 텍스처 적용
        nodeMaterial.colorNode = blendedColorNode
        nodeMaterial.emissiveNode = blendedColorNode
        nodeMaterial.emissive = new THREE.Color(1, 1, 1)
        
        // 기존 material 속성 복사
        if (materials.Cylinder_Baked) {
          nodeMaterial.side = materials.Cylinder_Baked.side
          nodeMaterial.roughnessMap = materials.Cylinder_Baked.roughnessMap
          nodeMaterial.metalnessMap = materials.Cylinder_Baked.metalnessMap
          nodeMaterial.roughness = materials.Cylinder_Baked.roughness
          nodeMaterial.metalness = materials.Cylinder_Baked.metalness
        }
        
        mesh.material = nodeMaterial
      } else {
        // Material이 이미 있으면 colorNode와 emissiveNode만 업데이트
        const mat = mesh.material as THREE.MeshStandardNodeMaterial
        if (mat.colorNode !== blendedColorNode) {
          mat.colorNode = blendedColorNode
          mat.emissiveNode = blendedColorNode
          mat.needsUpdate = true
        }
      }
    }
  }, [nodes, materials, blendedColorNode])
  
  // 텍스처 URL 변경 감지 및 블렌딩 애니메이션 시작
  useEffect(() => {
    if (textureUrl !== currentTextureUrl) {
      setPreviousTextureUrl(currentTextureUrl)
      setCurrentTextureUrl(textureUrl)
      setMixValue(0)
      animationStartRef.current = Date.now()
    }
  }, [textureUrl, currentTextureUrl])
  
  // 블렌딩 애니메이션
  useFrame(() => {
    if (mixValue < 1) {
      const elapsed = Date.now() - animationStartRef.current
      const duration = 800 // 800ms
      const progress = Math.min(elapsed / duration, 1)
      
      // easeInOutCubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
      
      setMixValue(eased)
    }
  })
  
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
          name="Cylinder_1"
          castShadow
          receiveShadow
          geometry={nodes.Cylinder_1.geometry}
          material={nodes.Cylinder_1.material}
          position={[0, 0.002, 0]}
        />
      </group>
    </group>
  )
}

useGLTF.preload('/test/cylinder.gltf')
