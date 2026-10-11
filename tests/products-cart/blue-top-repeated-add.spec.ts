import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';

// spec: specs/products-cart.md
// seed: tests/seed.spec.ts

test.describe('Blue Top cart flows', () => {
  test('increments Blue Top quantity when it is added twice', async ({ page }) => {
    await allure.description(`
## Objective
Verify that adding the same **Blue Top** twice from Products accumulates the quantity in a single cart row.

## Preconditions and case independence
- The case uses Playwright's isolated \`page\` fixture; it does not load or share \`storageState\`.
- It first verifies the empty-cart message and zero rows, without deleting products to restore the precondition.
- Both additions are prepared within this case, without depending on a previous execution.

## Test data
- Product: \`Blue Top\`.
- Expected unit price: \`Rs. 500\`.
- Number of additions: \`2\`.
- Expected quantity and total: \`2\` and \`Rs. 1000\`.

## Steps
1. Open the cart and verify that it has no rows and displays the empty-cart message.
2. Open Products, verify the URL and **All Products**, and locate the single logical Blue Top card.
3. Use **Add to cart** on that card and verify the **Added!** modal, its message, **Continue Shopping**, and **View Cart**.
4. Choose **Continue Shopping**, use the same **Add to cart** control a second time, and verify the second **Added!** modal and **View Cart**.
5. Open the cart from the second confirmation and validate the single Blue Top row.

## Expected results
- Each addition shows the observed confirmation.
- The cart contains exactly one Blue Top row, not two: Blue Top name, \`Rs. 500\` unit price, \`2\` quantity, and \`Rs. 1000\` total.
`);
    // 1. Create a fresh browser context for this case without loading or sharing storageState; navigate to Cart.
    await page.goto('/view_cart');

    // 2. Assert the Cart precondition without performing recovery cleanup.
    const cartRows = page.locator('#cart_info_table tbody tr');
    await expect(page.getByText('Cart is empty! Click here to buy products.')).toBeVisible();
    await expect(cartRows).toHaveCount(0);

    // 3. Navigate independently to Products and use the Blue Top product card to Add to cart once.
    await page.goto('/products');
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
    const blueTopCard = page.locator('.features_items .col-sm-4').filter({ has: page.locator('.single-products > .productinfo > p', { hasText: /^Blue Top$/ }) });
    await expect(blueTopCard).toHaveCount(1);
    const addToCart = blueTopCard.locator('.single-products > .productinfo').getByText('Add to cart', { exact: true });
    await addToCart.click();
    const addModal = page.locator('#cartModal');
    await expect(addModal.getByRole('heading', { name: 'Added!' })).toBeVisible();
    await expect(addModal.getByText('Your product has been added to cart.')).toBeVisible();
    await expect(addModal.getByRole('button', { name: 'Continue Shopping' })).toBeVisible();
    await expect(addModal.getByRole('link', { name: 'View Cart' })).toBeVisible();

    // 4. Choose Continue Shopping, then add the same Blue Top product card a second time.
    await addModal.getByRole('button', { name: 'Continue Shopping' }).click();
    await addToCart.click();
    await expect(addModal.getByRole('heading', { name: 'Added!' })).toBeVisible();
    await expect(addModal.getByText('Your product has been added to cart.')).toBeVisible();
    await expect(addModal.getByRole('link', { name: 'View Cart' })).toBeVisible();

    // 5. Select View Cart from the second confirmation.
    await addModal.getByRole('link', { name: 'View Cart' }).click();
    await expect(cartRows).toHaveCount(1);
    const blueTopRow = cartRows.filter({ has: page.getByRole('link', { name: 'Blue Top', exact: true }) });
    await expect(blueTopRow).toHaveCount(1);
    await expect(blueTopRow.getByRole('link', { name: 'Blue Top', exact: true })).toBeVisible();
    await expect(blueTopRow.getByText('Rs. 500', { exact: true })).toBeVisible();
    await expect(blueTopRow.getByRole('button', { name: '2', exact: true })).toBeVisible();
    await expect(blueTopRow.getByText('Rs. 1000', { exact: true })).toBeVisible();
  });
});
