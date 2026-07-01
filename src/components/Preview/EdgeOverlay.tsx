import { memo, useState, useEffect, useRef } from 'react';
import { Trash2, Spline } from 'lucide-react';
import type { OverlayEdge } from '../Preview';

const EDGE_STYLES = [
  { id: '-->', name: 'Solid Arrow', symbol: '──>' },
  { id: '---', name: 'Solid Line', symbol: '───' },
  { id: '-.->', name: 'Dotted Arrow', symbol: '┈─>' },
  { id: '==>', name: 'Thick Arrow', symbol: '━━>' },
];

interface EdgeOverlayProps {
  edge: OverlayEdge;
  isHovered: boolean;
  onMouseEnterEdge: (key: string) => void;
  onMouseLeaveEdge: () => void;
  onDeleteEdge?: (sourceId: string, targetId: string) => void;
  showGuides?: boolean;
  isLight?: boolean;
  // Selection & editing state (controlled by Preview)
  activeEdge?: OverlayEdge | null;
  editingEdgeInline?: string | null;
  setEditingEdgeInline: (key: string | null) => void;
  // Callbacks for direct clicks on label / midpoint area
  onEdgeClick: (edge: OverlayEdge) => void;
  onEdgeDoubleClick: (edge: OverlayEdge) => void;
  // Data mutations
  onEdgeLabelChange?: (sourceId: string, targetId: string, newLabel: string) => void;
  onEdgeStyleChange?: (sourceId: string, targetId: string, newStyle: string, currentLabel: string) => void;
  zoom: number;
}

/**
 * Interactive HTML overlay aligned over a flowchart connector link (or its label).
 *
 * Interaction model:
 *  - Single click  → select edge (command palette appears)
 *  - Double click  → inline label edit
 *  - Canvas click on SVG path is handled by Preview.handleCanvasClick and calls
 *    onEdgeClick / onEdgeDoubleClick here via the same props.
 */
