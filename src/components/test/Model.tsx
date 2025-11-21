import * as THREE from 'three'
import React, { useRef, useEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
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

export function Model(props: React.ComponentProps<'group'>) {
  const group = useRef<THREE.Group>(null)
  const { nodes, materials, animations } = useGLTF('/test/cylinder.gltf') as unknown as GLTFResult
  const { actions } = useAnimations(animations, group)
  
  // 스무스 쉐이딩 적용
  useEffect(() => {
    if (nodes.Cylinder_1.geometry) {
      nodes.Cylinder_1.geometry.computeVertexNormals()
    }
    // Material의 flatShading을 false로 설정 (smooth shading)
    if (materials.Cylinder_Baked) {
      materials.Cylinder_Baked.flatShading = false
      materials.Cylinder_Baked.needsUpdate = true
    }
  }, [nodes, materials])
  
  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <mesh
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
