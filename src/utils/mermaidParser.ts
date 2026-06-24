export interface NodeShape {
  id: string;
  name: string;
  start: string;
  end: string;
}

// Helper to escape special regex characters safely without useless escape warnings
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// All standard Mermaid flowchart shape delimiters
export const NODE_SHAPES: NodeShape[] = [
  { id: 'rectangle', name: 'Rectangle', start: '[', end: ']' },
  { id: 'round', name: 'Round', start: '(', end: ')' },
  { id: 'stadium', name: 'Stadium', start: '([', end: '])' },
  { id: 'subroutine', name: 'Subroutine', start: '[[', end: ']]' },
  { id: 'database', name: 'Database', start: '[(', end: ')]' },
  { id: 'circle', name: 'Circle', start: '((', end: '))' },
  { id: 'hexagon', name: 'Hexagon', start: '{{', end: '}}' },
  { id: 'rhombus', name: 'Rhombus', start: '{', end: '}' },
  { id: 'asymmetric', name: 'Asymmetric', start: '>', end: ']' },
  { id: 'parallelogram', name: 'Parallelogram', start: '[/', end: '/]' },
  { id: 'parallelogram_alt', name: 'Parallelogram Alt', start: '[\\', end: '\\]' },
];

interface DetectedNode {
  shapeId: string;
  label: string;
  rawMatch: string;
}

/**
 * Searches the Mermaid code for a specific node ID declaration and extracts its current shape and label.
 * Looks for nodeId followed by shape delimiters.
 */
export function detectNodeShapeAndLabel(code: string, nodeId: string): DetectedNode | null {
  // Sort by start delimiter length descending to prevent matching '[' before '([', etc.
  const sortedShapes = [...NODE_SHAPES].sort((a, b) => b.start.length - a.start.length);

  for (const shape of sortedShapes) {
    const escapedStart = escapeRegExp(shape.start);
    const escapedEnd = escapeRegExp(shape.end);

    // Matches: nodeId followed by optional space, start delimiter, optional quote, any text (lazy), optional quote, end delimiter
    // Example: A(( "Hello World" )) or A[Hello]
    const regex = new RegExp(`\\b${nodeId}\\s*${escapedStart}(?:"([^"]*)"|([^]*?))${escapedEnd}`);
    const match = code.match(regex);
    
    if (match) {
      const label = match[1] !== undefined ? match[1] : match[2] || '';
      return {
        shapeId: shape.id,
        label: label.trim(),
        rawMatch: match[0],
      };
    }
  }
  
  return null;
}

/**
 * Updates a node's label and/or shape in the raw Mermaid code.
 * If the node already has a shape declaration, it mutates it.
 * If the node only appears as a plain ID (e.g. A --> B), it converts the first instance to a shape declaration (e.g. A[Label] --> B).
 * Restricts replacement of plain ID references to valid structural positions (line start or after an arrow)
 * to avoid matching ID names inside text labels or edge labels.
 */
