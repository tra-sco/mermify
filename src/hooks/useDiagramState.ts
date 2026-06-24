import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { compressCode } from '../utils/urlCompression';

export function useDiagramState(initialCode: string, isEditingActive: boolean) {
  const [code, setCode] = useState(initialCode);
  
  // Sync debounced code to prevent thrashing Monaco on every character
  const debouncedCode = useDebounce(code, 350);

  // History state for undo/redo
  const [history, setHistory] = useState<{
    past: string[];
    present: string;
    future: string[];
  }>(() => ({
    past: [],
    present: initialCode,
    future: [],
  }));

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      
      setCode(previous);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      
      setCode(next);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const updateCode = useCallback((newVal: string, isDiscreteAction: boolean = false) => {
    setCode(newVal);
    if (isDiscreteAction) {
      setHistory((prev) => ({
        past: [...prev.past, prev.present],
        present: newVal,
        future: [],
      }));
    }
  }, []);

  // Sync debounced code to history stack when user pauses typing
  useEffect(() => {
    if (debouncedCode === code && debouncedCode !== history.present) {
      // Do not record intermediate typing states to history while editing in modals
      if (isEditingActive) {
        return;
      }
      const frameId = window.requestAnimationFrame(() => {
        setHistory((prev) => {
          if (prev.present === debouncedCode) return prev;
          return {
            past: [...prev.past, prev.present],
            present: debouncedCode,
            future: [],
          };
        });
      });
      return () => window.cancelAnimationFrame(frameId);
    }
  }, [debouncedCode, code, history.present, isEditingActive]);

  // Sync debounced code to URL query parameter
  useEffect(() => {
    try {
      const encoded = compressCode(debouncedCode);
      const url = new URL(window.location.href);
      if (encoded) {
        url.searchParams.set('code', encoded);
      } else {
        url.searchParams.delete('code');
      }
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.error('Failed to sync code to URL:', e);
    }
  }, [debouncedCode]);

  return {
    code,
    setCode,
    debouncedCode,
    updateCode,
    undo,
    redo,
    history,
    setHistory,
  };
}
