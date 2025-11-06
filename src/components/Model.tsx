import * as THREE from 'three'
import React from 'react'
import { useGLTF, useTexture } from '@react-three/drei'

export function Model(props: React.JSX.IntrinsicElements['group']) {
  const { scene } = useGLTF('/gltf/test.gltf')
  const lightMap = useTexture('/gltf/texture/lightmap.webp')
  
  lightMap.flipY = false
  lightMap.colorSpace = THREE.LinearSRGBColorSpace
  lightMap.channel = 1 // TEXCOORD_1 (uv2) 사용

  scene.traverse((o) => {
    if ((o as any).isMesh) {
      const mesh = o as THREE.Mesh
      const g = mesh.geometry as THREE.BufferGeometry

      // TEXCOORD_1은 자동으로 uv2로 로드됨
      // uv2가 없고 uv가 있으면 uv를 uv2로 복사
      if (!g.getAttribute('uv2') && g.getAttribute('uv')) {
        g.setAttribute('uv2', new THREE.BufferAttribute(g.getAttribute('uv').array, 2))
      }

      const apply = (mat: THREE.Material) => {
        if ((mat as any).isMeshStandardMaterial) {
          const m = mat as THREE.MeshStandardMaterial
          m.lightMap = lightMap
          m.lightMapIntensity = 0.0
          // emissiveMap은 gltf에서 자동으로 로드됨 (retopoBed_Baked.webp)
        }
      }
      
      Array.isArray(mesh.material) ? mesh.material.forEach(apply) : apply(mesh.material as THREE.Material)
    }
  })

  return <primitive object={scene} {...props} />
}

useGLTF.preload('/gltf/test.gltf')
useTexture.preload('/gltf/texture/lightmap.webp')
