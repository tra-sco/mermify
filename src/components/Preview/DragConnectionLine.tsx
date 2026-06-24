interface DragConnectionLineProps {
  sourceNode: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  dragLinkCurrent: {
    x: number;
    y: number;
  };
  dragLinkTarget: string | null;
}

/**
 * Renders the interactive bezier guide line when dragging to draw connections.
 */
export function DragConnectionLine({
  sourceNode,
  dragLinkCurrent,
  dragLinkTarget,
}: DragConnectionLineProps) {
  const startX = sourceNode.x + sourceNode.width / 2;
  const startY = sourceNode.y + sourceNode.height / 2;
  const endX = dragLinkCurrent.x;
  const endY = dragLinkCurrent.y;

  // Calculate smooth cubic Bezier control points
  const cpX1 = startX + (endX - startX) / 2;
  const cpY1 = startY;
  const cpX2 = startX + (endX - startX) / 2;
  const cpY2 = endY;

  const pathData = `M ${startX} ${startY} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${endX} ${endY}`;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-50">
      <g>
        <path
          d={pathData}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeDasharray="5,5"
          className="animate-link-dash"
        />
        <circle
          cx={endX}
          cy={endY}
          r="5"
          fill={dragLinkTarget ? '#10b981' : '#6366f1'}
          className="shadow-lg transition-colors duration-150"
        />
      </g>
    </svg>
  );
}
