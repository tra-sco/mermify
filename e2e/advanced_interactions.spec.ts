import { test, expect } from '@playwright/test';

// Helper to verify code in Monaco Editor by checking the model value directly via window.monaco API
async function verifyEditorCode(page: any, expectedLines: string[]) {
  // Wait for Monaco editor to be fully loaded and have a model
  await expect.poll(async () => {
    return await page.evaluate(() => {
      const monaco = (window as any).monaco;
      return !!(monaco?.editor?.getModels()?.[0]);
    });
  }, { timeout: 10000 }).toBe(true);

  // Poll the editor value until it matches the expected lines
  await expect.poll(async () => {
    const code = await page.evaluate(() => {
      const model = (window as any).monaco.editor.getModels()[0];
      return model.getValue();
    });
    const actualLines = code.split('\n').map((l: string) => l.replace(/\u200B/g, '').replace(/\u00a0/g, ' ').replace(/\r/g, '').trim());
    return actualLines.filter((l: string) => l.length > 0);
  }).toEqual(expectedLines.map(line => line.trim().replace(/\r/g, '')).filter(l => l.length > 0));
}

test.describe('Advanced Mermify Editor Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Prevent tour onboarding from auto-starting in tests
    await page.addInitScript(() => {
      window.localStorage.setItem('mermify-tour-completed', 'true');
    });
    await page.goto('/');
    await expect(page.locator('.monaco-editor .view-lines')).toBeVisible({ timeout: 15000 });
  });

  test('should support empty flowcharts, add node modal validation, custom labels, and drag connection node creation/deletion', async ({ page }) => {
    // 1. Starts with an empty flowchart TD
    await page.evaluate(() => {
      (window as any).monaco.editor.getModels()[0].setValue('flowchart TD');
    });

    // Verify code is empty except for flowchart TD
    await verifyEditorCode(page, [
      'flowchart TD'
    ]);

    // Wait for nodes detected to update to 0
    await expect(page.locator('span:has-text("nodes detected")')).toContainText('0 nodes detected');

    // 2. Adds a node with clicking the addnode button (verify node is created in code)
    await page.getByTitle('Add Standalone Node').click();

    // Verify modal is visible
    await expect(page.locator('text=Node Properties')).toBeVisible();
    await expect(page.locator('text=Editing: Node N1')).toBeVisible();

    // Verify node is created in code
    await verifyEditorCode(page, [
      'flowchart TD',
      'N1[Node 1]'
    ]);

    // 3. Delete the label (the cursor is in the label field automatically) by performing select all and del hit enter
    const input = page.getByPlaceholder('Enter label text...');
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Delete');
    await page.keyboard.press('Enter');

    // Error should be shown as this is not allowed
    await expect(page.locator('text=Node label cannot be empty.')).toBeVisible();

    // 4. Continue giving a label and hitting enter (verify changes were performed as expected also the node modal should be closed)
    await page.keyboard.type('Root Node');
    await page.keyboard.press('Enter');
    await expect(page.locator('text=Node Properties')).not.toBeVisible();

    // Verify code has updated with label
    await verifyEditorCode(page, [
      'flowchart TD',
      'N1[Root Node]'
    ]);

    // Verify node is created in code with updated label (1 node detected in UI status bar)
    await expect(page.locator('span:has-text("nodes detected")')).toContainText('1 nodes detected');

    // Reset Zoom & Recenter to 100% to ensure coordinates are predictable
    await page.getByTitle('Reset Zoom & Recenter (100%)').click();

    // 5. Create a new node by dragging and dropping to an empty space (from N1 to create N2)
    const socketN1 = page.getByTestId('node-drag-socket-N1');
    await expect(socketN1).toBeVisible();
    const boxN1 = await socketN1.boundingBox();
    expect(boxN1).not.toBeNull();
    if (boxN1) {
      await page.mouse.move(boxN1.x + boxN1.width / 2, boxN1.y + boxN1.height / 2);
      await page.mouse.down();
      // Move 150px right and 150px down
      await page.mouse.move(boxN1.x + boxN1.width / 2 + 150, boxN1.y + boxN1.height / 2 + 150);
      await page.mouse.up();
    }

    // Modal should automatically open for newly created N2
    await expect(page.locator('text=Editing: Node N2')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('text=Node Properties')).not.toBeVisible();

    // 6. Do this again from the first node (N1 to create N3) and from the second node (N2 to create N4)
    // Drag from N1 again
    await expect(socketN1).toBeVisible();
    const boxN1_again = await socketN1.boundingBox();
    if (boxN1_again) {
      await page.mouse.move(boxN1_again.x + boxN1_again.width / 2, boxN1_again.y + boxN1_again.height / 2);
      await page.mouse.down();
      // Move 150px left and 150px down
      await page.mouse.move(boxN1_again.x + boxN1_again.width / 2 - 150, boxN1_again.y + boxN1_again.height / 2 + 150);
      await page.mouse.up();
    }
    await expect(page.locator('text=Editing: Node N3')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // Drag from N2
    const socketN2 = page.getByTestId('node-drag-socket-N2');
    await expect(socketN2).toBeVisible();
    const boxN2 = await socketN2.boundingBox();
    if (boxN2) {
      await page.mouse.move(boxN2.x + boxN2.width / 2, boxN2.y + boxN2.height / 2);
      await page.mouse.down();
      // Move 150px right and 200px down
      await page.mouse.move(boxN2.x + boxN2.width / 2 + 150, boxN2.y + boxN2.height / 2 + 200);
      await page.mouse.up();
    }
    await expect(page.locator('text=Editing: Node N4')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // Verify nodes count is 4
    await expect(page.locator('span:has-text("nodes detected")')).toContainText('4 nodes detected');

    // Verify the code is as expected
    await verifyEditorCode(page, [
      'flowchart TD',
      'N1[Root Node]',
      'N1 --> N2[Node 2]',
      'N1 --> N3[Node 3]',
      'N2 --> N4[Node 4]'
    ]);

    // 7. Delete the second node (N2) with the delete button on the nodes top right corner
    // Hover over overlay to expose buttons
    const nodeOverlayN2 = page.getByTestId('node-overlay-N2');
    await nodeOverlayN2.hover();
    const deleteN2 = page.getByTestId('node-delete-btn-N2');
    await deleteN2.click();

    // Verify the nodes count drops to 3
    await expect(page.locator('span:has-text("nodes detected")')).toContainText('3 nodes detected');

    // Verify the result code is updated as expected
    await verifyEditorCode(page, [
      'flowchart TD',
      'N1[Root Node]',
      'N1 --> N3[Node 3]',
      'N4[Node 4]'
    ]);
  });

  test('should support 11 shapes, edge drag-connect, edge editing, and edge deletion', async ({ page }) => {
    const flowchartCode = [
      'flowchart TD',
      '    N1[Rectangle]',
      '    N2(Round)',
      '    N3([Stadium])',
      '    N4[[Subroutine]]',
      '    N5[(Database)]',
      '    N6((Circle))',
      '    N7{{Hexagon}}',
      '    N8{Rhombus}',
      '    N9>Asymmetric]',
      '    N10[/Parallelogram/]',
      '    N11[\\Parallelogram Alt\\]'
    ].join('\n');

    await page.evaluate((code: string) => {
      (window as any).monaco.editor.getModels()[0].setValue(code);
    }, flowchartCode);

    // Verify all 11 nodes are loaded/detected
    await expect(page.locator('span:has-text("nodes detected")')).toContainText('11 nodes detected');

    // Verify the code in Monaco is exactly as typed
    await verifyEditorCode(page, [
      'flowchart TD',
      'N1[Rectangle]',
      'N2(Round)',
      'N3([Stadium])',
      'N4[[Subroutine]]',
      'N5[(Database)]',
      'N6((Circle))',
      'N7{{Hexagon}}',
      'N8{Rhombus}',
      'N9>Asymmetric]',
      'N10[/Parallelogram/]',
      'N11[\\Parallelogram Alt\\]'
    ]);

    // 2. Drag and drop onto an existing node to verify edge creation (from N1 onto N2)
    const socketN1 = page.getByTestId('node-drag-socket-N1');
    const overlayN2 = page.getByTestId('node-overlay-N2');
    await expect(socketN1).toBeVisible();
    await expect(overlayN2).toBeVisible();
    const boxN1 = await socketN1.boundingBox();
    const boxN2 = await overlayN2.boundingBox();

    expect(boxN1).not.toBeNull();
    expect(boxN2).not.toBeNull();
    if (boxN1 && boxN2) {
      await page.mouse.move(boxN1.x + boxN1.width / 2, boxN1.y + boxN1.height / 2);
      await page.mouse.down();
      await page.mouse.move(boxN2.x + boxN2.width / 2, boxN2.y + boxN2.height / 2);
      await page.mouse.up();
    }

    // Verify edge overlay for N1->N2 is created in the DOM
    const edgeOverlay = page.getByTestId('edge-overlay-N1-N2');
    await expect(edgeOverlay).toBeVisible();

    // Verify the edge is added in code
    await verifyEditorCode(page, [
      'flowchart TD',
      'N1[Rectangle]',
      'N2(Round)',
      'N3([Stadium])',
      'N4[[Subroutine]]',
      'N5[(Database)]',
      'N6((Circle))',
      'N7{{Hexagon}}',
      'N8{Rhombus}',
      'N9>Asymmetric]',
      'N10[/Parallelogram/]',
      'N11[\\Parallelogram Alt\\]',
      'N1 --> N2'
    ]);

    // 3. Click edit on the edge and change the label, then verify
    // Hover on edgeOverlay to trigger hover state, making buttons visible/clickable
    await edgeOverlay.hover();
    const editEdgeBtn = page.getByTestId('edge-edit-btn-N1-N2');
    await editEdgeBtn.click();

    // Verify edge modal is open
    await expect(page.locator('text=Link Properties')).toBeVisible();

    // Fill edge label
    const labelInput = page.getByPlaceholder('No label (e.g. Yes, No, HTTPS)');
    await labelInput.focus();
    await page.keyboard.type('Test Link');
    await page.keyboard.press('Enter');

    // Check that link label is updated
    await expect(page.locator('text=Link Properties')).not.toBeVisible();
    await expect(page.getByTestId('edge-overlay-N1-N2')).toBeVisible();

    // Verify the edge update in code
    await verifyEditorCode(page, [
      'flowchart TD',
      'N1[Rectangle]',
      'N2(Round)',
      'N3([Stadium])',
      'N4[[Subroutine]]',
      'N5[(Database)]',
      'N6((Circle))',
      'N7{{Hexagon}}',
      'N8{Rhombus}',
      'N9>Asymmetric]',
      'N10[/Parallelogram/]',
      'N11[\\Parallelogram Alt\\]',
      'N1 -->|Test Link| N2'
    ]);

    // 4. Delete the existing edge and verify the result
    await edgeOverlay.hover();
    const deleteEdgeBtn = page.getByTestId('edge-delete-btn-N1-N2');
    await deleteEdgeBtn.click();

    // Verify the edge overlay is no longer visible
    await expect(page.getByTestId('edge-overlay-N1-N2')).not.toBeVisible();

    // Verify edge connection is removed in code
    await verifyEditorCode(page, [
      'flowchart TD',
      'N1[Rectangle]',
      'N2(Round)',
      'N3([Stadium])',
      'N4[[Subroutine]]',
      'N5[(Database)]',
      'N6((Circle))',
      'N7{{Hexagon}}',
      'N8{Rhombus}',
      'N9>Asymmetric]',
      'N10[/Parallelogram/]',
      'N11[\\Parallelogram Alt\\]'
    ]);
  });
});

