import { useMemo } from 'react'
import * as THREE from 'three/webgpu'
import { reflector, uniform } from 'three/tsl'

type ReflectorProps = React.JSX.IntrinsicElements['group']

export function Reflector(props: ReflectorProps) {
  // 기존 reflector 설정 그대로 유지
  const reflectorData = useMemo(() => [
    {
      // Plane 1 - 큰 거울 (벽면)
      position: [0, 1, 1.75] as [number, number, number],
      rotation: [-Math.PI / 1, 0, 0] as [number, number, number],
      args: [1.74, 1.96],
      intensity: 0.1
    },
    {
      // Plane 2 - 작은 거울
      position: [-1.16, 0.6, 1.64] as [number, number, number],
      rotation: [-Math.PI / 1.025, 0, 0] as [number, number, number],
      args: [.25, 1.11],
      intensity: 0.5
    }
  ], [])

  // 각 반사면에 대한 reflector와 material 생성
  const reflectors = useMemo(() => {
    return reflectorData.map((item, index) => {
      // WebGPU reflector 생성
      const reflection = reflector({ resolutionScale: 1, depth: true, bounces: false })
      
      // rotation을 quaternion으로 변환하여 적용
      const euler = new THREE.Euler(item.rotation[0], item.rotation[1], item.rotation[2])
      reflection.target.quaternion.setFromEuler(euler)
      reflection.target.position.set(item.position[0], item.position[1], item.position[2])
      
      // intensity uniform
      const intensityUniform = uniform(item.intensity)
      
      // material 생성
      const material = new THREE.MeshStandardNodeMaterial()
      material.color = new THREE.Color(0x222222)
      material.transparent = true
      material.opacity = 1 // 고정
      material.emissiveNode = reflection.mul(intensityUniform)
      material.roughness = 0.8
      material.metalness = 0.1
      
      return {
        reflection,
        material,
        position: item.position,
        rotation: item.rotation,
        args: item.args
      }
    })
  }, [reflectorData])

  return (
    <group {...props}>
      {reflectors.map((item, index) => (
        <group key={index}>
          {/* reflection target (보이지 않음) */}
          <primitive object={item.reflection.target} />
          
          {/* 실제 반사 mesh */}
          <mesh 
            position={item.position} 
            rotation={item.rotation}
            receiveShadow
          >
            <planeGeometry args={[item.args[0], item.args[1]]} />
            <primitive object={item.material} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

