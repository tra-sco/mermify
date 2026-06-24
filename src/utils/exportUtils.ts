import { getSvgDimensions } from './svgParser';

/**
 * Serializes and triggers browser download of the diagram as an SVG file
 */
export function exportSVG(svgNode: SVGElement, filename: string = 'diagram.svg', isLight: boolean = false): void {
  const clonedSvg = svgNode.cloneNode(true) as SVGElement;
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedSvg.removeAttribute('style'); // Remove zoom-pan style transforms

  const { width, height } = getSvgDimensions(svgNode);
  clonedSvg.setAttribute('width', width.toString());
  clonedSvg.setAttribute('height', height.toString());

  // Create background rect matching editor theme so it's readable on light/dark backgrounds
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', '100%');
  bgRect.setAttribute('height', '100%');
  bgRect.setAttribute('fill', isLight ? '#ffffff' : '#0f172a');
  clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSvg);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Draws the SVG to an offscreen Canvas at high DPI and downloads/copies the resulting PNG
 */
export function processPNGAction(
  svgNode: SVGElement,
  action: 'download' | 'copy',
  isLight: boolean = false,
  onCopySuccess?: () => void,
  onCopyError?: (err: unknown) => void
): void {
  const clonedSvg = svgNode.cloneNode(true) as SVGElement;
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedSvg.removeAttribute('style');

  const { width, height } = getSvgDimensions(svgNode);
  clonedSvg.setAttribute('width', width.toString());
  clonedSvg.setAttribute('height', height.toString());

  // Create background rect in cloned SVG to ensure canvas render is solid and consistent
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', '100%');
  bgRect.setAttribute('height', '100%');
  bgRect.setAttribute('fill', isLight ? '#ffffff' : '#0f172a');
  clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clonedSvg);

  // Convert SVG to base64 Data URI to prevent Canvas Tainting security errors in Chromium
  const base64Svg = btoa(unescape(encodeURIComponent(svgString)));
  const svgUrl = `data:image/svg+xml;base64,${base64Svg}`;

  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    const scale = 2; // Render at 2x scale for sharp lines
    canvas.width = width * scale;
    canvas.height = height * scale;

    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = isLight ? '#ffffff' : '#0f172a'; // background matching editor theme
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.scale(scale, scale);
      context.drawImage(image, 0, 0, width, height);

      if (action === 'download') {
        try {
          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = 'diagram.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (err) {
          console.error('Failed to generate PNG data URL:', err);
        }
      } else if (action === 'copy') {
        try {
          canvas.toBlob((blob) => {
            if (blob) {
              const item = new ClipboardItem({ 'image/png': blob });
              navigator.clipboard.write([item]).then(() => {
                if (onCopySuccess) onCopySuccess();
              }).catch((err) => {
                console.error('Failed to copy PNG blob to clipboard:', err);
                if (onCopyError) onCopyError(err);
              });
            }
          }, 'image/png');
        } catch (err) {
          console.error('Failed to create PNG blob from canvas:', err);
          if (onCopyError) onCopyError(err);
        }
      }
    }
  };
  image.onerror = (e) => {
    console.error('Image load failed during PNG export:', e);
  };
  image.src = svgUrl;
}
