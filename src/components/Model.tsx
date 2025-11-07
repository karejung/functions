import * as THREE from 'three'
import React, { useRef } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { useControls } from 'leva'

type ModelProps = React.JSX.IntrinsicElements['group']

export function Model(props: ModelProps) {
  const { scene } = useGLTF('/gltf/test.gltf')
  
  // 2개의 Baked 텍스처 로드 (Day & Night)
  const [bakedTexture1, bakedTexture2] = useTexture([
    '/gltf/texture/retopoBed_Baked.webp',
    '/gltf/texture/retopoBed_Baked2.webp'
  ])
  
  // Leva 디버그 UI - Night Mix 슬라이더만
  const { uNightMix } = useControls('Baked Material', {
    uNightMix: { value: 0, min: 0, max: 1, step: 0.01, label: 'Night Mix' }
  })
  
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([])
  
  // 텍스처 설정
  bakedTexture1.flipY = false
  bakedTexture1.colorSpace = THREE.SRGBColorSpace
  
  bakedTexture2.flipY = false
  bakedTexture2.colorSpace = THREE.SRGBColorSpace

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

      const mat = mesh.material as THREE.MeshStandardMaterial
      
      // MeshStandardMaterial의 onBeforeCompile로 커스터마이징
      if ((mat as any).isMeshStandardMaterial && !mat.userData.customized) {
        mat.userData.customized = true
        
        // baseColor와 emissive에 Day/Night 블렌딩 적용
        mat.onBeforeCompile = (shader) => {
          // Uniforms 추가
          shader.uniforms.uBakedTexture1 = { value: bakedTexture1 }
          shader.uniforms.uBakedTexture2 = { value: bakedTexture2 }
          shader.uniforms.uNightMix = { value: uNightMix }
          
          // Vertex Shader에 varying 추가
          shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `#include <common>
            varying vec2 vUv;`
          )
          
          shader.vertexShader = shader.vertexShader.replace(
            '#include <uv_vertex>',
            `#include <uv_vertex>
            vUv = uv;`
          )
          
          // Fragment Shader 수정
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `#include <common>
            uniform sampler2D uBakedTexture1;
            uniform sampler2D uBakedTexture2;
            uniform float uNightMix;
            varying vec2 vUv;
            
            vec3 sRGBToLinear(vec3 srgb) {
              return pow(srgb, vec3(2.2));
            }`
          )
          
          // map (baseColor) 교체
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            `#ifdef USE_MAP
              vec3 bakedTexture1 = texture2D(uBakedTexture1, vUv).rgb;
              vec3 bakedTexture2 = texture2D(uBakedTexture2, vUv).rgb;
              vec3 blendedColor = mix(bakedTexture1, bakedTexture2, uNightMix);
              vec4 sampledDiffuseColor = vec4(blendedColor, 1.0);
              diffuseColor *= sampledDiffuseColor;
            #endif`
          )
          
          // emissive 교체
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            `#ifdef USE_EMISSIVEMAP
              vec3 bakedTexture1_e = texture2D(uBakedTexture1, vUv).rgb;
              vec3 bakedTexture2_e = texture2D(uBakedTexture2, vUv).rgb;
              vec3 blendedEmissive = mix(bakedTexture1_e, bakedTexture2_e, uNightMix);
              vec4 emissiveColor = vec4(blendedEmissive, 1.0);
              totalEmissiveRadiance *= emissiveColor.rgb;
            #endif`
          )
          
          mat.userData.shader = shader
        }
        
        materialsRef.current.push(mat)
      }
    }
  })
  
  // uNightMix 업데이트
  React.useEffect(() => {
    materialsRef.current.forEach(mat => {
      if (mat.userData.shader) {
        mat.userData.shader.uniforms.uNightMix.value = uNightMix
      }
    })
  }, [uNightMix])

  return <primitive object={scene} {...props} />
}

useGLTF.preload('/gltf/test.gltf')
useTexture.preload('/gltf/texture/retopoBed_Baked.webp')
useTexture.preload('/gltf/texture/retopoBed_Baked2.webp')
