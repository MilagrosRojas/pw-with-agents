import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';

// spec: specs/products-cart.md
// seed: tests/seed.spec.ts

test.describe('Blue Top cart flows', () => {
  test('adds Blue Top with quantity 2 from product details', async ({ page }) => {
    await allure.description(`
## Objective
Verify that selecting quantity \`2\` in the **Blue Top** detail page produces one cart row with the calculated total.

## Preconditions and case independence
- The case uses Playwright's isolated \`page\` fixture; it does not load or share \`storageState\`.
- Before preparing data, it confirms the empty-cart message and zero rows; it does not delete products as automatic recovery.
- Blue Top is prepared within this case and does not depend on the other cases.

## Test data
- Product: \`Blue Top\`.
- Expected detail: \`/product_details/1\` and \`Rs. 500\`.
- Observed initial quantity: \`1\`; entered quantity: \`2\`.
- Expected total: \`Rs. 1000\`.

## Steps
1. Open the cart and verify that it is empty and has no rows.
2. Open Products, validate the URL and **All Products**, locate the single Blue Top card, and verify that its single **View Product** has \`href=/product_details/1\`.
3. Activate **View Product**. Only if the observed advertising vignette is displayed, validate and click its **Close ad** button, wait for the vignette to become hidden, and activate **View Product** again only if the URL is still not the detail URL.
4. Verify the detail URL, Blue Top, \`Rs. 500\`, and the initial quantity \`1\`; enter \`2\` and verify that it remains \`2\`.
5. Add to the cart and verify **Added!**, the confirmation message, **Continue Shopping**, and **View Cart**.
6. Open the cart from **View Cart** and validate the Blue Top row.

## Expected results
- The detail retains quantity \`2\` before adding, and the confirmation modal contains the indicated controls.
- The cart has exactly one Blue Top row with \`Rs. 500\` unit price, \`2\` quantity, and \`Rs. 1000\` total.
`);
    // 1. Create a fresh browser context for this case without loading or sharing storageState; navigate to Cart.
    await page.goto('/view_cart');

    // 2. Assert the Cart precondition without performing recovery cleanup.
    const cartRows = page.locator('#cart_info_table tbody tr');
    await expect(page.getByText('Cart is empty! Click here to buy products.')).toBeVisible();
    await expect(cartRows).toHaveCount(0);

    // 3. Navigate independently to Products, locate Blue Top, and open its View Product detail page.
    await page.goto('/products');
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
    const blueTopCard = page.locator('.features_items .product-image-wrapper:has(.single-products > .productinfo > p:text-is("Blue Top"))');
    await expect(blueTopCard).toHaveCount(1);
    const viewProduct = blueTopCard.locator('.choose a[href="/product_details/1"]');
    await expect(viewProduct).toHaveCount(1);
    await expect(viewProduct).toHaveAttribute('href', '/product_details/1');
    await viewProduct.click();
    // The retained trace showed this full-page Google vignette in #aswift_3,
    // with an accessible “Close ad” button in its cross-origin frame.
    const vignetteFrame = page.locator('iframe#aswift_3[title="Advertisement"]');
    if (await vignetteFrame.isVisible()) {
      const closeVignette = page.frameLocator('iframe#aswift_3').getByRole('button', { name: 'Close ad' });
      await expect(closeVignette).toBeVisible();
      await closeVignette.click();
      await expect(vignetteFrame).toBeHidden();
      if (!/\/product_details\/1$/.test(page.url())) {
        await viewProduct.click();
      }
    }
    await expect(page).toHaveURL(/\/product_details\/1$/);
    await expect(page.getByRole('heading', { name: 'Blue Top' })).toBeVisible();
    await expect(page.locator('.product-information').getByText('Rs. 500', { exact: true })).toBeVisible();
    const quantity = page.locator('.product-information #quantity');
    await expect(quantity).toHaveValue('1');

    // 4. Set the Blue Top quantity spinbutton explicitly to 2, verify it remains 2, and select Add to cart.
    await quantity.fill('2');
    await expect(quantity).toHaveValue('2');
    await page.locator('.product-information').getByRole('button', { name: /Add to cart/ }).click();
    const addModal = page.locator('#cartModal');
    await expect(addModal.getByRole('heading', { name: 'Added!' })).toBeVisible();
    await expect(addModal.getByText('Your product has been added to cart.')).toBeVisible();
    await expect(addModal.getByRole('button', { name: 'Continue Shopping' })).toBeVisible();
    await expect(addModal.getByRole('link', { name: 'View Cart' })).toBeVisible();

    // 5. Select View Cart from the confirmation.
    await addModal.getByRole('link', { name: 'View Cart' }).click();
    await expect(cartRows).toHaveCount(1);
    const blueTopRow = cartRows.filter({ has: page.getByRole('link', { name: 'Blue Top', exact: true }) });
    await expect(blueTopRow).toHaveCount(1);
    await expect(blueTopRow.getByRole('link', { name: 'Blue Top', exact: true })).toBeVisible();
    await expect(blueTopRow.locator('.cart_price')).toHaveText('Rs. 500');
    await expect(blueTopRow.getByRole('button', { name: '2', exact: true })).toBeVisible();
    await expect(blueTopRow.locator('.cart_total')).toHaveText('Rs. 1000');
  });
});
