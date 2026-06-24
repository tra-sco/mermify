import { memo } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { OverlayEdge } from '../Preview';

interface EdgeOverlayProps {
  edge: OverlayEdge;
  isHovered: boolean;
  onMouseEnterEdge: (key: string) => void;
  onMouseLeaveEdge: () => void;
  onEditEdge: (edge: OverlayEdge) => void;
  onDeleteEdge?: (sourceId: string, targetId: string) => void;
  showGuides?: boolean;
  isLight?: boolean;
}

/**
 * Interactive HTML overlay aligned over a flowchart connector link (or its label),
 * allowing users to edit style and label properties.
 */
export const EdgeOverlay = memo(function EdgeOverlay({
  edge,
  isHovered,
  onMouseEnterEdge,
  onMouseLeaveEdge,
  onEditEdge,
  onDeleteEdge,
  showGuides = false,
  isLight = false,
}: EdgeOverlayProps) {
  const edgeKey = `${edge.sourceId}->${edge.targetId}`;

  return (
    <div
      data-testid={`edge-overlay-${edge.sourceId}-${edge.targetId}`}
      style={{
        position: 'absolute',
        left: `${edge.x}px`,
        top: `${edge.y}px`,
        width: `${edge.width}px`,
        height: `${edge.height}px`,
      }}
      className="group pointer-events-auto flex items-center justify-center"
      onMouseEnter={() => onMouseEnterEdge(edgeKey)}
      onMouseLeave={onMouseLeaveEdge}
    >
      {edge.hasLabel ? (
        <div
          className={`absolute inset-0 border rounded transition-all duration-200 ${
            isHovered
              ? isLight
                ? 'border-indigo-500/50 bg-white shadow-[0_0_8px_rgba(99,102,241,0.1)]'
                : 'border-indigo-500/50 bg-slate-900/60 shadow-[0_0_8px_rgba(99,102,241,0.15)]'
              : showGuides === true
              ? isLight
                ? 'border-slate-200 bg-slate-100/30'
                : 'border-slate-800 bg-slate-950/20'
              : 'border-transparent'
          }`}
        />
      ) : (
        <div
          className={`w-5 h-5 rounded-full border flex items-center justify-center shadow-lg transition-all duration-200 ${
            isLight ? 'bg-white' : 'bg-slate-900'
          } ${
            showGuides === true
              ? isHovered
                ? 'border-indigo-500/80 text-indigo-400 scale-110 shadow-[0_0_8px_rgba(99,102,241,0.35)] opacity-100'
                : isLight
                ? 'border-slate-200 text-slate-400 opacity-60'
                : 'border-slate-800 text-slate-500 opacity-60'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          {isHovered && showGuides === true && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400/30 animate-ping pointer-events-none" />
          )}
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              isHovered ? 'bg-indigo-400' : 'bg-slate-400'
            }`}
          />
        </div>
      )}

      <div
        className={`overlay-interactive pointer-events-auto z-30 transition-all duration-200 flex items-center justify-center space-x-1 ${
          isHovered
            ? 'opacity-100 translate-y-0 visible'
            : 'opacity-0 translate-y-1 invisible pointer-events-none'
        }`}
      >
        <button
          data-testid={`edge-edit-btn-${edge.sourceId}-${edge.targetId}`}
          onClick={() => onEditEdge(edge)}
          className="flex items-center justify-center p-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title={`Edit Link Properties (${edge.sourceId} ➔ ${edge.targetId})`}
        >
          <Edit2 className="w-2.5 h-2.5" />
        </button>
        {onDeleteEdge && (
          <button
            data-testid={`edge-delete-btn-${edge.sourceId}-${edge.targetId}`}
            onClick={() => onDeleteEdge(edge.sourceId, edge.targetId)}
            className={`flex items-center justify-center p-1 rounded-md border shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-rose-600 text-rose-500 hover:text-white border-slate-200'
                : 'bg-slate-900/90 hover:bg-rose-600/90 text-rose-400 hover:text-white border-slate-700/50'
            }`}
            title={`Delete Link (${edge.sourceId} ➔ ${edge.targetId})`}
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
});
