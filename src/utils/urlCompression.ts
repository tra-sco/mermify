import pako from 'pako';

/**
 * Compress raw code string to URL-safe base64 using deflate
 */
export function compressCode(code: string): string {
  try {
    const rawData = new TextEncoder().encode(code);
    const compressed = pako.deflate(rawData, { level: 9 });
    const binary = Array.from(compressed, (b) => String.fromCharCode(b)).join('');
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error('Failed to compress code:', e);
    return '';
  }
}

/**
 * Decompress base64 to raw code string using inflate
 */
export function decompressCode(encoded: string): string {
  try {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decompressed = pako.inflate(bytes);
    return new TextDecoder().decode(decompressed);
  } catch (e) {
    console.error('Failed to decompress code:', e);
    return '';
  }
}
