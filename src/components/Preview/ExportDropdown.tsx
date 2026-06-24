import { useState, useRef } from 'react';
import { Download, ChevronDown, Image as ImageIcon, Copy, FileCode, Check, Link } from 'lucide-react';
import { useClickOutsideAndEscape } from '../../hooks/useClickOutsideAndEscape';

interface ExportDropdownProps {
  copiedShare: boolean;
  onCopyShare: () => void;
  onExportSVG: () => void;
  onDownloadPNG: () => void;
  onCopyPNG: () => void;
  copiedPNG: boolean;
  theme?: 'light' | 'dark';
}

export function ExportDropdown({
  copiedShare,
  onCopyShare,
  onExportSVG,
  onDownloadPNG,
  onCopyPNG,
  copiedPNG,
  theme = 'dark',
}: ExportDropdownProps) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'light';

  useClickOutsideAndEscape(dropdownRef, () => setIsExportOpen(false));

  return (
    <div className="flex items-center space-x-2" data-testid="export-share-container">
      {/* Export Options Dropdown Menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsExportOpen(!isExportOpen)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer pointer-events-auto active:scale-95 ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-650 hover:text-slate-900 border-slate-200'
              : 'bg-slate-800 hover:bg-slate-750 text-slate-355 hover:text-slate-100 border-slate-750'
          }`}
        >
          {copiedPNG ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied PNG!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </>
          )}
        </button>

        {isExportOpen && (
          <div className={`absolute right-0 mt-1.5 w-44 border rounded-xl shadow-2xl overflow-hidden z-40 p-1 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-150 ${
            isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              onClick={() => {
                onDownloadPNG();
                setIsExportOpen(false);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-colors cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-350 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Download PNG</span>
            </button>
            <button
              onClick={() => {
                onCopyPNG();
                setIsExportOpen(false);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-colors cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-350 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
              <span>Copy PNG to Clipboard</span>
            </button>
            <button
              onClick={() => {
                onExportSVG();
                setIsExportOpen(false);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-colors cursor-pointer ${
                isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-350 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download SVG</span>
            </button>
          </div>
        )}
      </div>

      {/* Share Link Button */}
      <button
        onClick={onCopyShare}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer pointer-events-auto active:scale-95 ${
          isLight
            ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-655 hover:text-slate-900 border-slate-200'
            : 'bg-slate-800 hover:bg-slate-750 text-slate-355 hover:text-slate-100 border-slate-750'
        }`}
        title="Copy compressed shareable URL to clipboard"
      >
        {copiedShare ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">Copied!</span>
          </>
        ) : (
          <>
            <Link className="w-3.5 h-3.5" />
            <span>Share Link</span>
          </>
        )}
      </button>
    </div>
  );
}
