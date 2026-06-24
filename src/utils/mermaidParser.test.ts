import { describe, expect, test } from 'vitest';
import {
  detectNodeShapeAndLabel,
  updateNodeLabelAndShape,
  addNodeConnection,
  deleteNodeFromMermaid,
  updateConnectionInMermaid,
  deleteConnectionFromMermaid,
  detectConnectionStyle,
} from './mermaidParser';

describe('mermaidParser', () => {
  describe('detectNodeShapeAndLabel', () => {
    test('detects rectangle shape and simple label', () => {
      const code = 'flowchart TD\n  A[My Rectangle] --> B';
      const result = detectNodeShapeAndLabel(code, 'A');
      expect(result).not.toBeNull();
      expect(result?.shapeId).toBe('rectangle');
      expect(result?.label).toBe('My Rectangle');
    });

    test('detects stadium shape and quotes', () => {
      const code = 'flowchart LR\n  B(["Hello World"])';
      const result = detectNodeShapeAndLabel(code, 'B');
      expect(result).not.toBeNull();
      expect(result?.shapeId).toBe('stadium');
      expect(result?.label).toBe('Hello World');
    });

    test('detects circle shape', () => {
      const code = 'flowchart TD\n  C((Round Circle))';
      const result = detectNodeShapeAndLabel(code, 'C');
      expect(result?.shapeId).toBe('circle');
      expect(result?.label).toBe('Round Circle');
    });

    test('returns null if node is not declared with a shape', () => {
      const code = 'flowchart TD\n  A --> B';
      expect(detectNodeShapeAndLabel(code, 'A')).toBeNull();
    });
  });

  describe('updateNodeLabelAndShape', () => {
    test('updates existing shape and label declaration', () => {
      const code = 'flowchart TD\n  A[Old Label] --> B';
      const result = updateNodeLabelAndShape(code, 'A', 'New Label', 'circle');
      expect(result).toBe('flowchart TD\n  A((New Label)) --> B');
    });

    test('converts plain ID to declaration at start of line', () => {
      const code = 'flowchart TD\n  A --> B';
      const result = updateNodeLabelAndShape(code, 'A', 'New A', 'round');
      expect(result).toBe('flowchart TD\n  A(New A) --> B');
    });

    test('converts plain ID after arrow connection', () => {
      const code = 'flowchart TD\n  A --> B';
      const result = updateNodeLabelAndShape(code, 'B', 'New B', 'hexagon');
      expect(result).toBe('flowchart TD\n  A --> B{{New B}}');
    });

    test('does not modify keywords like flowchart or graph', () => {
      const code = 'flowchart TD\n  A --> B';
      const result = updateNodeLabelAndShape(code, 'flowchart', 'new-flowchart');
      expect(result).toBe(code);
    });

    test('automatically quotes labels with special characters', () => {
      const code = 'flowchart TD\n  A[Old] --> B';
      const result = updateNodeLabelAndShape(code, 'A', 'Hello [World]');
      expect(result).toBe('flowchart TD\n  A["Hello [World]"] --> B');
    });

    test('appends node declaration as fallback if not matched structurally', () => {
      const code = 'flowchart TD\n  X --> Y';
      const result = updateNodeLabelAndShape(code, 'Z', 'Node Z', 'stadium');
      expect(result).toBe('flowchart TD\n  X --> Y\n    Z([Node Z])\n');
    });
  });

  describe('addNodeConnection', () => {
    test('appends basic connection line at the end', () => {
      const code = 'flowchart TD\n  A[Node A]';
      const result = addNodeConnection(code, 'A', 'B');
      expect(result.trim()).toBe('flowchart TD\n  A[Node A]\n    A --> B');
    });

    test('appends connection with customized link style and edge label', () => {
      const code = 'flowchart TD\n  A[Node A]';
      const result = addNodeConnection(code, 'A', 'B', '-.->', 'Active link');
      expect(result.trim()).toBe('flowchart TD\n  A[Node A]\n    A -. Active link .-> B');
    });

    test('appends connection with custom target label and shape', () => {
      const code = 'flowchart TD\n  A[Node A]';
      const result = addNodeConnection(code, 'A', 'B', '==>', 'Bold link', 'Label B', 'database');
      expect(result.trim()).toBe('flowchart TD\n  A[Node A]\n    A ==>|Bold link| B[(Label B)]');
    });
  });

  describe('deleteNodeFromMermaid', () => {
    test('deletes standalone line declaration', () => {
      const code = 'flowchart TD\n  A[Node A]\n  B[Node B]';
      const result = deleteNodeFromMermaid(code, 'A');
      expect(result.trim()).toBe('flowchart TD\n  B[Node B]');
    });

    test('deletes simple connection lines referencing the node', () => {
      const code = 'flowchart TD\n  A --> B\n  B --> C';
      const result = deleteNodeFromMermaid(code, 'B');
      // "A --> B" becomes just "A" (since A isn't referenced elsewhere, it gets kept as declaration if it had a label, or deleted if plain ID and referenced elsewhere. Since A is a plain ID not referenced elsewhere, it gets kept or discarded depending on isNodeIdReferencedElsewhere. A is not referenced elsewhere, so it is kept as A. B --> C becomes C since C is not referenced elsewhere)
      expect(result.split('\n').map(l => l.trim()).filter(Boolean)).toEqual([
        'flowchart TD',
        'A',
        'C'
      ]);
    });

    test('splits and reconstructs connection chains', () => {
      const code = 'flowchart TD\n  A --> B --> C';
      const result = deleteNodeFromMermaid(code, 'B');
      // When B is deleted, "A --> B --> C" splits.
      // Left side: A (kept if not referenced elsewhere).
      // Right side: C (kept if not referenced elsewhere).
      expect(result.split('\n').map(l => l.trim()).filter(Boolean)).toEqual([
        'flowchart TD',
        'A',
        'C'
      ]);
    });

    test('preserves comments on rewritten lines', () => {
      const code = 'flowchart TD\n  A --> B %% Some comment';
      const result = deleteNodeFromMermaid(code, 'B');
      expect(result.includes('%% Some comment')).toBe(true);
    });
  });

  describe('updateConnectionInMermaid', () => {
    test('updates connection label and style', () => {
      const code = 'flowchart TD\n  A -->|Old Label| B';
      const result = updateConnectionInMermaid(code, 'A', 'B', 'New Label', '==>');
      expect(result).toBe('flowchart TD\n  A ==>|New Label| B');
    });

    test('updates simple connection to style without label', () => {
      const code = 'flowchart TD\n  A --> B';
      const result = updateConnectionInMermaid(code, 'A', 'B', '', '---');
      expect(result).toBe('flowchart TD\n  A --- B');
    });

    test('returns original code if connection not found', () => {
      const code = 'flowchart TD\n  A --> B';
      const result = updateConnectionInMermaid(code, 'X', 'Y', 'Label', '-->');
      expect(result).toBe(code);
    });
  });

  describe('deleteConnectionFromMermaid', () => {
    test('deletes standard connection line completely', () => {
      const code = 'flowchart TD\n  A --> B\n  C --> D';
      const result = deleteConnectionFromMermaid(code, 'A', 'B');
      expect(result.split('\n').map(l => l.trim()).filter(Boolean)).toEqual([
        'flowchart TD',
        'A',
        'B',
        'C --> D'
      ]);
    });

    test('splits a chain connection line on delete', () => {
      const code = 'flowchart TD\n  A --> B --> C';
      const result = deleteConnectionFromMermaid(code, 'A', 'B');
      // Splitting "A --> B --> C" at A --> B leaves:
      // Left side: A (kept since not referenced elsewhere)
      // Right side: B --> C (kept as connection)
      expect(result.split('\n').map(l => l.trim()).filter(Boolean)).toEqual([
        'flowchart TD',
        'A',
        'B --> C'
      ]);
    });
  });

  describe('detectConnectionStyle', () => {
    test('detects link styles correctly', () => {
      expect(detectConnectionStyle('A --> B', 'A', 'B')).toBe('-->');
      expect(detectConnectionStyle('A --- B', 'A', 'B')).toBe('---');
      expect(detectConnectionStyle('A ==> B', 'A', 'B')).toBe('==>');
      expect(detectConnectionStyle('A -.-> B', 'A', 'B')).toBe('-.->');
      expect(detectConnectionStyle('A -. label .-> B', 'A', 'B')).toBe('-.->');
    });

    test('falls back to standard arrow style if not found', () => {
      expect(detectConnectionStyle('A --> B', 'X', 'Y')).toBe('-->');
    });
  });
});
