export interface Point {
  x: number;
  y: number;
}

/**
 * Extracts natural layout width and height dimensions from SVG viewBox or default fallbacks
 */
export function getSvgDimensions(svgNode: SVGElement): { width: number; height: number } {
  const viewBoxAttr = svgNode.getAttribute('viewBox');
  let width = 800;
  let height = 600;
  if (viewBoxAttr) {
    const parts = viewBoxAttr.split(/[\s,]+/);
    if (parts.length === 4) {
      width = parseFloat(parts[2]) || width;
      height = parseFloat(parts[3]) || height;
    }
  }
  return { width, height };
}

/**
 * Extracts Node ID from node element's classList or fallback ID conventions
 */
export function extractNodeId(nodeEl: Element, activeRenderId: string): string {
  const idClass = Array.from(nodeEl.classList).find((c) => c.startsWith('id-'));
  if (idClass) {
    return idClass.replace(/^id-/, '');
  }

  if (activeRenderId && nodeEl.id.startsWith(activeRenderId + '-')) {
    const cleaned = nodeEl.id.replace(activeRenderId + '-', '');
    const matches = cleaned.match(/^(?:flowchart|graph|subgraph|node|el)?-(.+)-\d+$/) || cleaned.match(/^(.+)-\d+$/);
    if (matches) {
      return matches[1];
    }
    return cleaned.replace(/-\d+$/, '');
  }

  const matches = nodeEl.id.match(/^flowchart-(.+)-\d+$/) || nodeEl.id.match(/^(.+)-\d+$/);
  return matches ? matches[1] : nodeEl.id;
}

/**
 * Parses sourceId and targetId from link element's ID
 */
export interface NodeInfo {
  id: string;
}

export function extractEdgeIds(pathId: string, nodes: NodeInfo[]): { sourceId: string; targetId: string } | null {
  const match = pathId.match(/-L_(.+)_(\d+)$/);
  if (!match) return null;
  const combinedNodes = match[1];

  let sourceId = '';
  let targetId = '';
  for (const node of nodes) {
    const prefix = node.id + '_';
    if (combinedNodes.startsWith(prefix)) {
      const candidateTarget = combinedNodes.slice(prefix.length);
      if (nodes.some(n => n.id === candidateTarget)) {
        sourceId = node.id;
        targetId = candidateTarget;
        break;
      }
    }
  }

  if (!sourceId || !targetId) {
    const parts = combinedNodes.split('_');
    if (parts.length >= 2) {
      sourceId = parts[0];
      targetId = parts.slice(1).join('_');
    }
  }

  if (sourceId && targetId) {
    return { sourceId, targetId };
  }
  return null;
}

/**
 * Calculates center midpoint coordinates of a DOM element's bounding rect
 */
export function getElementMidpoint(el: Element): Point {
  const rect = el.getBoundingClientRect();
  return {
    x: (rect.left + rect.right) / 2,
    y: (rect.top + rect.bottom) / 2,
  };
}

/**
 * Calculates the exact midpoint along the stroke of an SVG path element
 */
export function getPathMidpoint(pathEl: SVGPathElement): Point {
  try {
    const totalLength = pathEl.getTotalLength();
    const localPoint = pathEl.getPointAtLength(totalLength / 2);
    const svgNode = pathEl.ownerSVGElement;
    if (svgNode) {
      const svgPoint = svgNode.createSVGPoint();
      svgPoint.x = localPoint.x;
      svgPoint.y = localPoint.y;
      const matrix = pathEl.getScreenCTM();
      if (matrix) {
        const clientPoint = svgPoint.matrixTransform(matrix);
        return { x: clientPoint.x, y: clientPoint.y };
      }
    }
  } catch (e) {
    console.warn('Failed to calculate exact path midpoint:', e);
  }
  // Fallback to bounding box center
  return getElementMidpoint(pathEl);
}

/**
 * Finds the closest candidate element from a list, using Euclidean distance from a target midpoint
 */
export function findClosestElement(
  targetMid: Point,
  candidates: Element[]
): { element: Element | null; distance: number } {
  let closest: Element | null = null;
  let minDistance = Infinity;

  for (const candidate of candidates) {
    const candidateMid = getElementMidpoint(candidate);
    const distance = Math.hypot(targetMid.x - candidateMid.x, targetMid.y - candidateMid.y);
    if (distance < minDistance) {
      minDistance = distance;
      closest = candidate;
    }
  }

  return { element: closest, distance: minDistance };
}
