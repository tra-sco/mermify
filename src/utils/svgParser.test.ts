import { describe, expect, test, vi } from 'vitest';
import {
  getSvgDimensions,
  extractNodeId,
  extractEdgeIds,
  getElementMidpoint,
  findClosestElement,
} from './svgParser';

describe('svgParser', () => {
  describe('getSvgDimensions', () => {
    test('returns parsed viewBox dimensions', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as unknown as SVGElement;
      svg.setAttribute('viewBox', '0 0 1200 800');
      const dimensions = getSvgDimensions(svg);
      expect(dimensions).toEqual({ width: 1200, height: 800 });
    });

    test('falls back to 800x600 if no viewBox is present', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as unknown as SVGElement;
      const dimensions = getSvgDimensions(svg);
      expect(dimensions).toEqual({ width: 800, height: 600 });
    });

    test('falls back to defaults if viewBox is malformed', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as unknown as SVGElement;
      svg.setAttribute('viewBox', '0 0 abc');
      const dimensions = getSvgDimensions(svg);
      expect(dimensions).toEqual({ width: 800, height: 600 });
    });
  });

  describe('extractNodeId', () => {
    test('extracts ID from classList starting with id-', () => {
      const el = document.createElement('div');
      el.classList.add('some-class', 'id-nodeA', 'another-class');
      expect(extractNodeId(el, 'render123')).toBe('nodeA');
    });

    test('extracts ID using activeRenderId prefix and flowchart pattern', () => {
      const el = document.createElement('div');
      el.id = 'render123-flowchart-nodeB-456';
      expect(extractNodeId(el, 'render123')).toBe('nodeB');
    });

    test('extracts ID using activeRenderId prefix plain pattern', () => {
      const el = document.createElement('div');
      el.id = 'render123-nodeC-789';
      expect(extractNodeId(el, 'render123')).toBe('nodeC');
    });

    test('extracts ID using flowchart fallback regex', () => {
      const el = document.createElement('div');
      el.id = 'flowchart-nodeD-999';
      expect(extractNodeId(el, '')).toBe('nodeD');
    });

    test('falls back to raw ID if no pattern matches', () => {
      const el = document.createElement('div');
      el.id = 'myNode';
      expect(extractNodeId(el, '')).toBe('myNode');
    });
  });

  describe('extractEdgeIds', () => {
    const mockNodes = [{ id: 'A' }, { id: 'B' }, { id: 'node_C' }, { id: 'node_D' }];

    test('extracts source and target from standard L_ prefix format', () => {
      const result = extractEdgeIds('some-element-L_A_B_1', mockNodes);
      expect(result).toEqual({ sourceId: 'A', targetId: 'B' });
    });

    test('extracts correctly when IDs contain underscores', () => {
      const result = extractEdgeIds('some-element-L_node_C_node_D_1', mockNodes);
      expect(result).toEqual({ sourceId: 'node_C', targetId: 'node_D' });
    });

    test('returns null if path ID does not match expected format', () => {
      expect(extractEdgeIds('some-random-id', mockNodes)).toBeNull();
    });
  });

  describe('getElementMidpoint', () => {
    test('calculates exact center coordinates of element client rect', () => {
      const el = document.createElement('div');
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        right: 300,
        top: 200,
        bottom: 400,
        width: 200,
        height: 200,
        x: 100,
        y: 200,
        toJSON: () => {},
      });

      const midpoint = getElementMidpoint(el);
      expect(midpoint).toEqual({ x: 200, y: 300 });
    });
  });

  describe('findClosestElement', () => {
    test('identifies the closest element in a list based on midpoint Euclidean distance', () => {
      const targetMid = { x: 100, y: 100 };

      const el1 = document.createElement('div');
      vi.spyOn(el1, 'getBoundingClientRect').mockReturnValue({
        left: 80, right: 120, top: 80, bottom: 120, // center (100, 100) -> dist = 0
        width: 40, height: 40, x: 80, y: 80, toJSON: () => {}
      });

      const el2 = document.createElement('div');
      vi.spyOn(el2, 'getBoundingClientRect').mockReturnValue({
        left: 200, right: 300, top: 200, bottom: 300, // center (250, 250) -> dist = ~212
        width: 100, height: 100, x: 200, y: 200, toJSON: () => {}
      });

      const result = findClosestElement(targetMid, [el2, el1]);
      expect(result.element).toBe(el1);
      expect(result.distance).toBe(0);
    });

    test('returns null if candidate list is empty', () => {
      const result = findClosestElement({ x: 100, y: 100 }, []);
      expect(result.element).toBeNull();
      expect(result.distance).toBe(Infinity);
    });
  });
});
