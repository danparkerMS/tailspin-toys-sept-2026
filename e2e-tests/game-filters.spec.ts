import { test, expect } from '@playwright/test';

test.describe('Game Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('games-grid')).toBeVisible();
  });

  test('should display filter controls for categories and publishers', async ({ page }) => {
    await expect(page.getByTestId('game-filters')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Category' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Publisher' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Puzzle', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'GitHub Games', exact: true })).toBeVisible();
  });

  test('should filter games by a single category', async ({ page }) => {
    await test.step('Select the Puzzle category filter', async () => {
      await page.getByRole('checkbox', { name: 'Puzzle', exact: true }).check();
    });

    await test.step('Verify only Puzzle games remain visible', async () => {
      const visibleCards = page.locator('[data-testid="game-card"]:visible');
      await expect(visibleCards).toHaveCount(4);
      await expect(page.getByTestId('filter-results-count')).toContainText('Showing 4 of');
    });
  });

  test('should filter games by a single publisher', async ({ page }) => {
    await test.step('Select the GitHub Games publisher filter', async () => {
      await page.getByRole('checkbox', { name: 'GitHub Games', exact: true }).check();
    });

    await test.step('Verify only GitHub Games titles remain visible', async () => {
      const visibleCards = page.locator('[data-testid="game-card"]:visible');
      await expect(visibleCards).toHaveCount(5);
      for (const card of await visibleCards.all()) {
        await expect(card.getByTestId('game-publisher')).toHaveText('GitHub Games');
      }
    });
  });

  test('should combine category and publisher filters with AND logic', async ({ page }) => {
    await test.step('Select the Puzzle category and GitHub Games publisher', async () => {
      await page.getByRole('checkbox', { name: 'Puzzle', exact: true }).check();
      await page.getByRole('checkbox', { name: 'GitHub Games', exact: true }).check();
    });

    await test.step('Verify only the game matching both filters remains visible', async () => {
      const visibleCards = page.locator('[data-testid="game-card"]:visible');
      await expect(visibleCards).toHaveCount(1);
      await expect(visibleCards.first().getByTestId('game-title')).toHaveText('Bug Buster Brainteaser');
    });
  });

  test('should combine multiple categories with OR logic', async ({ page }) => {
    await test.step('Select the Puzzle and Simulation categories', async () => {
      await page.getByRole('checkbox', { name: 'Puzzle', exact: true }).check();
      await page.getByRole('checkbox', { name: 'Simulation', exact: true }).check();
    });

    await test.step('Verify games from both categories are visible', async () => {
      await expect(page.locator('[data-testid="game-card"]:visible')).toHaveCount(8);
    });
  });

  test('should reset filters when clicking Clear filters', async ({ page }) => {
    const totalCards = await page.getByTestId('game-card').count();

    await test.step('Apply category and publisher filters', async () => {
      await page.getByRole('checkbox', { name: 'Puzzle', exact: true }).check();
      await page.getByRole('checkbox', { name: 'GitHub Games', exact: true }).check();
      await expect(page.locator('[data-testid="game-card"]:visible')).toHaveCount(1);
    });

    await test.step('Click Clear filters', async () => {
      await page.getByRole('button', { name: 'Clear filters' }).click();
    });

    await test.step('Verify all games are visible again and checkboxes are unchecked', async () => {
      await expect(page.locator('[data-testid="game-card"]:visible')).toHaveCount(totalCards);
      await expect(page.getByRole('checkbox', { name: 'Puzzle', exact: true })).not.toBeChecked();
      await expect(page.getByRole('checkbox', { name: 'GitHub Games', exact: true })).not.toBeChecked();
    });
  });
});
