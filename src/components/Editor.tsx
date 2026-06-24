import { Editor as MonacoEditor } from '@monaco-editor/react';
import { AlertCircle, CheckCircle2, Copy, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { editor } from 'monaco-editor';

interface EditorProps {
  code: string;
  onChange: (value: string) => void;
  error: string | null;
  onReset: () => void;
  theme?: 'light' | 'dark';
}

export function Editor({ code, onChange, error, onReset, theme = 'dark' }: EditorProps) {
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const sentValuesRef = useRef<Set<string>>(new Set());
  const isProgrammaticUpdateRef = useRef(false);

  // Sync external changes (presets, modal edits, etc.) to the editor
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      
      // If this value is one that this editor itself generated, ignore the update
      if (sentValuesRef.current.has(code)) {
        sentValuesRef.current.delete(code);
        return;
      }

      if (code !== currentValue) {
        isProgrammaticUpdateRef.current = true;
        editorRef.current.setValue(code);
        isProgrammaticUpdateRef.current = false;
      }
    }
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleEditorChange = (val: string | undefined) => {
    if (isProgrammaticUpdateRef.current) return;

    const value = val || '';
    if (sentValuesRef.current.size > 100) {
      sentValuesRef.current.clear();
    }
    sentValuesRef.current.add(value);
    onChange(value);
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    // Ensure the editor has the latest code upon mount
    if (editor.getValue() !== code) {
      isProgrammaticUpdateRef.current = true;
      editor.setValue(code);
      isProgrammaticUpdateRef.current = false;
    }
  };

  return (
    <div className={`flex flex-col h-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 border ${
      theme === 'light'
        ? 'bg-white border-slate-200 text-slate-900'
        : 'bg-slate-900 border-slate-800 text-slate-100'
    }`}>
      {/* Editor Header Bar */}
      <div className={`flex items-center justify-between px-6 py-4 border-b backdrop-blur-md transition-colors duration-300 ${
        theme === 'light'
          ? 'bg-slate-50/60 border-slate-200/80'
          : 'bg-slate-950/60 border-slate-800/80'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 hover:scale-110 transition-transform cursor-pointer"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500 hover:scale-110 transition-transform cursor-pointer"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 hover:scale-110 transition-transform cursor-pointer"></span>
          </div>
          <span className={`text-sm font-semibold tracking-wider transition-colors duration-300 ${
            theme === 'light' ? 'text-slate-700' : 'text-slate-300'
          }`}>code.mermaid</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              theme === 'light'
                ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Copy Diagram Code"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={onReset}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              theme === 'light'
                ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Reset to Template"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 min-h-0 relative">
        <MonacoEditor
          height="100%"
          language="markdown" // Using markdown syntax highlighting as Monaco lacks a native default Mermaid mode, which works great for syntax colors
          theme={theme === 'light' ? 'vs' : 'vs-dark'}
          defaultValue={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          loading={
            <div className={`absolute inset-0 flex flex-col items-center justify-center space-y-3 ${
              theme === 'light' ? 'bg-white text-slate-500' : 'bg-slate-900 text-slate-400'
            }`}>
              <div className="w-6 h-6 border-2 border-slate-500 border-t-indigo-500 rounded-full animate-spin"></div>
              <span className="text-xs font-medium">Mounting Monaco Editor...</span>
            </div>
          }
          options={{
            minimap: { enabled: false },
            wordWrap: 'on',
            lineNumbers: 'on',
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            fontLigatures: true,
            tabSize: 4,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              useShadows: false,
            },
          }}
        />
      </div>

      {/* Status Bar */}
      <div className={`flex items-center justify-between px-6 py-3.5 border-t text-xs font-medium transition-colors duration-300 ${
        theme === 'light'
          ? 'bg-slate-50/80 border-slate-200/80 text-slate-600'
          : 'bg-slate-950/80 border-slate-800/80 text-slate-400'
      }`}>
        <div className="flex items-center space-x-2">
          {error ? (
            <div className="flex items-center space-x-1.5 text-rose-400 animate-pulse">
              <AlertCircle className="w-4 h-4" />
              <span>Invalid Mermaid Syntax</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Syntax Ready</span>
            </div>
          )}
        </div>
        <div className="text-slate-500">
          React + Tailwind v4 + Monaco
        </div>
      </div>

      {/* Error Details Overlay */}
      {error && (
        <div className={`px-6 py-3 border-t text-xs font-mono break-all max-h-24 overflow-y-auto transition-colors duration-300 ${
          theme === 'light'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-rose-950/30 border-rose-900/40 text-rose-300'
        }`}>
          {error}
        </div>
      )}
    </div>
  );
}
