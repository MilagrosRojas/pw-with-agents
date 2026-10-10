import { test, expect } from '@playwright/test';

// spec: specs/products-cart.md
// seed: tests/seed.spec.ts

test.describe('Blue Top cart flows', () => {
  test('searches for Blue Top and verifies observed matching results', async ({ page }) => {
    // 1. Create a fresh browser context for this case without loading or sharing storageState; navigate to Cart.
    await page.goto('/view_cart');

    // 2. Assert the Cart precondition without performing recovery cleanup.
    const cartRows = page.locator('#cart_info_table tbody tr');
    await expect(page.getByText('Cart is empty! Click here to buy products.')).toBeVisible();
    await expect(cartRows).toHaveCount(0);

    // 3. Navigate independently to Products, enter “Blue Top” in the observed Search Product field, and submit with the search button.
    await page.goto('/products');
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Search Product' }).fill('Blue Top');
    await page.locator('#submit_search').click();
    await expect(page).toHaveURL(/\/products\?search=Blue%20Top$/);
    await expect(page.getByRole('heading', { name: 'Searched Products' })).toBeVisible();

    // 4. Inspect the returned product cards.
    const logicalCards = page.locator('.features_items .col-sm-4');
    const logicalProductNames = logicalCards.locator('.single-products > .productinfo > p');
    await expect(logicalCards).not.toHaveCount(0);
    for (const name of await logicalProductNames.allTextContents()) {
      expect(name).toMatch(/Blue Top/i);
    }
    const blueTopCard = page.locator('.features_items .product-image-wrapper:has(.single-products > .productinfo > p:text-is("Blue Top"))');
    await expect(blueTopCard).toHaveCount(1);
    const blueTopProductInfo = blueTopCard.locator('.productinfo');
    await expect(blueTopProductInfo.getByText('Rs. 500', { exact: true })).toBeVisible();
    await expect(blueTopProductInfo.getByText('Add to cart', { exact: true })).toBeVisible();
    const viewProduct = blueTopCard.locator('.choose a[href="/product_details/1"]');
    await expect(viewProduct).toHaveCount(1);
    await expect(viewProduct).toHaveAttribute('href', '/product_details/1');
  });
});
