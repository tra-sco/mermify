import { memo } from 'react';

/**
 * Animated SVG demonstrating dragging from a node's bottom socket to another node
 * to connect them.
 */
export const DragConnectAnimation = memo(function DragConnectAnimation() {
  return (
    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-950/40 border border-slate-800/80 flex items-center justify-center select-none">
      {/* Decorative Grid Grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

      <svg width="320" height="150" viewBox="0 0 320 150" className="w-full h-full max-w-[320px]">
        {/* Definitions for gradients and markers */}
        <defs>
          <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#6366f1" />
          </marker>
        </defs>

        {/* Node A (Source) */}
        <g transform="translate(30, 50)">
          <rect
            x="0"
            y="0"
            width="80"
            height="40"
            rx="8"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.5"
            className="transition-colors duration-300"
          />
          <text
            x="40"
            y="24"
            fill="#f8fafc"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            Node A
          </text>
          {/* Socket */}
          <circle
            cx="40"
            cy="40"
            r="5"
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="animate-pulse"
          />
        </g>

        {/* Node B (Target) */}
        <g transform="translate(210, 50)" className="target-node-anim">
          <rect
            x="0"
            y="0"
            width="80"
            height="40"
            rx="8"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.5"
            className="target-node-rect-anim"
          />
          <text
            x="40"
            y="24"
            fill="#f8fafc"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            Node B
          </text>
        </g>

        {/* Dynamic Dragging Line */}
        <path
          d="M 70 90 Q 140 130, 200 90"
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeDasharray="5,5"
          className="drag-line-anim"
          markerEnd="url(#arrowhead)"
        />

        {/* Cursor Element */}
        <g className="cursor-anim">
          {/* Pointer shape */}
          <path
            d="M0,0 L0,15 L4,11 L9,20 L12,19 L7,10 L13,10 Z"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="1.5"
          />
          {/* Click effect circle */}
          <circle cx="0" cy="0" r="8" fill="none" stroke="#10b981" strokeWidth="2" className="cursor-click-ring" />
        </g>
      </svg>

      <style>{`
        /* Cursor movement sequence */
        @keyframes moveCursor {
          0% {
            transform: translate(220px, 120px);
          }
          15% {
            transform: translate(70px, 90px); /* Hovering Node A socket */
          }
          20% {
            transform: translate(70px, 90px); /* Click Down */
          }
          50% {
            transform: translate(210px, 80px); /* Dragging to Node B */
          }
          65% {
            transform: translate(210px, 80px); /* Release Click */
          }
          85%, 100% {
            transform: translate(220px, 120px); /* Reset */
          }
        }

        /* Ring pulse on click */
        @keyframes clickRing {
          0%, 18% {
            opacity: 0;
            transform: scale(0.5);
          }
          20% {
            opacity: 1;
            transform: scale(1);
          }
          30% {
            opacity: 0;
            transform: scale(2);
          }
          100% {
            opacity: 0;
          }
        }

        /* Line draw path animation */
        @keyframes drawLine {
          0%, 20% {
            stroke-dashoffset: 80;
            opacity: 0;
          }
          21% {
            opacity: 1;
          }
          50% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          65% {
            stroke: #6366f1;
            stroke-dasharray: none;
            opacity: 1;
          }
          85% {
            opacity: 1;
            stroke: #6366f1;
          }
          86%, 100% {
            opacity: 0;
          }
        }

        /* Node B receiving connection glow */
        @keyframes glowTarget {
          0%, 50% {
            stroke: #475569;
            fill: #1e293b;
            box-shadow: none;
          }
          55% {
            stroke: #10b981;
            fill: #064e3b;
          }
          65% {
            stroke: #6366f1;
            fill: #1e1b4b;
          }
          85% {
            stroke: #6366f1;
            fill: #1e1b4b;
          }
          95%, 100% {
            stroke: #475569;
            fill: #1e293b;
          }
        }

        .cursor-anim {
          animation: moveCursor 5s infinite ease-in-out;
        }

        .cursor-click-ring {
          animation: clickRing 5s infinite ease-in-out;
        }

        .drag-line-anim {
          animation: drawLine 5s infinite ease-in-out;
          stroke-dasharray: 6;
        }

        .target-node-rect-anim {
          animation: glowTarget 5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
});

/**
 * Animated SVG demonstrating clicking a node to open details, renaming, and changing shape.
 */
export const ClickEditAnimation = memo(function ClickEditAnimation() {
  return (
    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-950/40 border border-slate-800/80 flex items-center justify-center select-none">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

      <svg width="320" height="150" viewBox="0 0 320 150" className="w-full h-full max-w-[320px]">
        {/* Node Center */}
        <g transform="translate(115, 45)">
          {/* Main Node */}
          <rect
            x="0"
            y="0"
            width="90"
            height="40"
            rx="8"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.5"
            className="click-node-rect"
          />
          {/* Hover Glow Ring */}
          <rect
            x="-3"
            y="-3"
            width="96"
            height="46"
            rx="11"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeDasharray="none"
            className="click-node-glow-ring"
          />
          {/* Node Label Text */}
          <text
            x="45"
            y="24"
            fill="#f8fafc"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="sans-serif"
            className="click-node-text"
          >
            Node A
          </text>

          {/* Inline Input Field Overlay (visible on double-click) */}
          <g transform="translate(5, 6)" className="inline-input-anim-group">
            <rect
              x="0"
              y="0"
              width="80"
              height="28"
              rx="4"
              fill="#0f172a"
              stroke="#6366f1"
              strokeWidth="1.5"
            />
            <text
              x="8"
              y="18"
              fill="#f8fafc"
              fontSize="10"
              fontFamily="sans-serif"
              className="inline-input-text"
            >
              Node A
            </text>
            {/* Blinking typing cursor */}
            <line x1="72" y1="8" x2="72" y2="20" stroke="#6366f1" strokeWidth="1.5" className="inline-cursor-line" />
          </g>

          {/* Floating Action Command Palette (visible on single-click) */}
          <g transform="translate(-20, -32)" className="palette-anim-group">
            {/* Backdrop pill */}
            <rect
              x="0"
              y="0"
              width="130"
              height="24"
              rx="12"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {/* Shape Trigger button */}
            <rect
              x="3"
              y="3"
              width="60"
              height="18"
              rx="9"
              fill="#1e293b"
              className="palette-shape-btn"
            />
            <text
              x="33"
              y="15"
              fill="#f8fafc"
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              Shape
            </text>
            {/* Divider */}
            <line x1="65" y1="4" x2="65" y2="20" stroke="#334155" strokeWidth="1" />
            {/* Delete button */}
            <text
              x="97"
              y="15"
              fill="#94a3b8"
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              Delete
            </text>
          </g>
        </g>

        {/* Cursor Element */}
        <g className="cursor-edit-anim">
          {/* Pointer shape */}
          <path
            d="M0,0 L0,15 L4,11 L9,20 L12,19 L7,10 L13,10 Z"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="1.5"
          />
          {/* Ripple 1 (Primary Indigo) */}
          <circle cx="0" cy="0" r="1" fill="none" stroke="#6366f1" strokeWidth="2" className="cursor-ripple-1" />
          {/* Ripple 2 (Secondary Bright White) */}
          <circle cx="0" cy="0" r="1" fill="none" stroke="#ffffff" strokeWidth="2.5" className="cursor-ripple-2" />
        </g>
      </svg>

      <style>{`
        /* Cursor movement over 8 seconds cycle */
        @keyframes moveEditCursor {
          0% {
            transform: translate(250px, 130px);
          }
          12% {
            transform: translate(160px, 65px); /* Hover node center */
          }
          22% {
            transform: translate(160px, 65px); /* Double click center finishes */
          }
          26% {
            transform: translate(190px, 85px); /* Move slightly aside to reveal typing */
          }
          48% {
            transform: translate(190px, 85px);
          }
          54% {
            transform: translate(160px, 65px); /* Hover node center again */
          }
          62% {
            transform: translate(160px, 65px); /* Single click center */
          }
          68% {
            transform: translate(148px, 35px); /* Move to Shape button inside command palette */
          }
          74% {
            transform: translate(148px, 35px); /* Click Shape button */
          }
          85%, 100% {
            transform: translate(250px, 130px); /* Move back to home position */
          }
        }

        /* Optimized Mouse Ripple Effects (Single & Double Click) */
        @keyframes ripple1Effect {
          /* Double click 1st tap (at 15%) */
          0%, 13% {
            transform: scale(0);
            opacity: 0;
          }
          15% {
            opacity: 0.85;
          }
          17% {
            transform: scale(22);
            opacity: 0;
          }
          /* Double click 2nd tap (at 18%) */
          18% {
            transform: scale(0);
            opacity: 0;
          }
          20% {
            opacity: 0.85;
          }
          22% {
            transform: scale(22);
            opacity: 0;
          }
          /* Single click on node (at 57.5%) */
          23%, 55% {
            transform: scale(0);
            opacity: 0;
          }
          57.5% {
            opacity: 0.85;
          }
          60% {
            transform: scale(22);
            opacity: 0;
          }
          /* Single click on shape (at 72.5%) */
          61%, 70% {
            transform: scale(0);
            opacity: 0;
          }
          72.5% {
            opacity: 0.85;
          }
          75% {
            transform: scale(22);
            opacity: 0;
          }
          76%, 100% {
            transform: scale(0);
            opacity: 0;
          }
        }

        @keyframes ripple2Effect {
          /* Double click 2nd tap (at 18%, white color shift) */
          0%, 17.5% {
            transform: scale(0);
            opacity: 0;
          }
          20% {
            opacity: 0.95;
          }
          22.5% {
            transform: scale(18);
            opacity: 0;
          }
          23%, 100% {
            transform: scale(0);
            opacity: 0;
          }
        }

        /* Node glow state changes */
        @keyframes nodeGlowBorder {
          0%, 10% {
            opacity: 0;
          }
          12%, 80% {
            opacity: 1;
          }
          82%, 100% {
            opacity: 0;
          }
        }

        @keyframes nodeGlowShapeSync {
          0%, 72% {
            rx: 11;
          }
          73%, 82% {
            rx: 23;
          }
          83%, 100% {
            rx: 11;
          }
        }

        /* Inline input field group transition (visible 22% to 47%) */
        @keyframes inlineInputPopup {
          0%, 21% {
            opacity: 0;
            visibility: hidden;
          }
          22%, 47% {
            opacity: 1;
            visibility: visible;
          }
          48%, 100% {
            opacity: 0;
            visibility: hidden;
          }
        }

        /* Command Palette popup transition (visible 58% to 79%) */
        @keyframes palettePopup {
          0%, 57% {
            opacity: 0;
            transform: translate(-20px, -20px) scale(0.9);
            visibility: hidden;
          }
          58%, 79% {
            opacity: 1;
            transform: translate(-20px, -32px) scale(1);
            visibility: visible;
          }
          80%, 100% {
            opacity: 0;
            transform: translate(-20px, -20px) scale(0.9);
            visibility: hidden;
          }
        }

        /* Command Palette Shape button clicked/active indicator */
        @keyframes paletteShapeBtnActive {
          0%, 70% {
            fill: #1e293b;
          }
          72%, 79% {
            fill: #4f46e5;
          }
          80%, 100% {
            fill: #1e293b;
          }
        }

        /* Typing text effect using CSS content swaps */
        @keyframes inlineTypeTextCSS {
          0%, 24% { content: "Node A"; }
          29% { content: "Node"; }
          34% { content: "Node Ed"; }
          39% { content: "Node Edit"; }
          44%, 100% { content: "Node Edited"; }
        }

        /* Node text sync edit */
        @keyframes nodeTextSyncCSS {
          0%, 47% { content: "Node A"; }
          48%, 84% { content: "Node Edited"; }
          85%, 100% { content: "Node A"; }
        }

        /* Node shape change visual sync */
        @keyframes nodeShapeSync {
          0%, 72% {
            rx: 8;
            stroke: #475569;
          }
          73%, 84% {
            rx: 20; /* Stadium/Capsule shape */
            stroke: #818cf8;
          }
          85%, 100% {
            rx: 8;
            stroke: #475569;
          }
        }

        .cursor-edit-anim {
          animation: moveEditCursor 8s infinite ease-in-out;
        }

        .cursor-ripple-1 {
          animation: ripple1Effect 8s infinite ease-in-out;
          transform-origin: 0 0;
        }

        .cursor-ripple-2 {
          animation: ripple2Effect 8s infinite ease-in-out;
          transform-origin: 0 0;
        }

        .click-node-glow-ring {
          animation: nodeGlowBorder 8s infinite ease-in-out, nodeGlowShapeSync 8s infinite ease-in-out;
        }

        .inline-input-anim-group {
          animation: inlineInputPopup 8s infinite ease-in-out;
        }

        .palette-anim-group {
          animation: palettePopup 8s infinite ease-in-out;
        }

        .palette-shape-btn {
          animation: paletteShapeBtnActive 8s infinite ease-in-out;
        }

        .inline-input-text {
          animation: inlineTypeTextCSS 8s infinite steps(1);
        }

        .click-node-text {
          animation: nodeTextSyncCSS 8s infinite steps(1);
        }

        .click-node-rect {
          animation: nodeShapeSync 8s infinite ease-in-out;
        }

        /* Blink vertical bar indicator cursor */
        @keyframes cursorBlink {
          50% { opacity: 0; }
        }
        .inline-cursor-line {
          animation: cursorBlink 0.8s infinite;
        }
      `}</style>
    </div>
  );
});

/**
 * Animated SVG demonstrating dragging from a node's bottom socket to empty space
 * to spawn a new connected node.
 */
export const DragSpawnAnimation = memo(function DragSpawnAnimation() {
  return (
    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-950/40 border border-slate-800/80 flex items-center justify-center select-none">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

      <svg width="320" height="150" viewBox="0 0 320 150" className="w-full h-full max-w-[320px]">
        <defs>
          <marker
            id="arrowhead2"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#10b981" />
          </marker>
        </defs>

        {/* Node A (Source) */}
        <g transform="translate(30, 50)">
          <rect
            x="0"
            y="0"
            width="80"
            height="40"
            rx="8"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.5"
          />
          <text
            x="40"
            y="24"
            fill="#f8fafc"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            Node A
          </text>
          {/* Socket */}
          <circle
            cx="40"
            cy="40"
            r="5"
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="animate-pulse"
          />
        </g>

        {/* Spawning target node shadow/dashed outline */}
        <g transform="translate(210, 50)" className="spawn-outline-group">
          <rect
            x="0"
            y="0"
            width="80"
            height="40"
            rx="8"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4,4"
          />
          <text
            x="40"
            y="24"
            fill="#10b981"
            fontSize="10"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            + New Node
          </text>
        </g>

        {/* Spelled target node (final spawned node) */}
        <g transform="translate(210, 50)" className="spawn-final-group">
          <rect
            x="0"
            y="0"
            width="80"
            height="40"
            rx="8"
            fill="#064e3b"
            stroke="#10b981"
            strokeWidth="2"
          />
          <text
            x="40"
            y="24"
            fill="#f8fafc"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            Node B
          </text>
        </g>

        {/* Dynamic Dragging Line */}
        <path
          d="M 70 90 Q 140 130, 210 90"
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeDasharray="5,5"
          className="spawn-line-anim"
          markerEnd="url(#arrowhead2)"
        />

        {/* Cursor Element */}
        <g className="cursor-spawn-anim">
          {/* Pointer shape */}
          <path
            d="M0,0 L0,15 L4,11 L9,20 L12,19 L7,10 L13,10 Z"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="1.5"
          />
          {/* Click effect circle */}
          <circle cx="0" cy="0" r="8" fill="none" stroke="#10b981" strokeWidth="2" className="cursor-spawn-click-ring" />
        </g>
      </svg>

      <style>{`
        /* Cursor movement for spawning node */
        @keyframes moveSpawnCursor {
          0% {
            transform: translate(220px, 120px);
          }
          15% {
            transform: translate(70px, 90px); /* Hover socket */
          }
          20% {
            transform: translate(70px, 90px); /* Click Down */
          }
          50% {
            transform: translate(230px, 110px); /* Drag to empty space */
          }
          65% {
            transform: translate(230px, 110px); /* Release Click */
          }
          85%, 100% {
            transform: translate(220px, 120px); /* Reset */
          }
        }

        /* Line draw path animation */
        @keyframes drawSpawnLine {
          0%, 20% {
            stroke-dashoffset: 80;
            opacity: 0;
          }
          21% {
            opacity: 1;
          }
          50% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          65% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          86%, 100% {
            opacity: 0;
          }
        }

        /* Spawn placeholder visibility */
        @keyframes spawnPlaceholderShow {
          0%, 40% {
            opacity: 0;
            transform: translate(210px, 50px) scale(0.9);
          }
          45%, 64% {
            opacity: 1;
            transform: translate(210px, 50px) scale(1);
          }
          65%, 100% {
            opacity: 0;
            transform: translate(210px, 50px) scale(0.9);
          }
        }

        /* Spawning final node animation on click release */
        @keyframes spawnFinalShow {
          0%, 64% {
            opacity: 0;
            transform: translate(210px, 50px) scale(0.6);
            visibility: hidden;
          }
          65% {
            opacity: 1;
            transform: translate(210px, 50px) scale(1.15);
            visibility: visible;
          }
          70%, 85% {
            opacity: 1;
            transform: translate(210px, 50px) scale(1);
            visibility: visible;
          }
          86%, 100% {
            opacity: 0;
            transform: translate(210px, 50px) scale(0.6);
            visibility: hidden;
          }
        }

        .cursor-spawn-anim {
          animation: moveSpawnCursor 5s infinite ease-in-out;
        }

        .cursor-spawn-click-ring {
          animation: clickRing 5s infinite ease-in-out;
        }

        .spawn-line-anim {
          animation: drawSpawnLine 5s infinite ease-in-out;
          stroke-dasharray: 6;
        }

        .spawn-outline-group {
          animation: spawnPlaceholderShow 5s infinite ease-in-out;
          transform-origin: center;
        }

        .spawn-final-group {
          animation: spawnFinalShow 5s infinite ease-in-out;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
});
