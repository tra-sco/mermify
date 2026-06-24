import { useState, type RefObject, useCallback, useRef, useEffect } from 'react';

export interface DragConnectionNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseDragConnectionProps {
  overlayNodes: DragConnectionNode[];
  zoom: number;
  code: string;
  viewportRef: RefObject<HTMLDivElement | null>;
  onConnectNodes?: (sourceId: string, targetId: string) => void;
  onConnectNewNode?: (sourceId: string) => void;
}

/**
 * Hook to manage interactive link drafting and creation by dragging connecting lines.
 */
export function useDragConnection({
  overlayNodes,
  zoom,
  code,
  viewportRef,
  onConnectNodes,
  onConnectNewNode,
}: UseDragConnectionProps) {
  const [dragLinkSource, setDragLinkSource] = useState<string | null>(null);
  const [dragLinkCurrent, setDragLinkCurrent] = useState<{ x: number; y: number } | null>(null);
  const [dragLinkTarget, setDragLinkTarget] = useState<string | null>(null);

  const overlayNodesRef = useRef(overlayNodes);
  useEffect(() => {
    overlayNodesRef.current = overlayNodes;
  }, [overlayNodes]);

  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const codeRef = useRef(code);
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const dragLinkSourceRef = useRef(dragLinkSource);
  useEffect(() => {
    dragLinkSourceRef.current = dragLinkSource;
  }, [dragLinkSource]);

  const dragLinkTargetRef = useRef(dragLinkTarget);
  useEffect(() => {
    dragLinkTargetRef.current = dragLinkTarget;
  }, [dragLinkTarget]);

  const handleSocketPointerDown = useCallback((e: React.PointerEvent, sourceId: string) => {
    e.stopPropagation();
    const currentTarget = e.currentTarget as HTMLElement;
    currentTarget.setPointerCapture(e.pointerId);

    const sourceNode = overlayNodesRef.current.find((n) => n.id === sourceId);
    if (!sourceNode) return;

    const startX = sourceNode.x + sourceNode.width / 2;
    const startY = sourceNode.y + sourceNode.height / 2;

    setDragLinkSource(sourceId);
    setDragLinkCurrent({ x: startX, y: startY });
    setDragLinkTarget(null);
  }, []);

  const handleSocketPointerMove = useCallback((e: React.PointerEvent) => {
    const currentSource = dragLinkSourceRef.current;
    if (!currentSource) return;
    e.stopPropagation();

    const viewport = viewportRef.current;
    if (!viewport) return;
    const viewportRect = viewport.getBoundingClientRect();

    const x = (e.clientX - viewportRect.left) / zoomRef.current;
    const y = (e.clientY - viewportRect.top) / zoomRef.current;

    setDragLinkCurrent({ x, y });

    // Detect node boundary collision
    let targetNodeId: string | null = null;
    for (const node of overlayNodesRef.current) {
      if (node.id === currentSource) continue;
      if (
        x >= node.x &&
        x <= node.x + node.width &&
        y >= node.y &&
        y <= node.y + node.height
      ) {
        targetNodeId = node.id;
        break;
      }
    }

    // Fallback: If not over any node, check distance from source node to avoid accidental triggers
    if (!targetNodeId) {
      const sourceNode = overlayNodesRef.current.find((n) => n.id === currentSource);
      if (sourceNode) {
        const sourceCenterX = sourceNode.x + sourceNode.width / 2;
        const sourceCenterY = sourceNode.y + sourceNode.height / 2;
        const distance = Math.hypot(x - sourceCenterX, y - sourceCenterY);
        // Minimum distance to prevent accidental spawn (50px)
        if (distance > 50) {
          targetNodeId = '__new_node__';
        }
      }
    }

    setDragLinkTarget(targetNodeId);
  }, [viewportRef]);

  const handleSocketPointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    const currentTarget = e.currentTarget as HTMLElement;
    try {
      currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if target pointer capture was already released
    }

    const currentSource = dragLinkSourceRef.current;
    const currentTargetNode = dragLinkTargetRef.current;

    if (currentSource && currentTargetNode) {
      if (currentTargetNode === '__new_node__') {
        if (onConnectNewNode) {
          onConnectNewNode(currentSource);
        }
      } else if (onConnectNodes) {
        onConnectNodes(currentSource, currentTargetNode);
      }
    }

    setDragLinkSource(null);
    setDragLinkCurrent(null);
    setDragLinkTarget(null);
  }, [onConnectNodes, onConnectNewNode]);

  return {
    dragLinkSource,
    dragLinkCurrent,
    dragLinkTarget,
    handleSocketPointerDown,
    handleSocketPointerMove,
    handleSocketPointerUp,
  };
}
