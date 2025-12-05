"use client";

import { useState, useEffect } from "react";

interface ScreenSize {
  width: number;
}

interface ScaleConfig {
  main: number;  // Scene.tsx용
  test: number;  // test/Scene.tsx용
  module: number;  // module/Scene.tsx용
}

interface PositionConfig {
  main: [number, number, number];  // Scene.tsx용 [x, y, z]
  test: [number, number, number];  // test/Scene.tsx용 [x, y, z]
  module: [number, number, number];  // module/Scene.tsx용 [x, y, z]
}

/**
 * 브라우저 화면 너비를 추적하고 반응형 스케일 및 위치 값을 반환하는 커스텀 훅
 * @returns {ScreenSize & { scale: ScaleConfig, position: PositionConfig }} 화면 너비, 스케일, 위치
 */
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
  });

  useEffect(() => {
    // 리사이즈 핸들러
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
      });
    };

    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', handleResize);

    // 초기 사이즈 설정
    handleResize();

    // 클린업
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 화면 너비에 따른 스케일 및 위치 값 계산
  const calculateResponsiveValues = (): { scale: ScaleConfig; position: PositionConfig } => {
    const { width } = screenSize;

    let mainScale = 1;     // Scene.tsx의 기본값
    let testScale = 10;    // test/Scene.tsx의 기본값
    let moduleScale = 1;   // module/Scene.tsx의 기본값
    let mainPosY = 0;      // Scene.tsx Y 위치
    let testPosY = -2;     // test/Scene.tsx Y 위치 (기본값)
    let modulePosY = 0;    // module/Scene.tsx Y 위치 (기본값)

    // 브레이크포인트에 따른 스케일 및 위치 조정
    // 모바일 (< 640px)
    if (width < 640) {
      mainScale = 0.6;   // 15/25 = 0.6
      testScale = 5;     // 50/100 * 10 = 5
      moduleScale = 0.9; // 모바일용 (0.6 * 1.5)
      mainPosY = 0.6;    // 작아진만큼 위로 올림
      testPosY = -1.2;   // 작아진만큼 위로 올림
      modulePosY = 0;    // module은 위치 조정 안함 (OrbitControls 사용 중)
    } 
    // 태블릿 (640px ~ 1024px)
    else if (width < 1024) {
      mainScale = 0.8;   // 20/25 = 0.8
      testScale = 7.5;   // 75/100 * 10 = 7.5
      moduleScale = 1.2; // 태블릿용 (0.8 * 1.5)
      mainPosY = 0.3;    // 작아진만큼 위로 올림
      testPosY = -1.6;   // 작아진만큼 위로 올림
      modulePosY = 0;    // module은 위치 조정 안함
    }
    // 데스크톱 (>= 1024px)
    else {
      mainScale = 1;     // 25/25 = 1
      testScale = 10;    // 100/100 * 10 = 10
      moduleScale = 1.5; // 데스크톱용 (1.0 * 1.5)
      mainPosY = 0;      // 기본 위치
      testPosY = -2;     // 기본 위치
      modulePosY = 0;    // 기본 위치
    }

    return {
      scale: {
        main: mainScale,
        test: testScale,
        module: moduleScale,
      },
      position: {
        main: [0, mainPosY, 0],
        test: [0, testPosY, 0],
        module: [0, modulePosY, 0],
      },
    };
  };

  const { scale, position } = calculateResponsiveValues();

  return {
    width: screenSize.width,
    scale,
    position,
  };
}

