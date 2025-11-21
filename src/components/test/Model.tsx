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

// URL을 텍스처 키로 매핑하는 헬퍼 함수
const getTextureKey = (url: string): 'combined' | 'black' | 'white' => {
  if (url.includes('Cylinder_Bake1_CyclesBake_COMBINED')) return 'combined'
  if (url.includes('black')) return 'black'
  return 'white'
}

export function Model({ textureUrl, ...props }: ModelProps) {
  const basePath = process.env.NODE_ENV === 'production' ? '/functions' : ''
  const group = useRef<THREE.Group>(null)
  const { nodes, materials, animations } = useGLTF(`${basePath}/test/cylinder.gltf`) as unknown as GLTFResult
  const { actions } = useAnimations(animations, group)
  
  // 모든 텍스처를 한 번에 preload
  const textures = useTexture({
    combined: `${basePath}/test/textures/Cylinder_Bake1_CyclesBake_COMBINED.webp`,
    black: `${basePath}/test/textures/black.webp`,
    white: `${basePath}/test/textures/white.webp`
  })
  
  // 텍스처 설정 (모든 텍스처에 대해)
  Object.values(textures).forEach(tex => {
    tex.flipY = false
    tex.colorSpace = THREE.SRGBColorSpace
  })
  
  // 텍스처 블렌딩을 위한 상태 (텍스처 객체로 직접 관리)
  const initialKey = getTextureKey(textureUrl)
  const [currentTexture, setCurrentTexture] = useState<THREE.Texture>(textures[initialKey])
  const [previousTexture, setPreviousTexture] = useState<THREE.Texture>(textures[initialKey])
  const [mixValue, setMixValue] = useState(0) // 초기에도 블렌딩 애니메이션 시작
  const animationStartRef = useRef<number>(0)
  const isInitialMount = useRef(true)
  
  // 초기 마운트 시 블렌딩 애니메이션 시작
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      animationStartRef.current = Date.now()
    }
  }, [])
  
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
  
  // Material 참조를 저장 (재생성 방지)
  const materialRef = useRef<THREE.MeshStandardNodeMaterial | null>(null)
  
  // Geometry 설정 및 Material 초기화 (한 번만 실행)
  useEffect(() => {
    if (nodes.Cylinder_1) {
      const mesh = nodes.Cylinder_1
      const g = mesh.geometry as THREE.BufferGeometry
      
      // 스무스 쉐이딩을 위한 vertex normals 재계산
      g.computeVertexNormals()
      
      // Material을 TSL 기반 NodeMaterial로 교체 (초기화 시 한 번만)
      if (!materialRef.current) {
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
        
        materialRef.current = nodeMaterial
        mesh.material = nodeMaterial
      }
    }
  }, [nodes, materials, blendedColorNode])
  
  // Material의 colorNode와 emissiveNode 업데이트 (텍스처 변경 시)
  useEffect(() => {
    if (materialRef.current && blendedColorNode) {
      materialRef.current.colorNode = blendedColorNode
      materialRef.current.emissiveNode = blendedColorNode
      materialRef.current.needsUpdate = true
    }
  }, [blendedColorNode])
  
  // 텍스처 URL 변경 감지 및 블렌딩 애니메이션 시작
  useEffect(() => {
    const newKey = getTextureKey(textureUrl)
    const newTexture = textures[newKey]
    
    if (newTexture !== currentTexture) {
      setPreviousTexture(currentTexture)
      setCurrentTexture(newTexture)
      setMixValue(0)
      animationStartRef.current = Date.now()
    }
  }, [textureUrl, textures, currentTexture])
  
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

const basePath = process.env.NODE_ENV === 'production' ? '/functions' : ''
useGLTF.preload(`${basePath}/test/cylinder.gltf`)
