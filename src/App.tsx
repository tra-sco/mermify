import { useState, useEffect, useCallback } from 'react';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import type { OverlayNode } from './components/Preview';
import { PRESETS } from './constants/presets';
import type { PresetKey } from './constants/presets';
import { decompressCode } from './utils/urlCompression';
import { useDiagramState } from './hooks/useDiagramState';
import {
  updateNodeLabelAndShape,
  addNodeConnection,
  deleteNodeFromMermaid,
  updateConnectionInMermaid,
  deleteConnectionFromMermaid,
  detectNodeShapeAndLabel,
  detectConnectionStyle
} from './utils/mermaidParser';
import { Undo2, Redo2, Sun, Moon, HelpCircle } from 'lucide-react';
import { TourManager } from './components/TourManager';

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
  const [newNodeIdToEdit, setNewNodeIdToEdit] = useState<string | null>(null);

  const isEditingActive = !!editingNode;

  // Diagram document state hook
  const {
    code,
    debouncedCode,
    updateCode,
    undo,
    redo,
    history,
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
  const handleNodeLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setEditingNode((prev) => (prev && prev.id === nodeId ? { ...prev, label: newLabel } : prev));

    if (newLabel.trim() === '') {
      return;
    }

    const current = detectNodeShapeAndLabel(code, nodeId);
    const shapeId = current ? current.shapeId : 'rectangle';

    const updatedCode = updateNodeLabelAndShape(
      code,
      nodeId,
      newLabel,
      shapeId
    );
    updateCode(updatedCode, false);
  }, [code, updateCode]);

  // Node shape update callback
  const handleNodeShapeChange = useCallback((nodeId: string, newShapeId: string) => {
    const current = detectNodeShapeAndLabel(code, nodeId);
    const label = current ? current.label : `Node ${nodeId}`;

    const updatedCode = updateNodeLabelAndShape(
      code,
      nodeId,
      label,
      newShapeId
    );
    updateCode(updatedCode, true);
    setEditingNode(null);
  }, [code, updateCode]);

  // Node deletion callback
  const handleDeleteNodeById = useCallback((nodeId: string) => {
    const updatedCode = deleteNodeFromMermaid(code, nodeId);
    updateCode(updatedCode, true);
    if (editingNode?.id === nodeId) {
      setEditingNode(null);
    }
  }, [code, editingNode, updateCode]);

  // Connection inline label update callback
  const handleEdgeLabelChangeInline = useCallback((sourceId: string, targetId: string, newLabel: string) => {
    const currentStyle = detectConnectionStyle(code, sourceId, targetId);
    const updatedCode = updateConnectionInMermaid(
      code,
      sourceId,
      targetId,
      newLabel,
      currentStyle || '-->'
    );
    updateCode(updatedCode, false);
  }, [code, updateCode]);

  // Connection inline style update callback
  const handleEdgeStyleChangeInline = useCallback((sourceId: string, targetId: string, newStyle: string, currentLabel: string) => {
    const updatedCode = updateConnectionInMermaid(
      code,
      sourceId,
      targetId,
      currentLabel,
      newStyle
    );
    updateCode(updatedCode, true);
  }, [code, updateCode]);

  // Connection deletion callback
  const handleDeleteConnectionByEnds = useCallback((sourceId: string, targetId: string) => {
    const updatedCode = deleteConnectionFromMermaid(code, sourceId, targetId);
    updateCode(updatedCode, true);
  }, [code, updateCode]);

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
    setNewNodeIdToEdit(targetId);

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
    setNewNodeIdToEdit(nodeId);

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

          <a
            href="https://github.com/tra-sco/mermify"
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center justify-center ${isLight
              ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200 shadow-sm'
              : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 shadow-md'
              }`}
            title="GitHub Repository"
            data-testid="github-link"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4.5 h-4.5"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>

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
        </div>

        {/* Visual Preview Canvas Area (Right Pane) */}
        <div className="h-full flex flex-col min-h-0 relative lg:col-span-2" data-testid="preview-pane">
          <Preview
            code={debouncedCode}
            onError={setError}
            onEditNode={setEditingNode}
            activeNode={editingNode}
            onNodeLabelChange={handleNodeLabelChange}
            onNodeShapeChange={handleNodeShapeChange}
            onDeleteNode={handleDeleteNodeById}
            onAddNodeClick={handleAddNode}
            onNodesParsed={handleNodesParsed}
            onDeleteEdge={handleDeleteConnectionByEnds}
            onEdgeLabelChange={handleEdgeLabelChangeInline}
            onEdgeStyleChange={handleEdgeStyleChangeInline}
            onConnectNodes={(sourceId, targetId) => {
              const updatedCode = addNodeConnection(code, sourceId, targetId, '-->', '');
              updateCode(updatedCode, true);
            }}
            onConnectNewNode={handleConnectNewNode}
            newNodeIdToEdit={newNodeIdToEdit}
            onClearNewNodeIdToEdit={() => setNewNodeIdToEdit(null)}
            theme={theme}
          />
        </div>
      </main>

      {/* Getting Started Tour Component */}
      <TourManager theme={theme} />
    </div>
  );
}
