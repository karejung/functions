uniform sampler2D uBakedTexture1;
uniform sampler2D uBakedTexture2;
uniform float uNightMix;

varying vec2 vUv;

// sRGB to Linear 변환 (감마 디코딩)
vec3 sRGBToLinear(vec3 srgb) {
    return pow(srgb, vec3(2.2));
}

void main()
{
    // 2개의 텍스처 읽기 (sRGB로 저장된 이미지)
    vec3 bakedTexture1 = texture2D(uBakedTexture1, vUv).rgb;
    vec3 bakedTexture2 = texture2D(uBakedTexture2, vUv).rgb;
    
    // Day/Night 텍스처 블렌딩 (sRGB 공간에서 mix)
    vec3 bakedColor = mix(bakedTexture1, bakedTexture2, uNightMix);
    
    // sRGB → Linear 변환 (LinearSRGBColorSpace 설정 시 수동 변환 필요)
    bakedColor = sRGBToLinear(bakedColor);
    
    // Linear 공간 그대로 출력 (렌더러가 최종 변환)
    gl_FragColor = vec4(bakedColor, 1.0);
}

