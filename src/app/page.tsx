'use client'

import { useState } from 'react'
import Scene from '@/components/light/Scene'
import Scene2 from '@/components/color/Scene'
import Scene3 from '@/components/module/Scene'

export default function Home() {
  const [mode, setMode] = useState<'room' | 'object' | 'module'>('room')
  const [displayMode, setDisplayMode] = useState<'room' | 'object' | 'module'>('room')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isNightMode, setIsNightMode] = useState(false)

  const handleModeChange = (newMode: 'room' | 'object' | 'module') => {
    if (newMode === mode) return
    
    // 1. 슬라이딩 애니메이션 먼저 시작
    setMode(newMode)
    
    // 2. 슬라이딩 애니메이션 완료 후 페이드 아웃 시작
    setTimeout(() => {
      setIsTransitioning(true)
      
      // 3. 페이드 아웃 완료 후 씬 교체
      setTimeout(() => {
        setDisplayMode(newMode)
        
        setTimeout(() => {
          setIsTransitioning(false)
        }, 500)
      }, 300)
    }, 300)
  }

  return (
    <>
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
        <div className="relative w-48 h-8 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
          {/* 슬라이딩 배경 */}
          <div
            className={`absolute top-0 bottom-0 w-1/3 bg-white/30 transition-all duration-300 rounded-lg ${
              mode === 'room' ? 'left-0' : mode === 'object' ? 'left-1/3' : 'left-2/3'
            }`}
          />
          
          {/* 텍스트 레이블들 */}
          <div className="relative w-full h-full flex text-xs">
            <button
              onClick={() => handleModeChange('room')}
              className={`flex-1 flex items-center justify-center font-medium transition-all duration-300 ${
                mode === 'room' ? 'text-black opacity-100' : 'text-white opacity-60'
              }`}
            >
              ROOM
            </button>
            <button
              onClick={() => handleModeChange('object')}
              className={`flex-1 flex items-center justify-center font-medium transition-all duration-300 ${
                mode === 'object' ? 'text-black opacity-100' : 'text-white opacity-60'
              }`}
            >
              OBJECT
            </button>
            <button
              onClick={() => handleModeChange('module')}
              className={`flex-1 flex items-center justify-center font-medium transition-all duration-300 ${
                mode === 'module' ? 'text-black opacity-100' : 'text-white opacity-60'
              }`}
            >
              MODULE
            </button>
          </div>
        </div>
      </div>
      
      <>
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            displayMode === 'room' && !isTransitioning ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <Scene 
            isNightMode={isNightMode} 
            setIsNightMode={setIsNightMode}
            isActive={displayMode === 'room' && !isTransitioning}
          />
        </div>
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            displayMode === 'object' && !isTransitioning ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <Scene2 isActive={displayMode === 'object' && !isTransitioning} />
        </div>
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            displayMode === 'module' && !isTransitioning ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <Scene3 isActive={displayMode === 'module' && !isTransitioning} />
        </div>
      </>
    </>
  )
}
