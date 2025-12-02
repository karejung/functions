import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import { BASE_PATH } from '@/config/basePath'

type ModelType = 'S' | 'L' | 'Hole'

// S 모델
type GLTFResultS = GLTF & {
  nodes: {
    S: THREE.Mesh
  }
  materials: {
    ['Plane_Baked.003']: THREE.MeshStandardMaterial
  }
}

// L 모델
type GLTFResultL = GLTF & {
  nodes: {
    L: THREE.Mesh
  }
  materials: {
    ['Plane_Baked.003']: THREE.MeshStandardMaterial
  }
}

// Hole 모델
type GLTFResultHole = GLTF & {
  nodes: {
    hole: THREE.Mesh
  }
  materials: {
    ['Plane_Baked.003']: THREE.MeshStandardMaterial
  }
}

type ModelProps = React.ComponentProps<'group'> & {
  modelType: ModelType
}

export function Model({ modelType, ...props }: ModelProps) {
  if (modelType === 'S') {
    const { nodes, materials } = useGLTF(`${BASE_PATH}/gltf/module/S.gltf`) as unknown as GLTFResultS
    return (
      <group {...props} dispose={null}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.S.geometry}
          material={materials['Plane_Baked.003']}
        />
      </group>
    )
  }

  if (modelType === 'L') {
    const { nodes, materials } = useGLTF(`${BASE_PATH}/gltf/module/L.gltf`) as unknown as GLTFResultL
    return (
      <group {...props} dispose={null}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.L.geometry}
          material={materials['Plane_Baked.003']}
        />
      </group>
    )
  }

  // Hole
  const { nodes, materials } = useGLTF(`${BASE_PATH}/gltf/module/Hole.gltf`) as unknown as GLTFResultHole
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.hole.geometry}
        material={materials['Plane_Baked.003']}
      />
    </group>
  )
}

// 모든 모델 preload
useGLTF.preload(`${BASE_PATH}/gltf/module/S.gltf`)
useGLTF.preload(`${BASE_PATH}/gltf/module/L.gltf`)
useGLTF.preload(`${BASE_PATH}/gltf/module/Hole.gltf`)
