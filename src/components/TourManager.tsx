import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DragConnectAnimation, ClickEditAnimation, DragSpawnAnimation } from './TourAnimations';

interface StepConfig {
  title: string;
  description: string;
  targetSelector?: string; // Empty means centered modal (no target)
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  animation?: React.ReactNode;
}

interface TourManagerProps {
  theme?: 'light' | 'dark';
}

const STEPS: StepConfig[] = [
  {
    title: 'Welcome to Mermify! 🚀',
    description: 'Mermify is a premium hybrid editor that combines real-time Mermaid markdown code editing with direct, visual interaction on the diagram. Let’s take a quick 1-minute tour to see how it works!',
    position: 'center',
  },
  {
    title: 'Hybrid Code Editor ✍️',
    description: 'Write, edit, or copy Mermaid flowchart markdown here. The diagram on the right updates instantly as you type. If you make a syntax mistake, the built-in validator will guide you.',
    targetSelector: '[data-testid="editor-pane"]',
    position: 'right',
  },
  {
    title: 'Interactive Preview Canvas 🎨',
    description: 'Interact with the rendered diagram. You can click and drag to pan the canvas, or use the mouse wheel to zoom in and out. Press the "Fit" button to center your diagram.',
    targetSelector: '[data-testid="preview-pane"]',
    position: 'left',
  },
  {
    title: 'Drag to Connect Nodes 🔗',
    description: 'Hover over any node and drag the green socket at the bottom. Drop it onto another node to quickly link them together with a connection arrow.',
    targetSelector: '[data-testid="preview-pane"]',
    position: 'left',
    animation: <DragConnectAnimation />,
  },
  {
    title: 'Drag to Spawn New Nodes 🌿',
    description: 'Need to expand your flow? Drag the green socket from any node into empty canvas space and release. A new connected node will instantly spawn and open for editing!',
    targetSelector: '[data-testid="preview-pane"]',
    position: 'left',
    animation: <DragSpawnAnimation />,
  },
  {
    title: 'Click Node or Edge to Edit ✏️',
    description: 'Click any node or connection line directly in the preview to rename it, customize its shape, change arrow styles, or delete it instantly without manually writing markdown.',
    targetSelector: '[data-testid="preview-pane"]',
    position: 'left',
    animation: <ClickEditAnimation />,
  },
  {
    title: 'Export & Share 📤',
    description: 'Download your diagram as a high-quality SVG or PNG, copy the PNG image directly to your clipboard, or copy a compressed shareable URL to share your live workspace state.',
    targetSelector: '[data-testid="export-share-container"]',
    position: 'left',
  },
];

