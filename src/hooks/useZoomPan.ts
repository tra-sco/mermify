import { useState, useRef, useCallback, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
}

/**
 * Handles canvas panning via drag interactions, scaling, and reset positioning.
 */
export function useZoomPan(
  initialZoom = 1,
  initialPan: Point = { x: 40, y: 60 }
) {
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState(initialPan);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStart = useRef<Point>({ x: 0, y: 0 });
  const dragStartCoords = useRef<Point>({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  const panRef = useRef(initialPan);
  // Keep ref updated after render using effect to satisfy react-hooks/refs rules
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    const target = e.target as HTMLElement;
    // Disallow panning when interacting with buttons or overlays
    if (target.closest('button') || target.closest('.overlay-interactive')) return;

    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartCoords.current = { x: e.clientX, y: e.clientY };
    dragStart.current = {
      x: e.clientX - panRef.current.x,
      y: e.clientY - panRef.current.y,
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStartCoords.current.x;
    const dy = e.clientY - dragStartCoords.current.y;
    // Only classify as a drag action if movement exceeds jitter threshold
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDraggedRef.current = true;
    }

    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(2.5, z + 0.1));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.4, z - 0.1));
  }, []);

  const resetZoomPan = useCallback(() => {
    setZoom(initialZoom);
    setPan(initialPan);
  }, [initialZoom, initialPan]);

  return {
    zoom,
    pan,
    setPan,
    setZoom,
    isDragging,
    hasDraggedRef,
    zoomIn,
    zoomOut,
    resetZoomPan,
    canvasHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    },
  };
}
