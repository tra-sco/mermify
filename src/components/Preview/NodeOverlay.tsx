import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import type { OverlayNode } from '../Preview';

interface NodeOverlayProps {
  node: OverlayNode;
  dragLinkTarget: string | null;
  onEditNode: (node: OverlayNode) => void;
  onDeleteNode?: (nodeId: string) => void;
  onSocketPointerDown: (e: React.PointerEvent, sourceId: string) => void;
  onSocketPointerMove: (e: React.PointerEvent) => void;
  onSocketPointerUp: (e: React.PointerEvent) => void;
  isLight?: boolean;
}

/**
 * Interactive HTML overlay aligned over a rendered SVG node, enabling editing
 * and drag connection features.
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
}: NodeOverlayProps) {
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
      {/* Clickable Area to Edit Node */}
      <div
        data-testid={`node-overlay-click-${node.id}`}
        onClick={() => onEditNode(node)}
        className="absolute inset-0 pointer-events-auto cursor-pointer z-10"
        title="Click to edit node label/shape"
      />

      {/* Node Border Glow (Hover or Target drop destination highlight) */}
      <div
        className={`absolute inset-0 border-2 rounded-lg transition-all duration-200 shadow-lg pointer-events-none ${
          dragLinkTarget === node.id
            ? 'border-emerald-500/90 shadow-[0_0_16px_rgba(16,185,129,0.4)] bg-emerald-950/10'
            : 'border-transparent group-hover:border-indigo-500/80 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.25)]'
        }`}
      />

      {/* Connection Drag Socket */}
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
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover:bg-emerald-300" />
      </div>

      {/* Delete button positioned in top-right corner */}
      {onDeleteNode && (
        <button
          data-testid={`node-delete-btn-${node.id}`}
          onClick={(e) => {
            e.stopPropagation(); // Avoid triggering edit node modal
            onDeleteNode(node.id);
          }}
          className={`overlay-interactive absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full border shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200 cursor-pointer pointer-events-auto z-30 active:scale-90 ${
            isLight
              ? 'bg-white border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 hover:border-rose-900'
          }`}
          title="Delete Node"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
});