export function updateNodeLabelAndShape(
  code: string,
  nodeId: string,
  newLabel: string,
  newShapeId?: string
): string {
  const current = detectNodeShapeAndLabel(code, nodeId);
  
  // Resolve target shape (default to current shape if not specified, otherwise rectangle)
  const targetShapeId = newShapeId || (current ? current.shapeId : 'rectangle');
  const targetShape = NODE_SHAPES.find(s => s.id === targetShapeId) || NODE_SHAPES[0];

  // Escape double quotes inside the label if they exist
  const needsQuotes = /["()[\]{}]/.test(newLabel);
  const formattedLabel = needsQuotes ? `"${newLabel.replace(/"/g, '\\"')}"` : newLabel;
  const replacementStr = `${nodeId}${targetShape.start}${formattedLabel}${targetShape.end}`;

  if (current) {
    // If the node already has an explicit shape declaration, replace the exact match
    return code.replace(current.rawMatch, replacementStr);
  } else {
    // If the node is just a plain word in the code (e.g. in "A --> B")
    const keywords = ['graph', 'flowchart', 'subgraph', 'end', 'direction', 'TB', 'TD', 'BT', 'RL', 'LR'];
    if (keywords.includes(nodeId)) {
      return code; // Do not replace keywords
    }

    const lines = code.split('\n');
    let replaced = false;

    // Pattern matches start of node declaration on a line: e.g. A or A --> B
    const patternStart = new RegExp(`^(\\s*)\\b(${nodeId})\\b`);
    // Pattern matches node following an arrow connection: e.g. --> A or -->|label| A
    const patternArrow = new RegExp(`((?:-->|---|-.->|==>)\\s*(?:\\|[^|]*\\|)?\\s*)\\b(${nodeId})\\b`);

    const updatedLines = lines.map((line) => {
      if (replaced) return line;

      const trimmed = line.trim();
      if (
        trimmed.startsWith('flowchart') ||
        trimmed.startsWith('graph') ||
        trimmed === 'end' ||
        trimmed.startsWith('subgraph')
      ) {
        return line;
      }

      // Try replacing at start of line
      if (patternStart.test(line)) {
        replaced = true;
        return line.replace(patternStart, (_match, space) => {
          return `${space}${replacementStr}`;
        });
      }

      // Try replacing after connection arrow
      if (patternArrow.test(line)) {
        replaced = true;
        return line.replace(patternArrow, (_match, arrowPart) => {
          return `${arrowPart}${replacementStr}`;
        });
      }

      return line;
    });

    if (replaced) {
      return updatedLines.join('\n');
    }

    // Fallback: If not found in the code in structural positions, append it as a new line
    const trimmed = code.trimEnd();
    return `${trimmed}\n    ${replacementStr}\n`;
  }
}

/**
 * Appends a new node connection (edge) to the Mermaid code.
 * Supports choosing the edge style and adding optional labels to the edge or a new target node.
 */
export function addNodeConnection(
  code: string,
  sourceId: string,
  targetId: string,
  edgeStyle: string = '-->',
  edgeLabel: string = '',
  targetLabel: string = '',
  targetShapeId: string = 'rectangle'
): string {
  // Format target ID block with label/shape if a target label is provided
  let targetPart = targetId;
  if (targetLabel) {
    const shape = NODE_SHAPES.find(s => s.id === targetShapeId) || NODE_SHAPES[0];
    const needsQuotes = /["()[\]{}]/.test(targetLabel);
    const formattedLabel = needsQuotes ? `"${targetLabel.replace(/"/g, '\\"')}"` : targetLabel;
    targetPart = `${targetId}${shape.start}${formattedLabel}${shape.end}`;
  }

  // Format edge syntax with optional label
  let edgeStr = edgeStyle;
  if (edgeLabel) {
    if (edgeStyle === '-->') {
      edgeStr = `-->|${edgeLabel}|`;
    } else if (edgeStyle === '---') {
      edgeStr = `---|${edgeLabel}|`;
    } else if (edgeStyle === '-.->') {
      edgeStr = `-. ${edgeLabel} .->`;
    } else if (edgeStyle === '==>') {
      edgeStr = `==>|${edgeLabel}|`;
    } else {
      edgeStr = `${edgeStyle}|${edgeLabel}|`;
    }
  }

  const newLine = `    ${sourceId} ${edgeStr} ${targetPart}`;

  // Append new connection line
  const trimmed = code.trimEnd();
  return `${trimmed}\n${newLine}\n`;
}

/**
 * Removes a node and all of its connections from the Mermaid code.
 * Highly precise: instead of deleting entire lines, it breaks down connection chains
 * (e.g. A --> B[Node B]) and preserves other nodes on the line by converting the remaining
 * elements into standalone declarations or sub-chains.
 */
export function deleteNodeFromMermaid(code: string, nodeId: string): string {
  const lines = code.split('\n');

  const updatedLines = lines.flatMap((line, idx) => {
    const trimmed = line.trim();
    
    // Ignore lines that are diagram headings or structural markers
    if (
      trimmed.startsWith('flowchart') ||
      trimmed.startsWith('graph') ||
      trimmed === 'end' ||
      trimmed.startsWith('subgraph')
    ) {
      return [line];
    }

    // Strip comments to isolate the code part
    const commentMatch = line.match(/(%%.*)/);
    const comment = commentMatch ? commentMatch[1] : '';
    const codePart = line.replace(/%%.*/g, '');

    if (!codePart.trim()) {
      return [line]; // Keep empty lines or pure comments intact
    }

    // Rewrite this connection line to remove references to nodeId
    const rewritten = rewriteConnectionLine(codePart, nodeId, lines, idx);

    // If something remains, return the rewritten line(s) (with comments appended to the first line if applicable)
    if (rewritten.length > 0) {
      if (comment) {
        rewritten[0] = `${rewritten[0]} ${comment}`;
      }
      return rewritten;
    }

    // If nothing remains of this line, filter it out completely
    return [];
  });

  return updatedLines.join('\n');
}

/**
 * Checks if a node ID is structurally referenced in any lines other than the one currently being rewritten.
 */
function isNodeIdReferencedElsewhere(
  allLines: string[],
  currentLineIndex: number,
  nodeId: string
): boolean {
  const arrowRegex = /\s*(?:==>|-->|---|-.->)\s*(?:\|[^|]*\|)?\s*/g;

  for (let idx = 0; idx < allLines.length; idx++) {
    if (idx === currentLineIndex) continue;
    const line = allLines[idx].trim();

    if (
      line.startsWith('flowchart') ||
      line.startsWith('graph') ||
      line === 'end' ||
      line.startsWith('subgraph')
    ) {
      continue;
    }

    const codePart = line.replace(/%%.*/g, '').trim();
    if (!codePart) continue;

    const parts = codePart.split(arrowRegex);
    for (const part of parts) {
      if (extractNodeIdFromPart(part) === nodeId) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Splits a connection line (e.g., A --> B[Label] --> C) into pieces, removes any piece matching
 * the target node ID, and reconstructs the remaining segments.
 */
function rewriteConnectionLine(
  line: string,
  nodeIdToDelete: string,
  allLines: string[],
  currentLineIndex: number
): string[] {
  const indentMatch = line.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : '';

  // Match all standard flowchart arrows (with optional edge labels)
  const arrowRegex = /\s*(?:==>|-->|---|-.->)\s*(?:\|[^|]*\|)?\s*/g;
  const parts = line.trim().split(arrowRegex);
  const arrowMatches = line.match(arrowRegex) || [];

  const keepFlags = parts.map(part => extractNodeIdFromPart(part) !== nodeIdToDelete);

  // If all parts are deleted, return empty
  if (keepFlags.every(flag => !flag)) {
    return [];
  }

  // If no parts are deleted, return original line unmodified
  if (keepFlags.every(flag => flag)) {
    return [line];
  }

  const resultLines: string[] = [];
  let currentGroup: string[] = [];
  let currentArrows: string[] = [];

  const handleGroupCompletion = (group: string[], arrows: string[]) => {
    if (group.length > 1) {
      resultLines.push(indent + reconstructChain(group, arrows));
    } else if (group.length === 1) {
      const part = group[0];
      const nodeId = extractNodeIdFromPart(part);
      const isPlainId = part.trim() === nodeId;
      
      // If it contains custom shape/label, or if it is a plain ID not defined anywhere else, keep it
      if (!isPlainId || !isNodeIdReferencedElsewhere(allLines, currentLineIndex, nodeId)) {
        resultLines.push(indent + part);
      }
    }
  };

  for (let i = 0; i < parts.length; i++) {
    if (keepFlags[i]) {
      currentGroup.push(parts[i]);
      if (i > 0 && keepFlags[i - 1]) {
        currentArrows.push(arrowMatches[i - 1]);
      }
    } else {
      if (currentGroup.length > 0) {
        handleGroupCompletion(currentGroup, currentArrows);
        currentGroup = [];
        currentArrows = [];
      }
    }
  }

  if (currentGroup.length > 0) {
    handleGroupCompletion(currentGroup, currentArrows);
  }

  return resultLines;
}

/**
 * Extracts the node ID prefix from a shape definition part (e.g., "A[Label]" -> "A")
 */
function extractNodeIdFromPart(part: string): string {
  const trimmed = part.trim();
  const matches = trimmed.match(/^([a-zA-Z0-9_-]+)/);
  return matches ? matches[1] : trimmed;
}

/**
 * Joins parts and arrows back into a Mermaid flowchart statement
 */
function reconstructChain(parts: string[], arrows: string[]): string {
  let chain = parts[0];
  for (let i = 1; i < parts.length; i++) {
    chain += (arrows[i - 1] || ' --> ') + parts[i];
  }
  return chain;
}

/**
 * Updates a connection's label and style in the raw Mermaid code.
 */
export function updateConnectionInMermaid(
  code: string,
  sourceId: string,
  targetId: string,
  newLabel: string,
  newStyle: string
): string {
  const escapedSource = escapeRegExp(sourceId);
  const escapedTarget = escapeRegExp(targetId);

  // Match sourceId, followed by any shape/delimiters (group 1), then the connection arrow/label (group 2), and targetId
  const regex = new RegExp(
    `\\b${escapedSource}\\b([^\\n]*?)(\\s*(?:-->|---|-.->|==>|-[.-]+.+?[.-]+>)\\s*(?:\\|[^|]*\\|)?\\s*)\\b${escapedTarget}\\b`
  );
  
  const match = code.match(regex);
  if (!match) return code; // Fallback if connection not found

  // Format new connector
  let newConnector: string;
  if (newStyle === '-->') {
    newConnector = newLabel ? ` -->|${newLabel}| ` : ` --> `;
  } else if (newStyle === '---') {
    newConnector = newLabel ? ` ---|${newLabel}| ` : ` --- `;
  } else if (newStyle === '-.->') {
    newConnector = newLabel ? ` -. ${newLabel} .-> ` : ` -.-> `;
  } else if (newStyle === '==>') {
    newConnector = newLabel ? ` ==>|${newLabel}| ` : ` ==> `;
  } else {
    newConnector = newLabel ? ` ${newStyle}|${newLabel}| ` : ` ${newStyle} `;
  }

  // Preserve the matched source node shape (group 1)
  const replacement = `${sourceId}${match[1]}${newConnector}${targetId}`;
  return code.replace(match[0], replacement);
}

/**
 * Removes a specific connection between sourceId and targetId from the Mermaid code.
 * Splits connection chains if needed to keep remaining nodes valid.
 */
export function deleteConnectionFromMermaid(
  code: string,
  sourceId: string,
  targetId: string
): string {
  const lines = code.split('\n');
  const escapedSource = escapeRegExp(sourceId);
  const escapedTarget = escapeRegExp(targetId);
  const regex = new RegExp(
    `\\b${escapedSource}\\b([^\\n]*?)(\\s*(?:-->|---|-.->|==>|-[.-]+.+?[.-]+>)\\s*(?:\\|[^|]*\\|)?\\s*)\\b${escapedTarget}\\b`
  );

  let replaced = false;

  const updatedLines = lines.flatMap((line, idx) => {
    if (replaced || !regex.test(line)) {
      return [line];
    }

    replaced = true;
    const trimmed = line.trim();

    // Check if there are other arrows on the line
    const arrowRegex = /\s*(?:==>|-->|---|-.->)\s*(?:\|[^|]*\|)?\s*/g;
    const arrowMatches = trimmed.match(arrowRegex) || [];

    // It's a chain connection line, e.g. A --> B --> C
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';

    const parts = trimmed.split(arrowRegex);

    // Find the adjacent parts matching sourceId and targetId
    let skipIndex = -1;
    for (let i = 0; i < parts.length - 1; i++) {
      const currentId = extractNodeIdFromPart(parts[i]);
      const nextId = extractNodeIdFromPart(parts[i + 1]);
      if (currentId === sourceId && nextId === targetId) {
        skipIndex = i;
        break;
      }
    }

    if (skipIndex === -1) {
      return [line]; // Fallback if match fails structurally
    }

    // Split the chain into two separate lines: parts before skipIndex, and parts after skipIndex + 1
    const beforeParts = parts.slice(0, skipIndex + 1);
    const beforeArrows = arrowMatches.slice(0, skipIndex);

    const afterParts = parts.slice(skipIndex + 1);
    const afterArrows = arrowMatches.slice(skipIndex + 1);

    const keepPart = (part: string) => {
      const nodeId = extractNodeIdFromPart(part);
      const isPlainId = part.trim() === nodeId;
      return !isPlainId || !isNodeIdReferencedElsewhere(lines, idx, nodeId);
    };

    const linesToReturn: string[] = [];
    if (beforeParts.length > 1) {
      linesToReturn.push(indent + reconstructChain(beforeParts, beforeArrows));
    } else if (beforeParts.length === 1 && keepPart(beforeParts[0])) {
      linesToReturn.push(indent + beforeParts[0]);
    }

    if (afterParts.length > 1) {
      linesToReturn.push(indent + reconstructChain(afterParts, afterArrows));
    } else if (afterParts.length === 1 && keepPart(afterParts[0])) {
      linesToReturn.push(indent + afterParts[0]);
    }

    return linesToReturn;
  });

  return updatedLines.join('\n');
}

/**
 * Detects the connector style of the edge between sourceId and targetId in the raw code.
 * Returns default "-->" if not found.
 */
export function detectConnectionStyle(code: string, sourceId: string, targetId: string): string {
  const escapedSource = escapeRegExp(sourceId);
  const escapedTarget = escapeRegExp(targetId);
  const regex = new RegExp(
    `\\b${escapedSource}\\b([^\\n]*?)(\\s*(?:-->|---|-.->|==>|-[.-]+.+?[.-]+>)\\s*(?:\\|[^|]*\\|)?\\s*)\\b${escapedTarget}\\b`
  );
  
  const match = code.match(regex);
  if (match) {
    const connector = match[2].trim();
    if (connector.includes('==>')) return '==>';
    if (connector.includes('-.->') || connector.includes('.-')) return '-.->'; // Match either -.-> or dotted link with label
    if (connector.includes('---')) return '---';
    if (connector.includes('-->')) return '-->';
  }
  return '-->';
}
