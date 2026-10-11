import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';

// spec: specs/products-cart.md
// seed: tests/seed.spec.ts

test.describe('Blue Top cart flows', () => {
  test('searches for Blue Top and verifies observed matching results', async ({ page }) => {
    await allure.description(`
## Objective
Verify that searching for **Blue Top** returns logical results consistent with the queried term and preserves the observed contract for the Blue Top card.

## Preconditions and case independence
- The case uses Playwright's isolated \`page\` fixture; it does not load or share \`storageState\`.
- Before preparing data, it navigates to the cart and verifies the empty-cart message and zero product rows.
- If that precondition is not met, the case fails: it does not delete products as automatic recovery.

## Test data
- Search term: \`Blue Top\`.
- Expected product: \`Blue Top\`.
- Expected price on the exact card: \`Rs. 500\`.
- Expected View Product link: \`/product_details/1\`.

## Steps
1. Open the cart and verify that it is empty and has no rows.
2. Open Products, verify the URL and the **All Products** heading.
3. Enter \`Blue Top\` in **Search Product**, submit the search, and verify the encoded URL and the **Searched Products** heading.
4. Inspect the logical \`.col-sm-4\` cards and read names from the normal \`.single-products > .productinfo > p\` representation, without counting the overlay variant.
5. Locate the single exact Blue Top card and verify its price, **Add to cart**, and **View Product** link.

## Expected results
- There is at least one logical card in the results, and all its names contain \`Blue Top\`, case-insensitively.
- There is exactly one exact Blue Top card with \`Rs. 500\` and **Add to cart** visible.
- Its **View Product** link is unique and has an \`href\` attribute equal to \`/product_details/1\`.
`);
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
