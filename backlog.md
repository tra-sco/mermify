# Mermaid Visual — Backlog

Tracked issues and deferred improvements. Each item includes enough background to
pick it up cold without needing to re-investigate.

---

## [OPEN] Edge Click Option D — Pierce-Through for Lines Under Node Bounding Boxes

**Priority:** Medium
**Effort:** Small–Medium
**Related conversation:** `b3b7cdd5-9382-4073-8f7b-257609554cec`

### What is implemented (Option A — shipped)

`Preview.tsx` has a dedicated `handleSvgLayerClick` handler attached to the SVG layer
div (Layer A). When the user clicks an SVG `.flowchart-link` or
`.flowchart-link-hover-target` path in **open canvas space**, `resolveEdgeFromClick`
resolves the edge and `handleEdgeClick` is called directly, before the event bubbles up
to `handleCanvasClick`.

### What is still broken

Clicking a connection line segment that visually passes **underneath a node's bounding
box** does not open the action palette / inline editor.

### Why

The DOM layer structure is:

```
canvas-container  ←  onClick={handleCanvasClick}
└─ viewport div  (pointer-events-none)
    ├─ LAYER A: SVG div  (pointer-events-auto, z: default)  ← handleSvgLayerClick
    └─ LAYER B: overlay div  (pointer-events-none, z-20)
        └─ NodeOverlay root  (pointer-events-none)
            └─ inner hit div  (pointer-events-auto, absolute inset-0)  ← covers full node bbox
```

Layer B is `z-20`. The NodeOverlay inner hit div (`absolute inset-0`, `pointer-events-auto`)
covers the **entire node bounding box**. Any click landing inside that box is captured by
the HTML overlay. `NodeOverlay.handleSingleClick` immediately calls `e.stopPropagation()`,
so neither `handleSvgLayerClick` nor `handleCanvasClick` ever fire.

This means: if a connection line segment passes spatially beneath a node bounding box,
clicking that segment silently selects the node instead of the edge.

### The fix (Option D — `elementFromPoint` pierce-through)

In `NodeOverlay.handleSingleClick`, **before** calling `onEditNode`, temporarily disable
pointer-events on the overlay layer and use `document.elementFromPoint` to check whether
there is an SVG edge path directly under the cursor:

```ts
// NodeOverlay.tsx — handleSingleClick with pierce-through
const handleSingleClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  if (isEditing) return;

  // Pierce through HTML overlays to detect SVG edges underneath
  if (overlayLayerRef?.current) {
    const overlay = overlayLayerRef.current;
    const prev = overlay.style.pointerEvents;
    overlay.style.pointerEvents = 'none';                          // hide from hit-test
    const el = document.elementFromPoint(e.clientX, e.clientY);   // read underlying SVG
    overlay.style.pointerEvents = prev;                            // restore (sync, no repaint)

    if (el) {
      const isEdgePath =
        (el as Element).closest?.('.flowchart-link') ||
        (el as Element).closest?.('.flowchart-link-hover-target');
      if (isEdgePath) {
        onEdgeClickFromOverlap?.(el as SVGElement); // delegate to Preview
        return; // suppress node selection
      }
    }
  }

  onEditNode(node);
};
```

The `pointerEvents` toggle is synchronous — the browser only repaints between JS tasks,
so there is zero visual flicker.

### Files to change

**`Preview.tsx`**
- Add `overlayLayerRef = useRef<HTMLDivElement>(null)` and attach it to the Layer B div:
  `<div ref={overlayLayerRef} className="absolute inset-0 pointer-events-none z-20">`
- Add a stable `handleEdgeClickFromNodeOverlap` callback (useCallback) that calls
  `resolveEdgeFromClick(el)` then `handleEdgeClick(edge)`.
- Pass both as props to every `<NodeOverlay>` render.

**`NodeOverlay.tsx`**
- Add two new optional props to `NodeOverlayProps`:
  ```ts
  overlayLayerRef?: React.RefObject<HTMLDivElement>;
  onEdgeClickFromOverlap?: (el: SVGElement) => void;
  ```
- Apply the pierce-through logic inside `handleSingleClick` as shown above.

### Gotcha — double-click

`handleDoubleClick` also calls `e.stopPropagation()`. To make double-clicking an
edge-under-node open inline label editing, apply the same pierce-through pattern in
`handleDoubleClick` and call `onEdgeDoubleClickFromOverlap?.(el)` if an edge is found.
This is lower priority than single-click (palette open).

---
