import * as THREE from 'three/webgpu'
import { texture, uniform, mix } from 'three/tsl'
import React, { useMemo } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'

type ModelProps = React.JSX.IntrinsicElements['group'] & {
  nightMix: number
}

export function Model({ nightMix, ...props }: ModelProps) {
  const { scene } = useGLTF('/gltf/test.gltf')
  
  // 2개의 Baked 텍스처 로드 (Day & Night)
  const [bakedTexture1, bakedTexture2] = useTexture([
    '/gltf/texture/retopoBed_Baked.webp',
    '/gltf/texture/retopoBed_Baked2.webp'
  ])
  
  // 텍스처 설정
  bakedTexture1.flipY = false
  bakedTexture1.colorSpace = THREE.SRGBColorSpace
  
  bakedTexture2.flipY = false
  bakedTexture2.colorSpace = THREE.SRGBColorSpace

  // TSL uniform 생성 (메모이제이션)
  const nightMixUniform = useMemo(() => uniform(nightMix), [])
  
  // nightMix 값 업데이트
  React.useEffect(() => {
    nightMixUniform.value = nightMix
  }, [nightMix, nightMixUniform])

  // TSL 노드로 Day/Night 블렌딩 구현
  const bakedTextureNode1 = useMemo(() => texture(bakedTexture1), [bakedTexture1])
  const bakedTextureNode2 = useMemo(() => texture(bakedTexture2), [bakedTexture2])
  
  const blendedColorNode = useMemo(
    () => mix(bakedTextureNode1, bakedTextureNode2, nightMixUniform),
    [bakedTextureNode1, bakedTextureNode2, nightMixUniform]
  )

  scene.traverse((o) => {
    if ((o as any).isMesh) {
      const mesh = o as THREE.Mesh
      const g = mesh.geometry as THREE.BufferGeometry

      // 스무스 쉐이딩을 위한 vertex normals 재계산
      g.computeVertexNormals()

      // uv2가 없고 uv가 있으면 uv를 uv2로 복사
      if (!g.getAttribute('uv2') && g.getAttribute('uv')) {
        g.setAttribute('uv2', new THREE.BufferAttribute(g.getAttribute('uv').array, 2))
      }

      // 기존 Material을 TSL 기반 MeshStandardNodeMaterial로 교체
      if (!mesh.userData.tslMaterialApplied) {
        mesh.userData.tslMaterialApplied = true
        
        const nodeMaterial = new THREE.MeshStandardNodeMaterial()
        
        // baseColor는 검은색 (emissive만 보이도록)
        nodeMaterial.color = new THREE.Color(0, 0, 0)
        
        // emissive에만 블렌딩된 텍스처 적용
        nodeMaterial.emissiveNode = blendedColorNode
        nodeMaterial.emissive = new THREE.Color(1, 1, 1) // emissive intensity
        
        // 기존 material 속성 복사 (필요시)
        const oldMat = mesh.material as THREE.Material
        nodeMaterial.side = oldMat.side
        
        // 기존 material dispose
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: THREE.Material) => m.dispose())
        } else {
          mesh.material.dispose()
        }
        
        mesh.material = nodeMaterial
      }
    }
  })

  return <primitive object={scene} {...props} />
}

useGLTF.preload('/gltf/test.gltf')
useTexture.preload('/gltf/texture/retopoBed_Baked.webp')
useTexture.preload('/gltf/texture/retopoBed_Baked2.webp')
