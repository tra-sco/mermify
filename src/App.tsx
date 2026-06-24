import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import type { OverlayNode, OverlayEdge } from './components/Preview';
import { PRESETS } from './constants/presets';
import type { PresetKey } from './constants/presets';
import { decompressCode } from './utils/urlCompression';
import { useDiagramState } from './hooks/useDiagramState';
import {
  updateNodeLabelAndShape,
  addNodeConnection,
  deleteNodeFromMermaid,
  updateConnectionInMermaid,
  deleteConnectionFromMermaid
} from './utils/mermaidParser';
import { Undo2, Redo2, Sun, Moon, HelpCircle } from 'lucide-react';
import { TourManager } from './components/TourManager';

const EditNodeModal = lazy(() =>
  import('./components/EditNodeModal').then((m) => ({ default: m.EditNodeModal }))
);
const EditEdgeModal = lazy(() =>
  import('./components/EditEdgeModal').then((m) => ({ default: m.EditEdgeModal }))
);

// Extract initial code from URL parameters or fallback to default preset
const getInitialCode = (): string => {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) {
      const decoded = decompressCode(urlCode);
      if (decoded.trim()) {
        return decoded;
      }
    }
  } catch (e) {
    console.error('Failed to parse initial URL code state:', e);
  }
  return PRESETS.workflow;
};

