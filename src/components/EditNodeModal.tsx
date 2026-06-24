import { X, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { NODE_SHAPES } from '../utils/mermaidParser';
import { useClickOutsideAndEscape } from '../hooks/useClickOutsideAndEscape';

interface EditNodeModalProps {
  node: {
    id: string;
    label: string;
    shapeId?: string;
  };
  onLabelChange: (newLabel: string) => void;
  onShapeChange: (newShapeId: string) => void;
  onDelete: () => void;
  onClose: () => void;
  isLight?: boolean;
}

function ShapePreview({ id }: { id: string }) {
  switch (id) {
    case 'rectangle':
      return (
        <svg viewBox="0 0 50 30" className="w-12 h-6 text-current">
          <rect x="5" y="8" width="40" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'round':
      return (
        <svg viewBox="0 0 50 30" className="w-12 h-6 text-current">
          <rect x="5" y="8" width="40" height="14" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'stadium':
      return (
        <svg viewBox="0 0 50 30" className="w-12 h-6 text-current">
          <rect x="5" y="8" width="40" height="14" rx="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'subroutine':
      return (
        <svg viewBox="0 0 50 30" className="w-12 h-6 text-current">
          <rect x="5" y="8" width="40" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="9" y1="8" x2="9" y2="22" stroke="currentColor" strokeWidth="1.5" />
          <line x1="41" y1="8" x2="41" y2="22" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'database':
      return (
        <svg viewBox="0 0 50 30" className="w-12 h-6 text-current">
          <ellipse cx="25" cy="8" rx="20" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5,8 V20 C5,24 45,24 45,20 V8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5,14 C5,18 45,18 45,14" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'circle':
      return (
        <svg viewBox="0 0 50 30" className="w-12 h-6 text-current">
          <circle cx="25" cy="15" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'hexagon':
      return (
        <svg viewBox="0 0 50 30" className="w-12 h-6 text-current">
          <polygon points="12,8 38,8 45,15 38,22 12,22 5,15" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'rhombus':
      return (
        <svg viewBox="0 0 50 30" className="w-12 h-6 text-current">
          <polygon points="25,5 45,15 25,25 5,15" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'asymmetric':
      return (
        <svg viewBox="0 0 50 30" className="w-12 h-6 text-current">
          <path d="M5,8 H38 L45,15 L38,22 H5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'parallelogram':
      return (
        <svg viewBox="0 0 50 30" className="w-12 h-6 text-current">
          <polygon points="10,8 45,8 40,22 5,22" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'parallelogram_alt':
      return (
        <svg viewBox="0 0 50 30" className="w-12 h-6 text-current">
          <polygon points="5,8 40,8 45,22 10,22" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    default:
      return null;
  }
}

export function EditNodeModal({
  node,
  onLabelChange,
  onShapeChange,
  onDelete,
  onClose,
  isLight = false,
}: EditNodeModalProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverWidth = 320;

  const [isShaking, setIsShaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  // Handle escape key and click outside to close
  useClickOutsideAndEscape(popoverRef, onClose);

  const handleShapeSelect = (shapeId: string) => {
    if (node.label.trim() === '') {
      triggerError('Node label cannot be empty.');
      return;
    }
    onShapeChange(shapeId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (node.label.trim() === '') {
        triggerError('Node label cannot be empty.');
        return;
      }
      onClose();
    }
  };

  return (
    <div
      ref={popoverRef}
      style={{
        width: `${popoverWidth}px`,
      }}
      className={`absolute top-[72px] right-6 z-50 glass-panel shadow-2xl rounded-2xl p-5 border transition-all duration-200 pointer-events-auto ${
        isShaking 
          ? 'border-rose-500/80 shadow-[0_0_24px_rgba(244,63,94,0.25)] animate-shake' 
          : isLight
          ? 'border-slate-200 bg-white/90 shadow-xl'
          : 'border-slate-700/80 animate-in fade-in slide-in-from-top-3'
      }`}
    >
      {/* Popover Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">Node Properties</span>
          <span className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Editing: Node {node.id}</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Node"
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
            Node Label
          </label>
          <input
            type="text"
            className={`w-full px-3 py-2 border rounded-lg text-sm transition-all font-medium focus:outline-none focus:ring-1 ${
              errorMsg
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
                : isLight
                ? 'bg-white border-slate-200 text-slate-850 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/30'
                : 'bg-slate-900/90 border-slate-700/60 text-slate-100 placeholder-slate-500 focus:border-indigo-500/80 focus:ring-indigo-500/30'
            }`}
            placeholder="Enter label text..."
            value={node.label}
            onChange={(e) => {
              if (errorMsg) setErrorMsg(null);
              onLabelChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {errorMsg && (
            <span className="text-[10px] text-rose-500 font-semibold animate-pulse mt-1.5 block">
              {errorMsg}
            </span>
          )}
        </div>

        {/* Shape Grid Selection */}
        <div>
          <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Node Shape
          </label>
          <div className="grid grid-cols-3 gap-2">
            {NODE_SHAPES.map((shape) => {
              const isSelected = node.shapeId === shape.id;
              return (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => handleShapeSelect(shape.id)}
                  title={shape.name}
                  className={`flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer h-11 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-550 text-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                      : isLight
                      ? 'bg-slate-50 border-slate-150 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-450 hover:border-slate-700/60 hover:text-slate-300'
                  }`}
                >
                  <ShapePreview id={shape.id} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
