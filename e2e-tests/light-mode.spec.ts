// Verifies the light-mode preference, persistence, and independence from high contrast.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Light Mode Preference', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('tailspin-light-mode');
      localStorage.removeItem('tailspin-high-contrast');
    });
    await page.reload();
  });

  test('enables light mode and persists it across reloads and navigation', async ({ page }) => {
    const toggle = page.getByTestId('light-mode-toggle');

    await test.step('Enable light mode', async () => {
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await toggle.click();

      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('html')).toHaveClass(/light-mode/);
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect.poll(() => page.evaluate(() => localStorage.getItem('tailspin-light-mode'))).toBe('true');
    });

    await test.step('Reload and navigate with light mode still applied', async () => {
      await page.reload();
      await expect(page.getByTestId('light-mode-toggle')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('html')).toHaveClass(/light-mode/);

      await page.goto('/about');
      await expect(page.getByTestId('light-mode-toggle')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    });
  });

  test('operates independently from high contrast and passes WCAG AA checks', async ({ page }) => {
    const lightToggle = page.getByTestId('light-mode-toggle');
    const contrastToggle = page.getByTestId('contrast-toggle');

    await test.step('Enable both display preferences', async () => {
      await lightToggle.click();
      await contrastToggle.click();

      await expect(lightToggle).toHaveAttribute('aria-pressed', 'true');
      await expect(contrastToggle).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('html')).toHaveClass(/light-mode/);
      await expect(page.locator('html')).toHaveClass(/high-contrast/);
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
      await expect.poll(() => page.evaluate(() => ({
        light: localStorage.getItem('tailspin-light-mode'),
        contrast: localStorage.getItem('tailspin-high-contrast'),
      }))).toEqual({ light: 'true', contrast: 'true' });
    });

    await test.step('Disable high contrast without changing light mode', async () => {
      await contrastToggle.click();

      await expect(contrastToggle).toHaveAttribute('aria-pressed', 'false');
      await expect(lightToggle).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('html')).not.toHaveClass(/high-contrast/);
      await expect(page.locator('html')).toHaveClass(/light-mode/);
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    });

    await test.step('Verify the light presentation is accessible', async () => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });
});
