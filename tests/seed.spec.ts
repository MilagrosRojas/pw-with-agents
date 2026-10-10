import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('seed', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'FEATURES ITEMS' })).toBeVisible();
  });
});
