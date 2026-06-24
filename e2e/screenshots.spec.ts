import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

import { fileURLToPath } from 'url';

test.describe('Generate Screenshots for Documentation', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const screenshotsDir = path.join(__dirname, '..', 'docs', 'public', 'screenshots');
  const pwaScreenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    if (!fs.existsSync(pwaScreenshotsDir)) {
      fs.mkdirSync(pwaScreenshotsDir, { recursive: true });
    }
  });

  test('capture application screenshots', async ({ page }) => {
    // Set viewport to a nice standard desktop size
    await page.setViewportSize({ width: 1280, height: 800 });

    // Prevent tour onboarding from auto-starting in screenshots capture
    await page.addInitScript(() => {
      window.localStorage.setItem('mermify-tour-completed', 'true');
    });

    // Navigate to local dev server
    await page.goto('/');
    await expect(page.locator('.monaco-editor .view-lines')).toBeVisible({ timeout: 15000 });

    // 1. Initial State Screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'initial-state.png') });

    // 2. Add Node click
    const addNodeBtn = page.getByRole('button', { name: 'Add Node' });
    await addNodeBtn.click();
    await expect(page.locator('text=Node Properties')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'add-node-modal.png') });

    // Close the modal
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('text=Node Properties')).not.toBeVisible();

    // Clear and start with simpler diagram for clear screenshots
    const editor = page.locator('.monaco-editor .view-lines').first();
    await editor.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type('flowchart TD\n  N1[Start Node]');

    // Wait for render
    await expect(page.locator('span:has-text("nodes detected")')).toContainText('1 nodes detected');
    await page.screenshot({ path: path.join(screenshotsDir, 'simple-start.png') });

    // 3. Drag Socket to Empty Space (Drag to create additional node)
    const socketN1 = page.getByTestId('node-drag-socket-N1');
    await expect(socketN1).toBeVisible();
    const boxN1 = await socketN1.boundingBox();
    if (boxN1) {
      // Hover over socket
      await page.mouse.move(boxN1.x + boxN1.width / 2, boxN1.y + boxN1.height / 2);
      await page.mouse.down();
      // Move 200px right and 150px down
      await page.mouse.move(boxN1.x + boxN1.width / 2 + 200, boxN1.y + boxN1.height / 2 + 150);
      await page.screenshot({ path: path.join(screenshotsDir, 'drag-create-in-progress.png') });
      await page.mouse.up();
    }

    // Modal should auto-open for new Node N2
    await expect(page.locator('text=Editing: Node N2')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'node-properties-modal.png') });
    await page.getByRole('button', { name: 'Close' }).click();

    // 4. Drag to Connect two nodes
    // Let's create N3 standalone first
    await addNodeBtn.click();
    await expect(page.locator('text=Node Properties')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // Drag connection from N2 to N3
    const socketN2 = page.getByTestId('node-drag-socket-N2');
    const overlayN3 = page.getByTestId('node-overlay-N3');
    const boxN2 = await socketN2.boundingBox();
    const boxN3 = await overlayN3.boundingBox();
    if (boxN2 && boxN3) {
      await page.mouse.move(boxN2.x + boxN2.width / 2, boxN2.y + boxN2.height / 2);
      await page.mouse.down();
      await page.mouse.move(boxN3.x + boxN3.width / 2, boxN3.y + boxN3.height / 2);
      await page.screenshot({ path: path.join(screenshotsDir, 'drag-connect-in-progress.png') });
      await page.mouse.up();
    }

    // Verify edge is created
    const edgeOverlay = page.getByTestId('edge-overlay-N2-N3');
    await expect(edgeOverlay).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'drag-connected-nodes.png') });

    // 5. Click edge to enter edit modal
    await edgeOverlay.hover();
    const editEdgeBtn = page.getByTestId('edge-edit-btn-N2-N3');
    await editEdgeBtn.click();
    await expect(page.locator('text=Link Properties')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, 'link-properties-modal.png') });
    await page.getByRole('button', { name: 'Close' }).click();

    // 6. Hover to show delete buttons
    const nodeOverlayN3 = page.getByTestId('node-overlay-N3');
    await nodeOverlayN3.hover();
    await page.screenshot({ path: path.join(screenshotsDir, 'delete-button-hover.png') });

    // 7. Share Link action
    const shareBtn = page.getByRole('button', { name: 'Share Link' });
    await shareBtn.click();
    await page.screenshot({ path: path.join(screenshotsDir, 'share-link-copied.png') });

    // 8. Export dropdown PNG/SVG copy to clipboard
    const exportBtn = page.getByRole('button', { name: 'Export' });
    await exportBtn.click();
    await page.screenshot({ path: path.join(screenshotsDir, 'export-options.png') });

    // 9. Capture PWA Screenshots (after dismissing export menu)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300); // Wait for transition
    await page.screenshot({ path: path.join(pwaScreenshotsDir, 'desktop.png') });

    // Set mobile viewport and capture mobile screenshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500); // Wait for resize and auto-fit to settle
    await page.screenshot({ path: path.join(pwaScreenshotsDir, 'mobile.png') });
  });
});
