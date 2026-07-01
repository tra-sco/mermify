import { test, expect } from '@playwright/test';

test.describe('Mermify Getting Started Tour', () => {
  test('should show the tour automatically on first load, step through it, and save state', async ({ page }) => {
    // Clear localStorage to ensure first load triggers the tour
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('mermify-tour-completed'));
    
    // Reload page to start with clean state
    await page.reload();
    await expect(page.locator('.monaco-editor .view-lines')).toBeVisible({ timeout: 15000 });

    // Step 1: Welcome step should be visible
    await expect(page.locator('h2:has-text("Welcome to Mermify!")')).toBeVisible();
    await expect(page.locator('text=Step 1 of 7')).toBeVisible();

    // Click Next
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Hybrid Code Editor
    await expect(page.locator('h2:has-text("Hybrid Code Editor")')).toBeVisible();
    await expect(page.locator('text=Step 2 of 7')).toBeVisible();

    // Click Next
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: Interactive Preview Canvas
    await expect(page.locator('h2:has-text("Interactive Preview Canvas")')).toBeVisible();
    await expect(page.locator('text=Step 3 of 7')).toBeVisible();

    // Click Next
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 4: Drag to Connect Nodes (with animation)
    await expect(page.locator('h2:has-text("Drag to Connect Nodes")')).toBeVisible();
    await expect(page.locator('text=Step 4 of 7')).toBeVisible();

    // Click Next
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 5: Drag to Spawn New Nodes (with animation)
    await expect(page.locator('h2:has-text("Drag to Spawn New Nodes")')).toBeVisible();
    await expect(page.locator('text=Step 5 of 7')).toBeVisible();

    // Click Next
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 6: Double-Click or Click to Edit (with animation)
    await expect(page.locator('h2:has-text("Double-Click or Click to Edit")')).toBeVisible();
    await expect(page.locator('text=Step 6 of 7')).toBeVisible();

    // Click Next
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 7: Export & Share
    await expect(page.locator('h2:has-text("Export & Share")')).toBeVisible();
    await expect(page.locator('text=Step 7 of 7')).toBeVisible();

    // Click Finish
    await page.getByRole('button', { name: 'Finish' }).click();

    // The tour popover should close
    await expect(page.locator('h2:has-text("Export & Share")')).not.toBeVisible();

    // Verify localStorage updated
    const isCompleted = await page.evaluate(() => localStorage.getItem('mermify-tour-completed'));
    expect(isCompleted).toBe('true');
  });

  test('should allow skipping the tour', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('mermify-tour-completed'));
    await page.reload();
    await expect(page.locator('.monaco-editor .view-lines')).toBeVisible({ timeout: 15000 });

    // Step 1: Welcome step visible
    await expect(page.locator('h2:has-text("Welcome to Mermify!")')).toBeVisible();

    // Click Skip button
    await page.getByRole('button', { name: 'Skip', exact: true }).click();

    // Tour should be gone
    await expect(page.locator('h2:has-text("Welcome to Mermify!")')).not.toBeVisible();

    // Verify localStorage updated
    const isCompleted = await page.evaluate(() => localStorage.getItem('mermify-tour-completed'));
    expect(isCompleted).toBe('true');
  });

  test('should relaunch the tour when clicking the help button in the navbar', async ({ page }) => {
    // Set tour as already completed
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('mermify-tour-completed', 'true'));
    await page.reload();
    await expect(page.locator('.monaco-editor .view-lines')).toBeVisible({ timeout: 15000 });

    // Tour should NOT be open initially
    await expect(page.locator('h2:has-text("Welcome to Mermify!")')).not.toBeVisible();

    // Click the relaunch help button
    const relaunchBtn = page.getByTestId('tour-relaunch-btn');
    await relaunchBtn.click();

    // Tour should now be open
    await expect(page.locator('h2:has-text("Welcome to Mermify!")')).toBeVisible();
    await expect(page.locator('text=Step 1 of 7')).toBeVisible();
  });
});
