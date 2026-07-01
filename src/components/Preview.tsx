import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { HelpCircle, ZoomIn, ZoomOut, Maximize2, Minimize2, Plus, Eye, EyeOff } from 'lucide-react';
import { detectNodeShapeAndLabel, detectConnectionStyle } from '../utils/mermaidParser';
import { useZoomPan } from '../hooks/useZoomPan';
import { useDragConnection } from '../hooks/useDragConnection';
import { ExportDropdown } from './Preview/ExportDropdown';
import { DragConnectionLine } from './Preview/DragConnectionLine';
import { NewNodePlaceholder } from './Preview/NewNodePlaceholder';
import { NodeOverlay } from './Preview/NodeOverlay';
import { EdgeOverlay } from './Preview/EdgeOverlay';
import {
  extractNodeId,
  extractEdgeIds,
  getElementMidpoint,
  getPathMidpoint,
  findClosestElement,
} from '../utils/svgParser';
import { exportSVG, processPNGAction } from '../utils/exportUtils';
import { PRESETS } from '../constants/presets';

interface PreviewProps {
  code: string;
  onError: (error: string | null) => void;
  onEditNode: (node: OverlayNode | null) => void;
  onDeleteNode?: (nodeId: string) => void;
  onAddNodeClick: () => void;
  onNodesParsed?: (nodes: OverlayNode[]) => void;
  onDeleteEdge?: (sourceId: string, targetId: string) => void;
  onEdgeLabelChange?: (sourceId: string, targetId: string, newLabel: string) => void;
  onEdgeStyleChange?: (sourceId: string, targetId: string, newStyle: string, currentLabel: string) => void;
  onConnectNodes?: (sourceId: string, targetId: string) => void;
  onConnectNewNode?: (sourceId: string) => void;
  theme?: 'light' | 'dark';
  activeNode?: OverlayNode | null;
  onNodeLabelChange?: (nodeId: string, newLabel: string) => void;
  onNodeShapeChange?: (nodeId: string, newShapeId: string) => void;
  newNodeIdToEdit?: string | null;
  onClearNewNodeIdToEdit?: () => void;
}

export interface OverlayNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shapeId: string;
}

export interface OverlayEdge {
  sourceId: string;
  targetId: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hasLabel: boolean;
  style: string;
}

function addHoverTargetsToSvg(svgHtml: string): string {
  if (typeof window === 'undefined') return svgHtml;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgHtml, 'image/svg+xml');
    const links = doc.querySelectorAll('.flowchart-link');
    links.forEach((link) => {
      const hoverTarget = link.cloneNode(true) as SVGElement;
      hoverTarget.classList.remove('flowchart-link');
      hoverTarget.classList.add('flowchart-link-hover-target');
      
      if (hoverTarget.id) {
        hoverTarget.id = `${hoverTarget.id}-hover-target`;
      }
      
      hoverTarget.setAttribute('stroke', 'transparent');
      hoverTarget.setAttribute('stroke-width', '16');
      hoverTarget.setAttribute('fill', 'none');
      hoverTarget.setAttribute(
        'style',
        'cursor: pointer; pointer-events: stroke; fill: none; stroke: transparent !important; stroke-width: 16px !important;'
      );
      
      link.parentNode?.insertBefore(hoverTarget, link);
    });
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  } catch (err) {
    console.error('Failed to inject hover targets to SVG:', err);
    return svgHtml;
  }
}

