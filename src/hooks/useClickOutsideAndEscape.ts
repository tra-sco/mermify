import { useEffect, type RefObject } from 'react';

/**
 * React hook that triggers a callback when user clicks outside the referenced element or presses Escape.
 */
export function useClickOutsideAndEscape(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void
): void {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Small timeout delay prevents race conditions with buttons that open the modal
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [ref, onClose]);
}
