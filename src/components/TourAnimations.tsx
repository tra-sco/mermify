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
        <g transform="translate(115, 20)">
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
        </g>

        {/* Modal Window Overlay */}
        <g transform="translate(75, 75)" className="modal-anim-group">
          {/* Backdrop glass panel */}
          <rect
            x="0"
            y="0"
            width="170"
            height="65"
            rx="8"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="1.5"
            className="modal-bg"
          />
          <text x="10" y="20" fill="#94a3b8" fontSize="9" fontWeight="600" fontFamily="sans-serif">
            EDIT NODE PROPERTIES
          </text>
          {/* Text Input mock */}
          <rect x="10" y="28" width="150" height="14" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <text x="15" y="38" fill="#f8fafc" fontSize="8" fontFamily="sans-serif" className="modal-input-text">
            Node A
          </text>
          {/* Cursor text line indicator */}
          <line x1="45" y1="31" x2="45" y2="39" stroke="#6366f1" strokeWidth="1.5" className="modal-cursor-line" />

          {/* Preset Buttons */}
          <g transform="translate(10, 48)">
            <rect x="0" y="0" width="40" height="12" rx="2" fill="#312e81" stroke="#4f46e5" strokeWidth="1" />
            <text x="20" y="8" fill="#a5b4fc" fontSize="7" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">
              Save
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
          {/* Click effect circle */}
          <circle cx="0" cy="0" r="8" fill="none" stroke="#6366f1" strokeWidth="2" className="cursor-edit-click-ring" />
        </g>
      </svg>

      <style>{`
        /* Cursor movement */
        @keyframes moveEditCursor {
          0% {
            transform: translate(250px, 110px);
          }
          15% {
            transform: translate(160px, 40px); /* Hover node center */
          }
          20% {
            transform: translate(160px, 40px); /* Click node */
          }
          40% {
            transform: translate(140px, 110px); /* Move into Modal text box */
          }
          45% {
            transform: translate(140px, 110px); /* Click input */
          }
          75% {
            transform: translate(110px, 130px); /* Move to Save button */
          }
          80% {
            transform: translate(110px, 130px); /* Click Save button */
          }
          95%, 100% {
            transform: translate(250px, 110px); /* Reset */
          }
        }

        @keyframes cursorEditClickRing {
          0%, 18% {
            opacity: 0;
            transform: scale(0.5);
          }
          20% {
            opacity: 1;
            transform: scale(1);
          }
          21%, 43% {
            opacity: 0;
          }
          45% {
            opacity: 1;
            transform: scale(1);
          }
          46%, 78% {
            opacity: 0;
          }
          80% {
            opacity: 1;
            transform: scale(1);
          }
          90%, 100% {
            opacity: 0;
          }
        }

        /* Node glow state changes */
        @keyframes nodeGlowBorder {
          0%, 15% {
            opacity: 0;
          }
          20%, 80% {
            opacity: 1;
          }
          85%, 100% {
            opacity: 0;
          }
        }

        /* Modal popup animation */
        @keyframes modalPopup {
          0%, 20% {
            opacity: 0;
            transform: translate(75px, 90px) scale(0.9);
            visibility: hidden;
          }
          25%, 80% {
            opacity: 1;
            transform: translate(75px, 75px) scale(1);
            visibility: visible;
          }
          85%, 100% {
            opacity: 0;
            transform: translate(75px, 90px) scale(0.9);
            visibility: hidden;
          }
        }

        /* Input typing text animation */
        @keyframes typeText {
          0%, 45% {
            textContent: "Node A";
          }
          50% {
            textContent: "Node";
          }
          55% {
            textContent: "Node E";
          }
          60% {
            textContent: "Node Edi";
          }
          65%, 80% {
            textContent: "Node Edited";
          }
          85%, 100% {
            textContent: "Node A";
          }
        }

        /* Node text sync edit */
        @keyframes nodeTextSync {
          0%, 80% {
            textContent: "Node A";
          }
          81%, 100% {
            textContent: "Node Edited";
          }
        }

        /* Save node shape change visual sync */
        @keyframes nodeShapeSync {
          0%, 80% {
            rx: 8;
            stroke: #475569;
          }
          81%, 95% {
            rx: 20; /* Stadium/Capsule shape */
            stroke: #818cf8;
          }
        }

        .cursor-edit-anim {
          animation: moveEditCursor 6s infinite ease-in-out;
        }

        .cursor-edit-click-ring {
          animation: cursorEditClickRing 6s infinite ease-in-out;
          transform-origin: center;
        }

        .click-node-glow-ring {
          animation: nodeGlowBorder 6s infinite ease-in-out;
        }

        .modal-anim-group {
          animation: modalPopup 6s infinite ease-in-out;
        }

        .modal-input-text::after {
          content: 'Node A';
        }

        /* Typing text effect using CSS content swaps */
        .modal-input-text {
          animation: typeTextCSS 6s infinite steps(1);
        }

        .click-node-text {
          animation: nodeTextSyncCSS 6s infinite steps(1);
        }

        .click-node-rect {
          animation: nodeShapeSync 6s infinite ease-in-out;
        }

        @keyframes typeTextCSS {
          0%, 48% { content: "Node A"; }
          52% { content: "Node"; }
          56% { content: "Node Ed"; }
          60% { content: "Node Edit"; }
          64%, 80% { content: "Node Edited"; }
          84%, 100% { content: "Node A"; }
        }

        @keyframes nodeTextSyncCSS {
          0%, 80% { content: "Node A"; }
          81%, 95% { content: "Node Edited"; }
        }

        /* Blink vertical bar indicator cursor */
        @keyframes cursorBlink {
          50% { opacity: 0; }
        }
        .modal-cursor-line {
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
