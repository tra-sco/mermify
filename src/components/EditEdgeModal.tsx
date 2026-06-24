import { X, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { useClickOutsideAndEscape } from '../hooks/useClickOutsideAndEscape';

const EDGE_STYLES = [
  { id: '-->', name: 'Solid Arrow', symbol: '──>' },
  { id: '---', name: 'Solid Line', symbol: '───' },
  { id: '-.->', name: 'Dotted Arrow', symbol: '┈─>' },
  { id: '==>', name: 'Thick Arrow', symbol: '━━>' },
];

interface EditEdgeModalProps {
  edge: {
    sourceId: string;
    targetId: string;
    label: string;
    style?: string;
  };
  onLabelChange: (newLabel: string) => void;
  onStyleChange: (newStyleId: string) => void;
  onDelete: () => void;
  onClose: () => void;
  isLight?: boolean;
}

export function EditEdgeModal({
  edge,
  onLabelChange,
  onStyleChange,
  onDelete,
  onClose,
  isLight = false,
}: EditEdgeModalProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverWidth = 320;

  // Handle escape key and click outside to close
  useClickOutsideAndEscape(popoverRef, onClose);

  const styleId = edge.style || '-->';

  return (
    <div
      ref={popoverRef}
      style={{
        width: `${popoverWidth}px`,
      }}
      className={`absolute top-[72px] right-6 z-50 glass-panel shadow-2xl rounded-2xl p-5 border animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-auto ${
        isLight ? 'border-slate-200 bg-white/90 shadow-xl' : 'border-slate-700/80'
      }`}
    >
      {/* Popover Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Link Properties</span>
          <span className={`text-sm font-bold truncate max-w-[200px] ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
            Connection: {edge.sourceId} ➔ {edge.targetId}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Connection"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Label Text Input */}
        <div>
          <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Link Label
          </label>
          <input
            type="text"
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-all font-medium focus:outline-none focus:ring-1 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-850 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/30'
                : 'bg-slate-900/90 border border-slate-700/60 text-slate-100 placeholder-slate-500 focus:border-indigo-500/80 focus:ring-indigo-500/30'
            }`}
            placeholder="No label (e.g. Yes, No, HTTPS)"
            value={edge.label}
            onChange={(e) => onLabelChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onClose();
              }
            }}
            autoFocus
          />
        </div>

        {/* Style Selection */}
        <div>
          <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Link Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {EDGE_STYLES.map((style) => {
              const isSelected = styleId === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onStyleChange(style.id)}
                  title={style.name}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl border text-[10px] font-medium transition-all cursor-pointer h-14 ${
                    isSelected
                      ? isLight
                        ? 'bg-indigo-50 border-indigo-550 text-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                        : 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                      : isLight
                      ? 'bg-slate-50 border-slate-150 text-slate-500 hover:border-slate-300 hover:text-slate-850'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-450 hover:border-slate-700/60 hover:text-slate-300'
                  }`}
                >
                  <span className="font-mono text-sm mb-0.5 text-slate-400 select-none">
                    {style.symbol}
                  </span>
                  <span className="truncate w-full text-[9px] font-bold text-slate-500">{style.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
