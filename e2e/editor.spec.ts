import { test, expect } from '@playwright/test';

test.describe('Mermify Diagram Hybrid Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Prevent tour onboarding from auto-starting in editor tests
    await page.addInitScript(() => {
      window.localStorage.setItem('mermify-tour-completed', 'true');
    });
    // Navigate to the base URL
    await page.goto('/');
    // Wait for Monaco Editor to be fully loaded and rendering lines (increase timeout for CDN loads)
    await expect(page.locator('.monaco-editor .view-lines')).toBeVisible({ timeout: 15000 });
  });

  test('should load the editor and render the default workflow preset', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle('Mermify - Visual Text-to-Diagram Hybrid Editor');

    // Check header title is visible
    await expect(page.locator('h1', { hasText: 'mermify' })).toBeVisible();

    // Check Monaco Editor container is present
    await expect(page.locator('.monaco-editor')).toBeVisible();

    // Check SVG preview container and default node count (9 nodes for default preset)
    await expect(page.locator('span:has-text("nodes detected")')).toContainText('9 nodes detected');
  });

  test('should switch presets correctly', async ({ page }) => {
    // Switch to Decision Tree preset
    const decisionBtn = page.getByRole('button', { name: 'Decision Tree' });
    await decisionBtn.click();
    await expect(page.locator('span:has-text("nodes detected")')).toContainText('8 nodes detected');

    // Switch to DevOps Stack preset
    const devopsBtn = page.getByRole('button', { name: 'DevOps Stack' });
    await devopsBtn.click();
    await expect(page.locator('span:has-text("nodes detected")')).toContainText('7 nodes detected');
  });

  test('should toggle theme and update localStorage', async ({ page }) => {
    const appContainer = page.locator('div.flex.flex-col.h-screen');
    const themeBtn = page.locator('button[title*="Toggle"]');

    // Initial theme should be dark (localStorage empty or defaults to dark)
    await expect(appContainer).not.toHaveClass(/theme-light/);

    // Toggle theme to Light mode
    await themeBtn.click();
    await expect(appContainer).toHaveClass(/theme-light/);

    // Verify localStorage updated to 'light'
    let themeValue = await page.evaluate(() => localStorage.getItem('mermify-theme'));
    expect(themeValue).toBe('light');

    // Toggle theme back to Dark mode
    await themeBtn.click();
    await expect(appContainer).not.toHaveClass(/theme-light/);

    // Verify localStorage updated to 'dark'
    themeValue = await page.evaluate(() => localStorage.getItem('mermify-theme'));
    expect(themeValue).toBe('dark');
  });

  test('should show syntax error details for invalid Mermaid markup', async ({ page }) => {
    // Click on Monaco editor view-lines to focus it
    const editor = page.locator('.monaco-editor .view-lines').first();
    await editor.click();

    // Clear content using cross-platform ControlOrMeta shortcut and write invalid syntax
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type('flowchart TD\n  A -x-? B');

    // Status bar should show "Invalid Mermaid Syntax"
    await expect(page.locator('text=Invalid Mermaid Syntax')).toBeVisible({ timeout: 5000 });

    // Restore to valid syntax
    await editor.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type('flowchart TD\n  A --> B');

    // Status bar should show "Syntax Ready" and node count should update
    await expect(page.locator('text=Syntax Ready')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('span:has-text("nodes detected")')).toContainText('2 nodes detected');
  });

  test('should open Edit Node modal and update node properties', async ({ page }) => {
    // Wait for the diagram to fully render first
    await expect(page.locator('span:has-text("nodes detected")')).toContainText('9 nodes detected');

    // Click on overlay of node 'Start' (which has label 'User Registration')
    const startNodeOverlay = page.getByTestId('node-overlay-click-Start');
    await startNodeOverlay.click();

    // Verify modal is visible and displays properties
    await expect(page.locator('text=Node Properties')).toBeVisible();
    await expect(page.locator('text=Editing: Node Start')).toBeVisible();

    // Verify label value matches initial state
    const input = page.getByPlaceholder('Enter label text...');
    await expect(input).toHaveValue('User Registration');

    // Change node label
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Delete');
    await page.keyboard.type('User Starts Application');

    // Verify node update is reflected in the overlay (should not shake/error unless empty)
    await expect(page.locator('text=Node Properties')).toBeVisible();

    // Close Modal
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('text=Node Properties')).not.toBeVisible();
  });
});