export default function App() {
  const [editingNode, setEditingNode] = useState<OverlayNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<OverlayEdge | null>(null);

  const isEditingActive = !!editingNode || !!editingEdge;

  // Diagram document state hook
  const {
    code,
    debouncedCode,
    updateCode,
    undo,
    redo,
    history,
    setHistory,
  } = useDiagramState(getInitialCode(), isEditingActive);

  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('mermify-theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('mermify-theme', theme);
  }, [theme]);

  // Modals state
  const [renderedNodes, setRenderedNodes] = useState<Array<{ id: string; label: string }>>([]);

  // Global undo/redo keyboard shortcuts (with capture phase to override Monaco)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (isCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        e.stopPropagation();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [undo, redo]);

  // Preset loading helper
  const handleLoadPreset = (key: PresetKey) => {
    updateCode(PRESETS[key], true);
    setEditingNode(null);
  };

  // Node real-time label update callback
  const handleNodeLabelChange = (newLabel: string) => {
    if (!editingNode) return;

    // Do not auto-save to code if the label is empty to prevent syntax errors
    if (newLabel.trim() === '') {
      setEditingNode((prev) => (prev ? { ...prev, label: newLabel } : null));
      return;
    }

    const updatedCode = updateNodeLabelAndShape(
      code,
      editingNode.id,
      newLabel,
      editingNode.shapeId || 'rectangle'
    );
    updateCode(updatedCode, false);
    setEditingNode((prev) => (prev ? { ...prev, label: newLabel } : null));
  };

  // Node shape update callback (discrete action, closes modal)
  const handleNodeShapeChange = (newShapeId: string) => {
    if (!editingNode) return;
    const updatedCode = updateNodeLabelAndShape(
      code,
      editingNode.id,
      editingNode.label,
      newShapeId
    );
    updateCode(updatedCode, true);
    setEditingNode(null);
  };

  // Node deletion callback
  const handleDeleteNodeById = useCallback((nodeId: string) => {
    const updatedCode = deleteNodeFromMermaid(code, nodeId);
    updateCode(updatedCode, true);
    if (editingNode?.id === nodeId) {
      setEditingNode(null);
    }
  }, [code, editingNode, updateCode]);

  const handleDeleteNode = () => {
    if (!editingNode) return;
    handleDeleteNodeById(editingNode.id);
  };

  // Connection real-time label update callback
  const handleEdgeLabelChange = (newLabel: string) => {
    if (!editingEdge) return;
    const updatedCode = updateConnectionInMermaid(
      code,
      editingEdge.sourceId,
      editingEdge.targetId,
      newLabel,
      editingEdge.style || '-->'
    );
    updateCode(updatedCode, false);
    setEditingEdge((prev) => (prev ? { ...prev, label: newLabel } : null));
  };

  // Connection style update callback (discrete action, closes modal)
  const handleEdgeStyleChange = (newStyleId: string) => {
    if (!editingEdge) return;
    const updatedCode = updateConnectionInMermaid(
      code,
      editingEdge.sourceId,
      editingEdge.targetId,
      editingEdge.label,
      newStyleId
    );
    updateCode(updatedCode, true);
    setEditingEdge(null);
  };

  // Connection deletion callback
  const handleDeleteConnectionByEnds = useCallback((sourceId: string, targetId: string) => {
    const updatedCode = deleteConnectionFromMermaid(code, sourceId, targetId);
    updateCode(updatedCode, true);
    if (editingEdge?.sourceId === sourceId && editingEdge?.targetId === targetId) {
      setEditingEdge(null);
    }
  }, [code, editingEdge, updateCode]);

  const handleDeleteConnection = () => {
    if (!editingEdge) return;
    handleDeleteConnectionByEnds(editingEdge.sourceId, editingEdge.targetId);
  };

  const handleCloseNodeModal = () => {
    setHistory((prev) => {
      if (prev.present === code) return prev;
      return {
        past: [...prev.past, prev.present],
        present: code,
        future: [],
      };
    });
    setEditingNode(null);
  };

  const handleCloseEdgeModal = () => {
    setHistory((prev) => {
      if (prev.present === code) return prev;
      return {
        past: [...prev.past, prev.present],
        present: code,
        future: [],
      };
    });
    setEditingEdge(null);
  };

  const handleConnectNewNode = (sourceId: string) => {
    // Generate sequential target ID
    let counter = 1;
    while (renderedNodes.some(n => n.id === `N${counter}`)) {
      counter++;
    }
    const targetId = `N${counter}`;
    const targetLabel = `Node ${counter}`;

    // Add connection in code
    const updatedCode = addNodeConnection(
      code,
      sourceId,
      targetId,
      '-->',
      '',
      targetLabel,
      'rectangle'
    );
    updateCode(updatedCode, true);

    // Auto-trigger editing of the newly created node
    setTimeout(() => {
      setEditingNode({
        id: targetId,
        label: targetLabel,
        shapeId: 'rectangle',
        x: 0,
        y: 0,
        width: 0,
        height: 0
      });
    }, 450);
  };

  const handleAddNode = () => {
    let counter = 1;
    while (renderedNodes.some(n => n.id === `N${counter}`)) {
      counter++;
    }
    const nodeId = `N${counter}`;
    const nodeLabel = `Node ${counter}`;

    const newLine = `    ${nodeId}[${nodeLabel}]`;
    const updatedCode = code.trim() ? `${code.trimEnd()}\n${newLine}\n` : `flowchart TD\n${newLine}\n`;
    updateCode(updatedCode, true);

    setTimeout(() => {
      setEditingNode({
        id: nodeId,
        label: nodeLabel,
        shapeId: 'rectangle',
        x: 0,
        y: 0,
        width: 0,
        height: 0
      });
    }, 450);
  };

  // Stabilize nodes parsing to prevent infinite rendering cascade loops
  const handleNodesParsed = useCallback((nodes: OverlayNode[]) => {
    setRenderedNodes((prevNodes) => {
      const hasChanged = nodes.length !== prevNodes.length ||
        nodes.some((node, idx) => prevNodes[idx]?.id !== node.id || prevNodes[idx]?.label !== node.label);
      if (!hasChanged) return prevNodes;
      return nodes.map(n => ({ id: n.id, label: n.label }));
    });
  }, []);



  const isLight = theme === 'light';

  return (
    <div className={`flex flex-col h-screen overflow-hidden font-sans transition-colors duration-300 ${isLight ? 'bg-slate-50 text-slate-900 theme-light' : 'bg-slate-950 text-slate-100'
      }`}>

      {/* Global Application Nav Bar */}
      <header
        data-testid="toolbar-header"
        className={`flex items-center justify-between px-8 py-4 border-b backdrop-blur-xl z-20 transition-colors duration-300 ${isLight ? 'bg-white/80 border-slate-200/80' : 'bg-slate-900/40 border-slate-800/80'
        }`}
      >
        <div className="flex items-center space-x-3">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="mermify logo" className="h-10 w-10" />
          <div>
            <h1 className={`text-sm font-black tracking-wider flex items-center space-x-1.5 transition-colors duration-300 ${isLight ? 'text-slate-900' : 'text-slate-50'}`}>
              <span>mermify</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                Hybrid Editor
              </span>
            </h1>
            <p className={`text-[10px] font-medium transition-colors duration-300 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Click SVG nodes in preview to edit code instantly</p>
          </div>
          <nav className="flex items-center space-x-4">
            <a href={`${import.meta.env.BASE_URL}docs/`} className={`text-sm font-medium transition-colors duration-300 ${isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-300 hover:text-slate-100'}`}>Docs</a>
          </nav>
        </div>

        {/* Undo/Redo & Toolbar Presets */}
        <div className="flex items-center space-x-5">
          {/* Undo/Redo Controls */}
          <div className={`flex items-center border rounded-xl p-0.5 shadow-inner transition-colors duration-300 ${isLight ? 'bg-slate-100/60 border-slate-200/80' : 'bg-slate-950/60 border-slate-800/80'
            }`}>
            <button
              onClick={undo}
              disabled={history.past.length === 0}
              className={`p-1.5 rounded-lg transition-all active:scale-95 ${history.past.length > 0
                ? isLight
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200 cursor-pointer'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800 cursor-pointer'
                : isLight
                  ? 'text-slate-300 opacity-40 cursor-not-allowed'
                  : 'text-slate-600 opacity-40 cursor-not-allowed'
                }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={history.future.length === 0}
              className={`p-1.5 rounded-lg transition-all active:scale-95 ${history.future.length > 0
                ? isLight
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200 cursor-pointer'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800 cursor-pointer'
                : isLight
                  ? 'text-slate-300 opacity-40 cursor-not-allowed'
                  : 'text-slate-600 opacity-40 cursor-not-allowed'
                }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Presets */}
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-semibold mr-1 transition-colors duration-300 ${isLight ? 'text-slate-500' : 'text-slate-500'
              }`}>Presets:</span>
            {(['workflow', 'decision', 'devops'] as PresetKey[]).map((preset) => (
              <button
                key={preset}
                onClick={() => handleLoadPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${code === PRESETS[preset]
                  ? isLight
                    ? 'bg-indigo-50 border-indigo-550 text-indigo-700'
                    : 'bg-indigo-600/15 border-indigo-500 text-indigo-300'
                  : isLight
                    ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
              >
                {preset === 'workflow' ? 'Workflow' : preset === 'decision' ? 'Decision Tree' : 'DevOps Stack'}
              </button>
            ))}
          </div>

          {/* Theme & Help Buttons */}
          <div className={`w-px h-6 transition-colors duration-300 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />

          <button
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${isLight
              ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200 shadow-sm'
              : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 shadow-md'
              }`}
            title={isLight ? 'Toggle Dark Mode' : 'Toggle Light Mode'}
          >
            {isLight ? (
              <Moon className="w-4.5 h-4.5" />
            ) : (
              <Sun className="w-4.5 h-4.5" />
            )}
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('mermify-relaunch-tour'))}
            className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${isLight
              ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200 shadow-sm'
              : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 shadow-md'
              }`}
            title="Start Interactive Tour"
            data-testid="tour-relaunch-btn"
          >
            <HelpCircle className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Two-Panel Workspace Grid */}
      <main className={`flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 min-h-0 transition-colors duration-300 ${isLight ? 'bg-slate-100/50' : 'bg-slate-950'
        }`}>

        {/* Editor Area (Left Pane) */}
        <div className="h-full flex flex-col min-h-0 relative lg:col-span-1" data-testid="editor-pane">
          <Editor
            code={code}
            onChange={(val) => updateCode(val, false)}
            error={error}
            onReset={() => handleLoadPreset('workflow')}
            theme={theme}
          />


          {/* Conditional Floating Node Edit Properties Modal */}
          <Suspense fallback={null}>
            {editingNode && (
              <EditNodeModal
                key={editingNode.id}
                node={editingNode}
                onLabelChange={handleNodeLabelChange}
                onShapeChange={handleNodeShapeChange}
                onDelete={handleDeleteNode}
                onClose={handleCloseNodeModal}
                isLight={isLight}
              />
            )}
          </Suspense>

          {/* Conditional Floating Edge Edit Properties Modal */}
          <Suspense fallback={null}>
            {editingEdge && (
              <EditEdgeModal
                key={`${editingEdge.sourceId}-${editingEdge.targetId}`}
                edge={editingEdge}
                onLabelChange={handleEdgeLabelChange}
                onStyleChange={handleEdgeStyleChange}
                onDelete={handleDeleteConnection}
                onClose={handleCloseEdgeModal}
                isLight={isLight}
              />
            )}
          </Suspense>
        </div>

        {/* Visual Preview Canvas Area (Right Pane) */}
        <div className="h-full flex flex-col min-h-0 relative lg:col-span-2" data-testid="preview-pane">
          <Preview
            code={debouncedCode}
            onError={setError}
            onEditNode={setEditingNode}
            onDeleteNode={handleDeleteNodeById}
            onAddNodeClick={handleAddNode}
            onNodesParsed={handleNodesParsed}
            onEditEdge={setEditingEdge}
            onDeleteEdge={handleDeleteConnectionByEnds}
            onConnectNodes={(sourceId, targetId) => {
              const updatedCode = addNodeConnection(code, sourceId, targetId, '-->', '');
              updateCode(updatedCode, true);
            }}
            onConnectNewNode={handleConnectNewNode}
            theme={theme}
          />
        </div>
      </main>

      {/* Getting Started Tour Component */}
      <TourManager theme={theme} />
    </div>
  );
}
