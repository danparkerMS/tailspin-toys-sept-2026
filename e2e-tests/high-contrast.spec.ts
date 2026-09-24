// Verifies the high-contrast preference, persistence, and accessible presentation.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('High Contrast Preference', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('tailspin-high-contrast'));
    await page.reload();
  });

  test('enables high contrast and persists it across reloads and navigation', async ({ page }) => {
    const toggle = page.getByTestId('contrast-toggle');

    await test.step('Enable high contrast', async () => {
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await toggle.click();

      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('html')).toHaveClass(/high-contrast/);
      await expect.poll(() => page.evaluate(() => localStorage.getItem('tailspin-high-contrast'))).toBe('true');
    });

    await test.step('Reload with the preference still applied', async () => {
      await page.reload();

      await expect(page.locator('html')).toHaveClass(/high-contrast/);
      await expect(page.getByTestId('contrast-toggle')).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('Navigate to another page with the preference still applied', async () => {
      await page.goto('/about');

      await expect(page.locator('html')).toHaveClass(/high-contrast/);
      await expect(page.getByTestId('contrast-toggle')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('can be disabled and passes WCAG AA automated checks', async ({ page }) => {
    const toggle = page.getByTestId('contrast-toggle');
    await toggle.click();

    await test.step('Verify the high-contrast presentation', async () => {
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    await test.step('Disable and save the preference', async () => {
      await toggle.click();

      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await expect(page.locator('html')).not.toHaveClass(/high-contrast/);
      await expect.poll(() => page.evaluate(() => localStorage.getItem('tailspin-high-contrast'))).toBe('false');
    });
  });
});
