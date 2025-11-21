'use client'

import { useState } from 'react'
import Scene from '@/components/Scene'
import Scene2 from '@/components/test/Scene'

export default function Home() {
  const [mode, setMode] = useState<'room' | 'object'>('room')
  const [displayMode, setDisplayMode] = useState<'room' | 'object'>('room')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleToggle = () => {
    const newMode = mode === 'room' ? 'object' : 'room'
    
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
        <button
          onClick={handleToggle}
          className="relative w-45 h-14 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden"
        >
          {/* 슬라이딩 배경 */}
          <div
            className={`absolute top-0 bottom-0 w-1/2 bg-white/30 transition-all duration-300 rounded-lg ${
              mode === 'room' ? 'left-0' : 'left-1/2'
            }`}
          />
          
          {/* 텍스트 레이블들 */}
          <div className="relative w-full h-full flex">
            <div
              className={`flex-1 flex items-center justify-center font-medium transition-all duration-300 ${
                displayMode === 'object' ? 'text-black' : 'text-white'
              } ${
                mode === 'room' ? 'opacity-100' : 'opacity-60'
              }`}
            >
              ROOM
            </div>
            <div
              className={`flex-1 flex items-center justify-center font-medium transition-all duration-300 ${
                displayMode === 'object' ? 'text-black' : 'text-white'
              } ${
                mode === 'object' ? 'opacity-100' : 'opacity-60'
              }`}
            >
              OBJECT
            </div>
          </div>
        </button>
      </div>
      
      <div
        key={displayMode}
        className={`transition-opacity duration-300 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {displayMode === 'room' ? <Scene /> : <Scene2 />}
      </div>
    </>
  )
}