export function Preview({
  code,
  onError,
  onEditNode,
  onDeleteNode,
  onAddNodeClick,
  onNodesParsed,
  onDeleteEdge,
  onEdgeLabelChange,
  onEdgeStyleChange,
  onConnectNodes,
  onConnectNewNode,
  theme = 'dark',
  activeNode = null,
  onNodeLabelChange,
  onNodeShapeChange,
  newNodeIdToEdit,
  onClearNewNodeIdToEdit,
}: PreviewProps) {
  const [svgContent, setSvgContent] = useState<string>('');
  const [overlayNodes, setOverlayNodes] = useState<OverlayNode[]>([]);
  const [overlayEdges, setOverlayEdges] = useState<OverlayEdge[]>([]);

  const [editingNodeIdInline, setEditingNodeIdInline] = useState<string | null>(null);
  const [prevActiveNodeId, setPrevActiveNodeId] = useState<string | null>(null);

  // Edge selection & inline editing state
  const [activeEdge, setActiveEdge] = useState<OverlayEdge | null>(null);
  const [editingEdgeInline, setEditingEdgeInline] = useState<string | null>(null);
  // Used to detect double-click on edges (two clicks within 300ms on same edge key)
  const lastEdgeClickRef = useRef<{ key: string; time: number } | null>(null);

  // Stable edge click handler — called from EdgeOverlay's inner hit area (label/midpoint)
  // AND from handleCanvasClick for SVG path line clicks.
  const handleEdgeClick = useCallback((edge: OverlayEdge) => {
    const edgeKey = `${edge.sourceId}->${edge.targetId}`;
    const now = Date.now();
    const last = lastEdgeClickRef.current;
    if (last && last.key === edgeKey && now - last.time < 300) {
      // Two rapid clicks = double-click: enter inline edit
      lastEdgeClickRef.current = null;
      setActiveEdge(edge);
      setEditingEdgeInline(edgeKey);
    } else {
      lastEdgeClickRef.current = { key: edgeKey, time: now };
      setActiveEdge(edge);
      setEditingEdgeInline(null);
    }
    onEditNode(null);
    setEditingNodeIdInline(null);
  }, [onEditNode]);

  const handleEdgeDoubleClick = useCallback((edge: OverlayEdge) => {
    const edgeKey = `${edge.sourceId}->${edge.targetId}`;
    lastEdgeClickRef.current = null;
    setActiveEdge(edge);
    setEditingEdgeInline(edgeKey);
    onEditNode(null);
    setEditingNodeIdInline(null);
  }, [onEditNode]);

  const activeId = activeNode?.id ?? null;
  if (activeId !== prevActiveNodeId) {
    setPrevActiveNodeId(activeId);
    if (activeId && activeId === newNodeIdToEdit) {
      setEditingNodeIdInline(activeId);
    } else {
      setEditingNodeIdInline(null);
    }
  }

  useEffect(() => {
    if (activeNode) {
      setActiveEdge(null);
      setEditingEdgeInline(null);
    }
  }, [activeNode]);

  useEffect(() => {
    if (activeId && activeId === newNodeIdToEdit) {
      onClearNewNodeIdToEdit?.();
    }
  }, [activeId, newNodeIdToEdit, onClearNewNodeIdToEdit]);

  const [hoveredEdgeKey, setHoveredEdgeKey] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  const [showGuides, setShowGuides] = useState(true);

  const handleMouseEnterEdge = useCallback((key: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredEdgeKey(key);
  }, []);

  const handleMouseLeaveEdge = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredEdgeKey(null);
    }, 800);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseOver = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    const linkEl = target.closest('.flowchart-link') || target.closest('.flowchart-link-hover-target');
    if (linkEl) {
      const cleanId = linkEl.id.replace(/-hover-target$/, '');
      const ids = extractEdgeIds(cleanId, overlayNodes);
      if (ids) {
        handleMouseEnterEdge(`${ids.sourceId}->${ids.targetId}`);
      }
    }
  };

  const handleMouseOut = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    const linkEl = target.closest('.flowchart-link') || target.closest('.flowchart-link-hover-target');
    if (linkEl) {
      handleMouseLeaveEdge();
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedPNG, setCopiedPNG] = useState(false);

  // Zoom & Pan custom hook
  const {
    zoom,
    pan,
    setPan,
    setZoom,
    isDragging,
    hasDraggedRef,
    zoomIn,
    zoomOut,
    resetZoomPan,
    canvasHandlers,
  } = useZoomPan(1, { x: 40, y: 60 });

  // Listen to wheel events on containerRef to perform scale-anchored zooming
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      // Disallow scroll zooming when interacting with buttons or overlays
      if (target.closest('button') || target.closest('.overlay-interactive')) return;

      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = 1.05;
      const nextZoom = e.deltaY < 0
        ? Math.min(2.5, zoom * zoomFactor)
        : Math.max(0.4, zoom / zoomFactor);

      const newPanX = mouseX - (mouseX - pan.x) * (nextZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (nextZoom / zoom);

      setZoom(nextZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [zoom, pan, setZoom, setPan]);

  // Drag connections custom hook
  const {
    dragLinkSource,
    dragLinkCurrent,
    dragLinkTarget,
    handleSocketPointerDown,
    handleSocketPointerMove,
    handleSocketPointerUp,
  } = useDragConnection({
    overlayNodes,
    zoom,
    code,
    viewportRef,
    onConnectNodes,
    onConnectNewNode,
  });

  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const svg = viewportRef.current?.querySelector('svg');
    if (!svg) return;

    const viewBoxAttr = svg.getAttribute('viewBox');
    if (!viewBoxAttr) return;

    const parts = viewBoxAttr.split(/[\s,]+/);
    if (parts.length !== 4) return;
    const svgWidth = parseFloat(parts[2]);
    const svgHeight = parseFloat(parts[3]);
    if (!svgWidth || !svgHeight) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const padding = 32;
    const availableWidth = containerWidth - padding * 2;
    const availableHeight = containerHeight - padding * 2;

    const zoomX = availableWidth / svgWidth;
    const zoomY = availableHeight / svgHeight;
    const fitZoom = Math.max(0.4, Math.min(2.5, Math.min(zoomX, zoomY)));

    const panX = (containerWidth - svgWidth * fitZoom) / 2;
    const panY = (containerHeight - svgHeight * fitZoom) / 2;

    setZoom(fitZoom);
    setPan({ x: panX, y: panY });
  }, [setZoom, setPan]);

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const isLight = theme === 'light';

  const handleExportSVG = () => {
    const svg = viewportRef.current?.querySelector('svg');
    if (svg) exportSVG(svg, 'diagram.svg', isLight);
  };

  const handleDownloadPNG = () => {
    const svg = viewportRef.current?.querySelector('svg');
    if (svg) processPNGAction(svg, 'download', isLight);
  };

  const handleCopyPNG = () => {
    const svg = viewportRef.current?.querySelector('svg');
    if (svg) {
      processPNGAction(
        svg,
        'copy',
        isLight,
        () => {
          setCopiedPNG(true);
          setTimeout(() => setCopiedPNG(false), 2000);
        }
      );
    }
  };

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'light' ? 'default' : 'dark',
      securityLevel: 'loose',
      themeVariables: theme === 'light' ? {
        background: 'transparent',
        primaryColor: '#f1f5f9', // slate-100
        primaryTextColor: '#0f172a', // slate-900
        primaryBorderColor: '#cbd5e1', // slate-300
        lineColor: '#4f46e5', // indigo-600
        secondaryColor: '#f8fafc', // slate-50
        tertiaryColor: '#f8fafc',
      } : {
        background: 'transparent',
        primaryColor: '#1e293b',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#475569',
        lineColor: '#6366f1',
        secondaryColor: '#334155',
        tertiaryColor: '#0f172a',
      },
      flowchart: {
        htmlLabels: false,
      },
    });
  }, [theme]);

  const calculateOverlayPositions = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const svgNode = viewport.querySelector('svg');
    if (!svgNode) return;

    const activeRenderId = svgNode.id;
    const viewportRect = viewport.getBoundingClientRect();
    const nodeElements = viewport.querySelectorAll('.node');
    const nodesData: OverlayNode[] = [];

    // 1. Process Nodes
    nodeElements.forEach((nodeEl) => {
      const rect = nodeEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const w = rect.width / zoom;
      const h = rect.height / zoom;
      const x = (rect.left - viewportRect.left) / zoom;
      const y = (rect.top - viewportRect.top) / zoom;

      const nodeId = extractNodeId(nodeEl, activeRenderId);
      const detected = detectNodeShapeAndLabel(code, nodeId);
      const shapeId = detected ? detected.shapeId : 'rectangle';

      nodesData.push({
        id: nodeId,
        label: detected ? detected.label : '',
        x,
        y,
        width: w,
        height: h,
        shapeId,
      });
    });

    setOverlayNodes(nodesData);
    if (onNodesParsed) {
      onNodesParsed(nodesData);
    }

    // 2. Process Edges
    const flowchartLinks = Array.from(viewport.querySelectorAll('.flowchart-link'));
    const labelElements = Array.from(viewport.querySelectorAll('.edgeLabel')).filter(
      (el) => el.textContent?.trim() !== ''
    );
    const edgesData: OverlayEdge[] = [];

    flowchartLinks.forEach((pathEl) => {
      const ids = extractEdgeIds(pathEl.id, nodesData);
      if (!ids) return;
      const { sourceId, targetId } = ids;

      const pathMid = pathEl instanceof SVGPathElement
        ? getPathMidpoint(pathEl)
        : getElementMidpoint(pathEl);
      const closestLabel = findClosestElement(pathMid, labelElements);
      const hasLabel = closestLabel.element !== null && closestLabel.distance < 60;
      const edgeLabel = hasLabel && closestLabel.element ? closestLabel.element.textContent?.trim() || '' : '';

      let x = 0, y = 0, w = 0, h = 0;
      if (hasLabel && closestLabel.element) {
        const rect = closestLabel.element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          w = rect.width / zoom;
          h = rect.height / zoom;
          x = (rect.left - viewportRect.left) / zoom;
          y = (rect.top - viewportRect.top) / zoom;
        }
      } else {
        w = 24;
        h = 24;
        x = (pathMid.x - viewportRect.left) / zoom - w / 2;
        y = (pathMid.y - viewportRect.top) / zoom - h / 2;
      }

      const currentStyle = detectConnectionStyle(code, sourceId, targetId);

      edgesData.push({
        sourceId,
        targetId,
        label: edgeLabel,
        x,
        y,
        width: w,
        height: h,
        hasLabel,
        style: currentStyle,
      });
    });

    setOverlayEdges(edgesData);
  }, [zoom, code, onNodesParsed]);

  // Handle render loop (Runs only on code/theme change)
  useEffect(() => {
    let isMounted = true;
    const renderId = `mermaid-render-${Date.now()}`;

    const renderSvg = async () => {
      if (!code.trim()) {
        setSvgContent('');
        setOverlayNodes([]);
        onError(null);
        return;
      }

      try {
        const { svg } = await mermaid.render(renderId, code);
        if (isMounted) {
          const processedSvg = addHoverTargetsToSvg(svg);
          setSvgContent(processedSvg);
          onError(null);
        }
      } catch (err: unknown) {
        console.error('Mermaid render issue:', err);
        let message = 'Invalid diagram syntax';
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === 'string') {
          message = err;
        } else if (err && typeof err === 'object' && 'str' in err) {
          message = String((err as { str?: string }).str);
        }

        const errorElement = document.getElementById(`d${renderId}`);
        if (errorElement) errorElement.remove();

        if (isMounted) onError(message);
      }
    };

    renderSvg();
    return () => {
      isMounted = false;
    };
  }, [code, theme, onError]);

  // Recalculate overlays on SVG content change or zoom/coordinate shifts
  useEffect(() => {
    if (svgContent) calculateOverlayPositions();
  }, [svgContent, zoom, calculateOverlayPositions]);

  const hasFitInitialRef = useRef(false);
  const lastFitCodeRef = useRef<string>('');

  // Auto-fit diagram to screen on initial render and preset switches
  useEffect(() => {
    if (svgContent && overlayNodes.length > 0) {
      const isPreset = code === PRESETS.workflow || code === PRESETS.decision || code === PRESETS.devops;
      const shouldFit = !hasFitInitialRef.current || (isPreset && code !== lastFitCodeRef.current);
      
      if (shouldFit) {
        const timer = setTimeout(() => {
          fitToScreen();
          hasFitInitialRef.current = true;
          lastFitCodeRef.current = code;
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [svgContent, overlayNodes.length, code, fitToScreen]);


  // Recalculate overlays on resize
  useEffect(() => {
    const handleResize = () => {
      if (svgContent) calculateOverlayPositions();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [svgContent, calculateOverlayPositions]);

  // Resolve an edge from an SVG path or label element click
  const resolveEdgeFromClick = (target: SVGElement): OverlayEdge | null => {
    const edgePathEl = target.closest('.flowchart-link') || target.closest('.flowchart-link-hover-target');
    const edgeLabelEl = target.closest('.edgeLabel');

    if (edgePathEl) {
      const cleanId = (edgePathEl as Element).id.replace(/-hover-target$/, '');
      const ids = extractEdgeIds(cleanId, overlayNodes);
      if (ids) {
        return overlayEdges.find((eg) => eg.sourceId === ids.sourceId && eg.targetId === ids.targetId) ?? null;
      }
    } else if (edgeLabelEl) {
      const labelMid = getElementMidpoint(edgeLabelEl as Element);
      const paths = Array.from(viewportRef.current?.querySelectorAll('.flowchart-link') || []);
      const closestPath = findClosestElement(labelMid, paths);
      if (closestPath.element && closestPath.distance < 60) {
        const ids = extractEdgeIds(closestPath.element.id, overlayNodes);
        if (ids) {
          return overlayEdges.find((eg) => eg.sourceId === ids.sourceId && eg.targetId === ids.targetId) ?? null;
        }
      }
    }
    return null;
  };

  // SVG layer click — handles edge path clicks before the event reaches handleCanvasClick.
  // NodeOverlay hit areas have stopPropagation so they never reach here; this catches
  // clicks on connection lines that fall in open canvas space (not under any node bbox).
  // NOTE: clicks on lines that pass *under* a node overlay bbox are still swallowed by
  // NodeOverlay.handleSingleClick — see backlog.md (Option D) for the follow-up fix.
  const handleSvgLayerClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) return; // ignore click tail of a pan gesture
    const target = e.target as SVGElement;
    const clickedEdge = resolveEdgeFromClick(target);
    if (clickedEdge) {
      handleEdgeClick(clickedEdge);
      e.stopPropagation(); // prevent handleCanvasClick from firing a second time
    }
    // Non-edge SVG clicks (e.g. empty SVG background) bubble up to handleCanvasClick.
  };

  // Click handler for the canvas container — handles node clicks and canvas deselection.
  // Edge clicks that hit an SVG path in open space are caught by handleSvgLayerClick first.
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) return;

    const target = e.target as SVGElement;

    const nodeEl = target.closest('.node');
    if (nodeEl) {
      const svgNode = viewportRef.current?.querySelector('svg');
      const nodeId = extractNodeId(nodeEl, svgNode?.id || '');
      const node = overlayNodes.find((n) => n.id === nodeId);
      if (node) {
        onEditNode(node);
        setActiveEdge(null);
        setEditingEdgeInline(null);
        e.stopPropagation();
        return;
      }
    }

    // Clicked empty canvas space — deselect everything
    onEditNode(null);
    setEditingNodeIdInline(null);
    setActiveEdge(null);
    setEditingEdgeInline(null);
  };

  const hasContent = svgContent && overlayNodes.length > 0;

  return (
    <div className={`flex flex-col h-full border rounded-2xl overflow-hidden shadow-2xl relative select-none transition-all duration-300 ${
      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      {/* Control Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b backdrop-blur-md z-10 transition-colors duration-300 ${
        isLight ? 'bg-slate-50/60 border-slate-200/80' : 'bg-slate-950/60 border-slate-800/80'
      }`}>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-semibold transition-colors duration-300 ${
            isLight ? 'text-slate-700' : 'text-slate-300'
          }`}>Diagram Preview</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono transition-colors duration-300 ${
            isLight ? 'bg-slate-200/60 text-slate-600' : 'bg-slate-800 text-slate-400'
          }`}>
            {overlayNodes.length} nodes detected
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {svgContent && (
            <ExportDropdown
              copiedShare={copiedShare}
              onCopyShare={handleCopyShareLink}
              onExportSVG={handleExportSVG}
              onDownloadPNG={handleDownloadPNG}
              onCopyPNG={handleCopyPNG}
              copiedPNG={copiedPNG}
              theme={theme}
            />
          )}
        </div>
      </div>

      {/* Canvas Container */}
      <div
        id="canvas-container"
        ref={containerRef}
        {...canvasHandlers}
        onClick={handleCanvasClick}
        className={`flex-1 overflow-hidden bg-grid-pattern relative transition-all duration-300 ${
          isLight ? 'bg-slate-50' : 'bg-slate-950'
        } ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {overlayNodes.length === 0 && !svgContent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm space-y-2">
            <HelpCircle className="w-8 h-8 opacity-45" />
            <span>Type flowchart code on the left to render</span>
          </div>
        )}

        {/* Zoom & Pan Viewport Container */}
        <div
          ref={viewportRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* LAYER A: SVG layer — owns edge-path click resolution via handleSvgLayerClick */}
          {svgContent && (
            <div
              className="absolute inset-0 pointer-events-auto select-none"
              onMouseOver={handleMouseOver}
              onMouseOut={handleMouseOut}
              onClick={handleSvgLayerClick}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          )}

          {/* LAYER B: HTML Interaction overlays */}
          {svgContent && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {overlayNodes.map((node) => (
                <NodeOverlay
                  key={node.id}
                  node={node}
                  dragLinkTarget={dragLinkTarget}
                  onEditNode={onEditNode}
                  onDeleteNode={onDeleteNode}
                  onSocketPointerDown={handleSocketPointerDown}
                  onSocketPointerMove={handleSocketPointerMove}
                  onSocketPointerUp={handleSocketPointerUp}
                  isLight={isLight}
                  activeNode={activeNode}
                  editingNodeIdInline={editingNodeIdInline}
                  setEditingNodeIdInline={setEditingNodeIdInline}
                  onNodeLabelChange={onNodeLabelChange}
                  onNodeShapeChange={onNodeShapeChange}
                  zoom={zoom}
                />
              ))}

              {dragLinkSource && dragLinkCurrent && dragLinkTarget === '__new_node__' && (
                <NewNodePlaceholder
                  x={dragLinkCurrent.x}
                  y={dragLinkCurrent.y}
                  isTargeted={true}
                  isLight={isLight}
                />
              )}

              {overlayEdges.map((edge, idx) => (
                <EdgeOverlay
                  key={`edge-${edge.sourceId}-${edge.targetId}-${idx}`}
                  edge={edge}
                  isHovered={hoveredEdgeKey === `${edge.sourceId}->${edge.targetId}`}
                  onMouseEnterEdge={handleMouseEnterEdge}
                  onMouseLeaveEdge={handleMouseLeaveEdge}
                  onDeleteEdge={onDeleteEdge}
                  showGuides={showGuides}
                  isLight={isLight}
                  activeEdge={activeEdge}
                  editingEdgeInline={editingEdgeInline}
                  setEditingEdgeInline={setEditingEdgeInline}
                  onEdgeClick={handleEdgeClick}
                  onEdgeDoubleClick={handleEdgeDoubleClick}
                  onEdgeLabelChange={onEdgeLabelChange}
                  onEdgeStyleChange={onEdgeStyleChange}
                  zoom={zoom}
                />
              ))}

              {dragLinkSource && dragLinkCurrent && (
                <DragConnectionLine
                  sourceNode={overlayNodes.find((n) => n.id === dragLinkSource)!}
                  dragLinkCurrent={dragLinkCurrent}
                  dragLinkTarget={dragLinkTarget}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Node Utility Control */}
      <div className={`absolute bottom-6 left-6 flex items-center p-1 border rounded-xl shadow-2xl backdrop-blur z-30 transition-colors duration-300 ${
        isLight ? 'bg-white/90 border-slate-200/80' : 'bg-slate-900/90 border-slate-800/80'
      }`}>
        <button
          onClick={onAddNodeClick}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer pointer-events-auto active:scale-95 text-xs font-semibold ${
            isLight
              ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}
          title="Add Standalone Node"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          <span>Add Node</span>
        </button>
      </div>

      {/* Floating Zoom & Pan Controls */}
      {hasContent && (
        <div className={`absolute bottom-6 right-6 flex items-center space-x-1 p-1 border rounded-xl shadow-2xl backdrop-blur z-30 transition-colors duration-300 ${
          isLight ? 'bg-white/90 border-slate-200/80' : 'bg-slate-900/90 border-slate-800/80'
        }`}>
          <button
            onClick={() => setShowGuides(!showGuides)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={showGuides ? "Disable Sonar Ping Guides" : "Enable Sonar Ping Guides"}
          >
            {showGuides ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <div className={`w-px h-4 mx-1 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
          <button
            onClick={zoomOut}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className={`text-[10px] font-bold w-12 text-center select-none font-mono ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className={`w-px h-4 mx-1 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
          <button
            onClick={resetZoomPan}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Reset Zoom & Recenter (100%)"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={fitToScreen}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Fit Diagram to Preview"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
