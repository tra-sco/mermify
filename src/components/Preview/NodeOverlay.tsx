import { memo, useState, useEffect, useRef } from 'react';
import { Trash2, Shapes, Plus } from 'lucide-react';
import type { OverlayNode } from '../Preview';
import { NODE_SHAPES } from '../../utils/mermaidParser';

interface NodeOverlayProps {
  node: OverlayNode;
  dragLinkTarget: string | null;
  onEditNode: (node: OverlayNode | null) => void;
  onDeleteNode?: (nodeId: string) => void;
  onSocketPointerDown: (e: React.PointerEvent, sourceId: string) => void;
  onSocketPointerMove: (e: React.PointerEvent) => void;
  onSocketPointerUp: (e: React.PointerEvent) => void;
  isLight?: boolean;
  activeNode?: OverlayNode | null;
  editingNodeIdInline?: string | null;
  setEditingNodeIdInline: (nodeId: string | null) => void;
  onNodeLabelChange?: (nodeId: string, newLabel: string) => void;
  onNodeShapeChange?: (nodeId: string, newShapeId: string) => void;
  zoom: number;
}

function ShapePreview({ id }: { id: string }) {
  switch (id) {
    case 'rectangle':
      return (
        <svg viewBox="0 0 50 30" className="w-10 h-5 text-current">
          <rect x="5" y="8" width="40" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'round':
      return (
        <svg viewBox="0 0 50 30" className="w-10 h-5 text-current">
          <rect x="5" y="8" width="40" height="14" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'stadium':
      return (
        <svg viewBox="0 0 50 30" className="w-10 h-5 text-current">
          <rect x="5" y="8" width="40" height="14" rx="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'subroutine':
      return (
        <svg viewBox="0 0 50 30" className="w-10 h-5 text-current">
          <rect x="5" y="8" width="40" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="9" y1="8" x2="9" y2="22" stroke="currentColor" strokeWidth="1.5" />
          <line x1="41" y1="8" x2="41" y2="22" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'database':
      return (
        <svg viewBox="0 0 50 30" className="w-10 h-5 text-current">
          <ellipse cx="25" cy="8" rx="20" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5,8 V20 C5,24 45,24 45,20 V8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5,14 C5,18 45,18 45,14" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'circle':
      return (
        <svg viewBox="0 0 50 30" className="w-10 h-5 text-current">
          <circle cx="25" cy="15" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'hexagon':
      return (
        <svg viewBox="0 0 50 30" className="w-10 h-5 text-current">
          <polygon points="12,8 38,8 45,15 38,22 12,22 5,15" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'rhombus':
      return (
        <svg viewBox="0 0 50 30" className="w-10 h-5 text-current">
          <polygon points="25,5 45,15 25,25 5,15" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'asymmetric':
      return (
        <svg viewBox="0 0 50 30" className="w-10 h-5 text-current">
          <path d="M5,8 H38 L45,15 L38,22 H5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'parallelogram':
      return (
        <svg viewBox="0 0 50 30" className="w-10 h-5 text-current">
          <polygon points="10,8 45,8 40,22 5,22" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'parallelogram_alt':
      return (
        <svg viewBox="0 0 50 30" className="w-10 h-5 text-current">
          <polygon points="5,8 40,8 45,22 10,22" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Interactive HTML overlay aligned over a rendered SVG node.
 * Enables inline text renaming on double-click, and displays a premium
 * floating action command bar palette above the node on single-click.
 */
export const NodeOverlay = memo(function NodeOverlay({
  node,
  dragLinkTarget,
  onEditNode,
  onDeleteNode,
  onSocketPointerDown,
  onSocketPointerMove,
  onSocketPointerUp,
  isLight = false,
  activeNode = null,
  editingNodeIdInline = null,
  setEditingNodeIdInline,
  onNodeLabelChange,
  onNodeShapeChange,
  zoom,
}: NodeOverlayProps) {
  const isEditing = editingNodeIdInline === node.id;
  const isSelected = activeNode?.id === node.id;

  const [localLabel, setLocalLabel] = useState(node.label);
  const [prevNodeLabel, setPrevNodeLabel] = useState(node.label);

  if (node.label !== prevNodeLabel) {
    setPrevNodeLabel(node.label);
    setLocalLabel(node.label);
  }

  const [showShapePopover, setShowShapePopover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSingleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing) return;
    onEditNode(node);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNodeIdInline(node.id);
  };

  const handleCommitLabel = () => {
    if (onNodeLabelChange && localLabel.trim() !== '') {
      onNodeLabelChange(node.id, localLabel.trim());
    } else {
      setLocalLabel(node.label); // Rollback
    }
    setEditingNodeIdInline(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommitLabel();
    } else if (e.key === 'Escape') {
      setLocalLabel(node.label);
      setEditingNodeIdInline(null);
    }
  };

  const handleShapeSelect = (shapeId: string) => {
    if (onNodeShapeChange) {
      onNodeShapeChange(node.id, shapeId);
    }
    setShowShapePopover(false);
  };

  return (
    <div
      data-testid={`node-overlay-${node.id}`}
      style={{
        position: 'absolute',
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        height: `${node.height}px`,
      }}
      className="group pointer-events-none flex items-center justify-center"
    >
      {/* 1. Normal View / Interactive click & double-click area */}
      {!isEditing && (
        <div
          data-testid={`node-overlay-click-${node.id}`}
          onClick={handleSingleClick}
          onDoubleClick={handleDoubleClick}
          className="absolute inset-0 pointer-events-auto cursor-pointer z-10"
          title="Click once for tools, double-click to rename"
        />
      )}

      {/* 2. Inline Input Field Overlay when editing */}
      {isEditing && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-transparent pointer-events-auto p-1">
          <input
            ref={inputRef}
            type="text"
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={handleCommitLabel}
            onKeyDown={handleKeyDown}
            className={`w-full h-full text-center font-semibold text-xs rounded-md border-2 shadow-md focus:outline-none transition-all ${
              isLight
                ? 'bg-white border-indigo-500 text-slate-850'
                : 'bg-slate-900 border-indigo-400 text-slate-100'
            }`}
            style={{ fontSize: 'inherit' }}
          />
        </div>
      )}

      {/* Node Border Glow (Hover or Target drop destination highlight) */}
      <div
        className={`absolute inset-0 border-2 rounded-lg transition-all duration-200 shadow-lg pointer-events-none ${
          dragLinkTarget === node.id
            ? 'border-emerald-500/90 shadow-[0_0_16px_rgba(16,185,129,0.4)] bg-emerald-950/10'
            : isSelected && !isEditing
            ? 'border-indigo-500 shadow-[0_0_14px_rgba(99,102,241,0.45)]'
            : 'border-transparent group-hover:border-indigo-500/60 group-hover:shadow-[0_0_10px_rgba(99,102,241,0.2)]'
        }`}
      />

      {/* Connection Drag Socket */}
      {!isEditing && (
        <div
          data-testid={`node-drag-socket-${node.id}`}
          onPointerDown={(e) => onSocketPointerDown(e, node.id)}
          onPointerMove={onSocketPointerMove}
          onPointerUp={onSocketPointerUp}
          onMouseDown={(e) => e.stopPropagation()}
          className={`overlay-interactive absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full border-2 hover:border-emerald-500 hover:bg-emerald-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-auto cursor-crosshair z-40 shadow-lg active:scale-110 active:border-emerald-400 ${
            isLight ? 'bg-white border-indigo-600' : 'bg-slate-900 border-indigo-500'
          }`}
          title="Drag to connect node"
        >
          <Plus className="w-2.5 h-2.5 text-indigo-400 group-hover:text-emerald-300 transition-colors" strokeWidth={3} />
        </div>
      )}

      {/* 3. Floating Action Command Bar Palette */}
      {isSelected && !isEditing && (
        <div
          style={{
            transform: `translateX(-50%) scale(${1 / zoom})`,
            transformOrigin: 'bottom center',
          }}
          className={`absolute bottom-[calc(100%+12px)] left-1/2 flex flex-col items-center pointer-events-auto z-50`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center gap-1 p-1 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 overlay-interactive animate-in fade-in slide-in-from-bottom-2 ${
              isLight
                ? 'bg-white/95 border-slate-200 text-slate-700'
                : 'bg-slate-900/95 border-slate-800 text-slate-200'
            }`}
          >
            {/* Shape Trigger Command */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowShapePopover(!showShapePopover);
              }}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                showShapePopover
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                  : isLight
                  ? 'hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                  : 'hover:bg-slate-800 hover:text-slate-100 border border-transparent'
              }`}
              title="Change Node Shape"
            >
              <Shapes className="w-4 h-4" />
              <span>Shape</span>
            </button>

            <div className={`w-px h-5 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />

            {/* Delete Node Command */}
            {onDeleteNode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNode(node.id);
                }}
                className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                  isLight
                    ? 'hover:bg-rose-50 hover:text-rose-600'
                    : 'hover:bg-rose-950/40 hover:text-rose-400'
                }`}
                title="Delete Node"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* 4. Shape Selection Popover Panel */}
          {showShapePopover && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute top-[calc(100%+8px)] flex flex-col w-56 p-2 rounded-xl border shadow-2xl backdrop-blur-md z-[60] overlay-interactive animate-in fade-in slide-in-from-top-2 ${
                isLight
                  ? 'bg-white/95 border-slate-200'
                  : 'bg-slate-900/95 border-slate-800'
              }`}
            >
              <div className={`text-[10px] font-bold tracking-wider uppercase mb-1.5 px-1.5 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Available Shapes
              </div>
              <div className="grid grid-cols-3 gap-1">
                {NODE_SHAPES.map((shape) => {
                  const isCurrentShape = node.shapeId === shape.id;
                  return (
                    <button
                      key={shape.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShapeSelect(shape.id);
                      }}
                      title={shape.name}
                      className={`flex items-center justify-center p-1 rounded-lg border transition-all cursor-pointer h-9 ${
                        isCurrentShape
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                          : isLight
                          ? 'bg-slate-50 border-slate-105 text-slate-500 hover:border-slate-350 hover:text-slate-800'
                          : 'bg-slate-950/40 border-slate-800/60 text-slate-450 hover:border-slate-700/60 hover:text-slate-200'
                      }`}
                    >
                      <ShapePreview id={shape.id} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