export function TourManager({ theme = 'dark' }: TourManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const resizeTimeoutRef = useRef<number | null>(null);

  // Initialize and check localStorage
  useEffect(() => {
    const isCompleted = localStorage.getItem('mermify-tour-completed');
    let frameId: number;
    if (!isCompleted) {
      frameId = window.requestAnimationFrame(() => {
        setIsOpen(true);
      });
    }

    // Custom event listener so header button can relaunch tour
    const handleRelaunch = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };

    window.addEventListener('mermify-relaunch-tour', handleRelaunch);
    return () => {
      window.removeEventListener('mermify-relaunch-tour', handleRelaunch);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const updateTargetBounds = useCallback(() => {
    if (!isOpen) return;
    const selector = STEPS[currentStep]?.targetSelector;
    if (!selector) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      // Scroll into view if needed
      element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  // Update target element location when step changes, window resizes, or layout shifts
  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      updateTargetBounds();
    });

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        window.cancelAnimationFrame(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = window.requestAnimationFrame(() => {
        updateTargetBounds();
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    // Wait slightly for layout rendering (e.g. Monaco mounting)
    const timer = setTimeout(() => {
      updateTargetBounds();
    }, 150);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
      clearTimeout(timer);
      if (resizeTimeoutRef.current) {
        window.cancelAnimationFrame(resizeTimeoutRef.current);
      }
    };
  }, [currentStep, isOpen, updateTargetBounds]);

  if (!isOpen) return null;

  const currentStepData = STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem('mermify-tour-completed', 'true');
    setIsOpen(false);
  };

  const isLight = theme === 'light';

  // Popover coordinates
  let popoverStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
  };

  if (!targetRect || currentStepData.position === 'center') {
    // Centered modal
    popoverStyle = {
      ...popoverStyle,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      maxWidth: '440px',
    };
  } else {
    const pad = 16;
    const r = targetRect;

    if (currentStepData.position === 'right') {
      popoverStyle = {
        ...popoverStyle,
        top: `${r.top + r.height / 2}px`,
        left: `${r.right + pad}px`,
        transform: 'translateY(-50%)',
        maxWidth: '380px',
      };
    } else if (currentStepData.position === 'left') {
      popoverStyle = {
        ...popoverStyle,
        top: `${r.top + r.height / 2}px`,
        right: `${window.innerWidth - r.left + pad}px`,
        transform: 'translateY(-50%)',
        maxWidth: '380px',
      };
    } else if (currentStepData.position === 'bottom') {
      popoverStyle = {
        ...popoverStyle,
        top: `${r.bottom + pad}px`,
        left: `${r.left + r.width / 2}px`,
        transform: 'translateX(-50%)',
        maxWidth: '440px',
      };
    } else {
      // Top default fallback
      popoverStyle = {
        ...popoverStyle,
        bottom: `${window.innerHeight - r.top + pad}px`,
        left: `${r.left + r.width / 2}px`,
        transform: 'translateX(-50%)',
        maxWidth: '440px',
      };
    }
  }

  // Generate SVG backdrop cutout mask path
  const w = window.innerWidth;
  const h = window.innerHeight;
  let maskD = `M 0 0 H ${w} V ${h} H 0 Z`; // Full cover backdrop

  if (targetRect) {
    const r = targetRect;
    const borderPadding = 6;
    const rx = Math.max(0, r.left - borderPadding);
    const ry = Math.max(0, r.top - borderPadding);
    const rw = r.width + borderPadding * 2;
    const rh = r.height + borderPadding * 2;
    // Overlay hole using evenodd fill rule (draw outer clockwise, inner counterclockwise)
    maskD = `M 0 0 H ${w} V ${h} H 0 Z M ${rx} ${ry} v ${rh} h ${rw} v -${rh} z`;
  }

  return (
    <div className="fixed inset-0 z-[9990] overflow-hidden pointer-events-auto">
      {/* Backdrop overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ fillRule: 'evenodd' }}>
        <path
          d={maskD}
          fill="rgba(2, 6, 23, 0.75)"
          className="transition-all duration-300 ease-out"
          onClick={handleClose}
        />
      </svg>

      {/* Target outline highlight */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            pointerEvents: 'none',
          }}
          className="border-2 border-indigo-500 rounded-2xl shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300 ease-out z-[9995]"
        />
      )}

      {/* Popover Step Card */}
      <div
        style={popoverStyle}
        className={`flex flex-col p-6 rounded-2xl border shadow-2xl transition-all duration-300 backdrop-blur-xl z-[9999] ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/40'
            : 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-slate-950/80'
        }`}
      >
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              : 'bg-slate-950 border-slate-800/80 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
          }`}
          title="Skip Tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <h2 className="text-base font-extrabold tracking-wide mb-2 flex items-center pr-6">
          {currentStepData.title}
        </h2>
        <p className={`text-xs leading-relaxed font-medium mb-4 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {currentStepData.description}
        </p>

        {/* Animation visual container */}
        {currentStepData.animation && (
          <div className="mb-4 overflow-hidden rounded-xl">
            {currentStepData.animation}
          </div>
        )}

        {/* Action buttons & indicator footer */}
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-800/40">
          <span className={`text-[10px] font-bold font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <div className="flex items-center space-x-2">
            {currentStep > 0 ? (
              <button
                onClick={handlePrev}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                onClick={handleClose}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                Skip
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <span>{currentStep === STEPS.length - 1 ? 'Finish' : 'Next'}</span>
              {currentStep < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
