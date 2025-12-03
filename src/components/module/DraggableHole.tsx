"use client";

import { useState, useRef, useEffect } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { Model } from "./Model";

const HOLE_RADIUS = 0.12;
const X_MIN = -1.4;  // 모델 중심 -0.4 기준으로 좌우 0.6 범위
const X_MAX = 0;
const COLLISION_DISTANCE = HOLE_RADIUS * 2;

export interface Hole {
  id: number;
  x: number;
}

interface Props {
  hole: Hole;
  allHoles: Hole[];
  onUpdatePosition: (id: number, x: number) => void;
  onDragStateChange?: (isDragging: boolean) => void;
}

export function DraggableHole({ hole, allHoles, onUpdatePosition, onDragStateChange }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const initialX = useRef(hole.x);

  // 전역 pointerup 이벤트 감지 (드래그 중 hole 밖에서 놓는 경우 대응)
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onDragStateChange?.(false);
      }
    };

    if (isDragging) {
      window.addEventListener('pointerup', handleGlobalPointerUp);
      return () => {
        window.removeEventListener('pointerup', handleGlobalPointerUp);
      };
    }
  }, [isDragging, onDragStateChange]);

  const checkCollision = (targetX: number): boolean => {
    return allHoles.some(other => {
      if (other.id === hole.id) return false;
      return Math.abs(targetX - other.x) < COLLISION_DISTANCE;
    });
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    onDragStateChange?.(true);
    dragStartX.current = e.point.x;
    initialX.current = hole.x;
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    e.stopPropagation();

    const deltaX = e.point.x - dragStartX.current;
    let newX = initialX.current + deltaX;

    // X축 범위 제한
    newX = Math.max(X_MIN, Math.min(X_MAX, newX));

    // 충돌 체크
    if (!checkCollision(newX)) {
      onUpdatePosition(hole.id, newX);
    } else {
      // 충돌이 발생한 경우, 충돌 지점까지만 이동
      const movingRight = newX > hole.x;
      const otherHoles = allHoles.filter(h => h.id !== hole.id);
      
      if (movingRight) {
        // 오른쪽으로 이동 중 - 가장 가까운 오른쪽 hole 찾기
        const rightHoles = otherHoles.filter(h => h.x > hole.x);
        if (rightHoles.length > 0) {
          const nearestRight = Math.min(...rightHoles.map(h => h.x));
          const maxX = nearestRight - COLLISION_DISTANCE;
          if (newX < maxX) {
            onUpdatePosition(hole.id, newX);
          } else {
            onUpdatePosition(hole.id, maxX);
          }
        }
      } else {
        // 왼쪽으로 이동 중 - 가장 가까운 왼쪽 hole 찾기
        const leftHoles = otherHoles.filter(h => h.x < hole.x);
        if (leftHoles.length > 0) {
          const nearestLeft = Math.max(...leftHoles.map(h => h.x));
          const minX = nearestLeft + COLLISION_DISTANCE;
          if (newX > minX) {
            onUpdatePosition(hole.id, newX);
          } else {
            onUpdatePosition(hole.id, minX);
          }
        }
      }
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(false);
    onDragStateChange?.(false);
  };

  return (
    <group
      position={[hole.x, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'default';
      }}
      onPointerMissed={() => {
        setIsDragging(false);
        onDragStateChange?.(false);
      }}
    >
      <Model modelType="Hole" rotation={[0, 0, 0]} scale={10} />
    </group>
  );
}