export const EdgeOverlay = memo(function EdgeOverlay({
  edge,
  isHovered,
  onMouseEnterEdge,
  onMouseLeaveEdge,
  onDeleteEdge,
  showGuides = false,
  isLight = false,
  activeEdge = null,
  editingEdgeInline = null,
  setEditingEdgeInline,
  onEdgeClick,
  onEdgeDoubleClick,
  onEdgeLabelChange,
  onEdgeStyleChange,
  zoom,
}: EdgeOverlayProps) {
  const edgeKey = `${edge.sourceId}->${edge.targetId}`;
  const isSelected = activeEdge?.sourceId === edge.sourceId && activeEdge?.targetId === edge.targetId;
  const isEditing = editingEdgeInline === edgeKey;

  const [localLabel, setLocalLabel] = useState(edge.label);
  const [prevEdgeLabel, setPrevEdgeLabel] = useState(edge.label);

  // Keep local label in sync when diagram code changes externally
  if (edge.label !== prevEdgeLabel) {
    setPrevEdgeLabel(edge.label);
    setLocalLabel(edge.label);
  }

  const [showStylePopover, setShowStylePopover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus + select-all when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close style popover when edge loses selection
  useEffect(() => {
    if (!isSelected) {
      setShowStylePopover(false);
    }
  }, [isSelected]);

  const handleCommitLabel = () => {
    if (onEdgeLabelChange) {
      onEdgeLabelChange(edge.sourceId, edge.targetId, localLabel.trim());
    } else {
      setLocalLabel(edge.label); // rollback
    }
    setEditingEdgeInline(null);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommitLabel();
    } else if (e.key === 'Escape') {
      setLocalLabel(edge.label);
      setEditingEdgeInline(null);
    }
  };

  const handleStyleSelect = (styleId: string) => {
    if (onEdgeStyleChange) {
      onEdgeStyleChange(edge.sourceId, edge.targetId, styleId, localLabel.trim());
    }
    setShowStylePopover(false);
  };

  const currentStyleId = edge.style || '-->';

  // The clickable hit area that covers the label box or midpoint dot.
  // This mirrors NodeOverlay's inner click div pattern so that clicks on the
  // HTML overlay surface (which sit on top of the SVG edgeLabel) are handled
  // directly instead of bubbling to handleCanvasClick (which can only resolve
  // edges from SVG elements).
  const clickArea = !isEditing && (
    <div
      data-testid={`edge-overlay-click-${edge.sourceId}-${edge.targetId}`}
      onClick={(e) => {
        e.stopPropagation();
        onEdgeClick(edge);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdgeDoubleClick(edge);
      }}
      onMouseEnter={() => onMouseEnterEdge(edgeKey)}
      onMouseLeave={onMouseLeaveEdge}
      className="absolute inset-0 cursor-pointer pointer-events-auto z-10"
      title="Click for options, double-click to rename label"
    />
  );

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
      className="group pointer-events-none flex items-center justify-center"
    >
      {/* Visual indicator: label box or midpoint dot */}
      {edge.hasLabel ? (
        <div
          className={`absolute inset-0 border rounded transition-all duration-200 pointer-events-none ${
            isSelected
              ? isLight
                ? 'border-indigo-500 bg-white shadow-[0_0_10px_rgba(99,102,241,0.25)]'
                : 'border-indigo-500 bg-slate-900/60 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
              : isHovered
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
          className={`w-5 h-5 rounded-full border flex items-center justify-center shadow-lg transition-all duration-200 pointer-events-none ${
            isLight ? 'bg-white' : 'bg-slate-900'
          } ${
            isSelected
              ? 'border-indigo-500 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.35)] opacity-100'
              : showGuides === true
              ? isHovered
                ? 'border-indigo-500/80 text-indigo-400 scale-110 shadow-[0_0_8px_rgba(99,102,241,0.35)] opacity-100'
                : isLight
                ? 'border-slate-200 text-slate-400 opacity-60'
                : 'border-slate-800 text-slate-500 opacity-60'
              : 'opacity-0'
          }`}
        >
          {isHovered && showGuides === true && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400/30 animate-ping pointer-events-none" />
          )}
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors pointer-events-none ${
              isHovered || isSelected ? 'bg-indigo-400' : 'bg-slate-400'
            }`}
          />
        </div>
      )}

      {/* Click / double-click hit area (covers label box or midpoint dot) */}
      {clickArea}

      {/* Inline Label Input (double-click to activate) */}
      {isEditing && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-auto p-0.5">
          <input
            ref={inputRef}
            type="text"
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={handleCommitLabel}
            onKeyDown={handleInputKeyDown}
            placeholder="label..."
            onClick={(e) => e.stopPropagation()}
            className={`w-full h-full text-center font-semibold text-xs rounded-md border-2 shadow-md focus:outline-none transition-all overlay-interactive ${
              isLight
                ? 'bg-white border-indigo-500 text-slate-850 placeholder-slate-400'
                : 'bg-slate-900 border-indigo-400 text-slate-100 placeholder-slate-600'
            }`}
            style={{ minWidth: '100px', fontSize: 'inherit' }}
          />
        </div>
      )}

      {/* Floating Command Palette (visible when selected, not editing) */}
      {isSelected && !isEditing && (
        <div
          style={{
            transform: `translateX(-50%) scale(${1 / zoom})`,
            transformOrigin: 'bottom center',
          }}
          className="absolute bottom-[calc(100%+12px)] left-1/2 flex flex-col items-center pointer-events-auto z-50"
        >
          {/* Palette bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center gap-1 p-1 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 overlay-interactive animate-in fade-in slide-in-from-bottom-2 ${
              isLight
                ? 'bg-white/95 border-slate-200 text-slate-700'
                : 'bg-slate-900/95 border-slate-800 text-slate-200'
            }`}
          >
            {/* Link Style command */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStylePopover(!showStylePopover);
              }}
              className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                showStylePopover
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                  : isLight
                  ? 'hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                  : 'hover:bg-slate-800 hover:text-slate-100 border border-transparent'
              }`}
              title="Change Link Style"
            >
              <Spline className="w-4 h-4" />
              <span>Style</span>
            </button>

            <div className={`w-px h-5 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />

            {/* Delete command */}
            {onDeleteEdge && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteEdge(edge.sourceId, edge.targetId);
                }}
                className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                  isLight
                    ? 'hover:bg-rose-50 hover:text-rose-600'
                    : 'hover:bg-rose-950/40 hover:text-rose-400'
                }`}
                title="Delete Connection"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* Style Selection Sub-Popover */}
          {showStylePopover && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute top-[calc(100%+8px)] flex flex-col w-52 p-2 rounded-xl border shadow-2xl backdrop-blur-md z-[60] overlay-interactive animate-in fade-in slide-in-from-top-2 ${
                isLight
                  ? 'bg-white/95 border-slate-200'
                  : 'bg-slate-900/95 border-slate-800'
              }`}
            >
              <div className={`text-[10px] font-bold tracking-wider uppercase mb-1.5 px-1.5 ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Link Style
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {EDGE_STYLES.map((style) => {
                  const isCurrentStyle = currentStyleId === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStyleSelect(style.id);
                      }}
                      title={style.name}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer h-12 ${
                        isCurrentStyle
                          ? isLight
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                            : 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.25)]'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                          : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:border-slate-700/60 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-mono text-sm mb-0.5 text-slate-400 select-none">
                        {style.symbol}
                      </span>
                      <span className="truncate w-full text-[9px] font-bold text-slate-500 text-center">{style.name}</span>
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
