import { Plus } from 'lucide-react';

interface NewNodePlaceholderProps {
  x: number;
  y: number;
  isTargeted: boolean;
  isLight?: boolean;
}

/**
 * Ghost node placeholder that follows the drag cursor when hovering over empty space.
 */
export function NewNodePlaceholder({
  x,
  y,
  isLight = false,
}: NewNodePlaceholderProps) {
  const placeholderWidth = 100;
  const placeholderHeight = 44;
  const placeholderX = x - placeholderWidth / 2;
  const placeholderY = y - placeholderHeight / 2;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${placeholderX}px`,
        top: `${placeholderY}px`,
        width: `${placeholderWidth}px`,
        height: `${placeholderHeight}px`,
      }}
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-250 pointer-events-none z-30 scale-105 ${
        isLight
          ? 'border-emerald-600 bg-emerald-50/70 shadow-[0_0_16px_rgba(16,185,129,0.2)] text-emerald-700'
          : 'border-emerald-500 bg-emerald-950/40 shadow-[0_0_16px_rgba(16,185,129,0.3)] text-emerald-450'
      }`}
    >
      <Plus className="w-4 h-4 mb-0.5" />
      <span className="text-[8px] font-extrabold uppercase tracking-wider">
        Spawn Node
      </span>
    </div>
  );
}
