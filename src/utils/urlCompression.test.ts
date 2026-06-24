import { describe, expect, test } from 'vitest';
import { compressCode, decompressCode } from './urlCompression';

describe('urlCompression', () => {
  test('should correctly compress and decompress a basic string (round-trip)', () => {
    const original = 'Hello World!';
    const compressed = compressCode(original);
    expect(compressed).not.toBe(original);
    expect(compressed.length).toBeGreaterThan(0);
    
    const decompressed = decompressCode(compressed);
    expect(decompressed).toBe(original);
  });

  test('should correctly compress and decompress Mermaid code blocks', () => {
    const original = `flowchart TD
  A[Christmas] -->|Get money| B(Go shopping)
  B --> C{Let me think}
  C -->|One| D[Laptop]
  C -->|Two| E[iPhone]
  C -->|Three| F[Car]`;
    const compressed = compressCode(original);
    const decompressed = decompressCode(compressed);
    expect(decompressed).toBe(original);
  });

  test('should return empty string and not crash on compression errors', () => {
    // Force TextEncoder or pako to throw an error by mocking TextEncoder
    const originalEncoder = globalThis.TextEncoder;
    (globalThis as unknown as Record<string, unknown>).TextEncoder = class {
      encode() {
        throw new Error('Encoding failed');
      }
    };

    const originalConsoleError = console.error;
    let consoleCalled = false;
    console.error = () => {
      consoleCalled = true;
    };

    const compressed = compressCode('test');

    expect(compressed).toBe('');
    expect(consoleCalled).toBe(true);

    console.error = originalConsoleError;
    (globalThis as unknown as Record<string, unknown>).TextEncoder = originalEncoder;
  });

  test('should return empty string and not crash on invalid/malformed base64 decompression', () => {
    const originalConsoleError = console.error;
    let consoleCalled = false;
    console.error = () => {
      consoleCalled = true;
    };

    const decompressed = decompressCode('!!!!invalid_base64!!!');

    expect(decompressed).toBe('');
    expect(consoleCalled).toBe(true);

    console.error = originalConsoleError;
  });
});
