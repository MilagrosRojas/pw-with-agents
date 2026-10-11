import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';

// spec: specs/products-cart.md
// seed: tests/seed.spec.ts

test.describe('Blue Top cart flows', () => {
  test('adds Blue Top with explicit quantity 1 and shows one exact cart row', async ({ page }) => {
    await allure.description(`
## Objective
Verify that adding **Blue Top** from its detail page with an explicit quantity of \`1\` produces one exact cart row.

## Preconditions and case independence
- The case uses Playwright's isolated \`page\` fixture; it does not load or share \`storageState\`.
- It first verifies the empty-cart message and zero rows; it does not delete products to restore that condition.
- All data is prepared within this same case, without depending on another case.

## Test data
- Product: \`Blue Top\`.
- Expected detail: \`/product_details/1\` and \`Rs. 500\`.
- Requested quantity: \`1\`.
- Expected total: \`Rs. 500\`.

## Steps
1. Open the cart and confirm that it is empty and has no rows.
2. Open Products, verify **All Products**, locate the single Blue Top card, and validate that its single **View Product** link points to \`/product_details/1\`.
3. Activate **View Product**. Only if the observed advertising vignette is visible, verify its accessible **Close ad** button, close it, and activate **View Product** again only if the URL is still not the detail URL.
4. Verify the detail URL, the Blue Top heading, and \`Rs. 500\`; enter \`1\` in Quantity and confirm that value.
5. Add the product, verify the **Added!** modal, its message, and **View Cart**, then open the cart from that modal.
6. Verify the single prepared Blue Top row.

## Expected results
- The detail shows Blue Top and \`Rs. 500\`, and Quantity retains \`1\` before adding.
- The modal confirms that the product was added and offers **View Cart**.
- The cart contains exactly one row: Blue Top name, \`Rs. 500\` unit price, \`1\` quantity, and \`Rs. 500\` total.
`);
    // 1. Create a fresh browser context for this case without loading or sharing storageState; navigate to Cart.
    await page.goto('/view_cart');

    // 2. Assert the Cart precondition without performing recovery cleanup.
    const cartRows = page.locator('#cart_info_table tbody tr');
    await expect(page.getByText('Cart is empty! Click here to buy products.')).toBeVisible();
    await expect(cartRows).toHaveCount(0);

    // 3. Navigate independently to Blue Top’s product detail from Products and explicitly set the Quantity spinbutton to 1 before selecting Add to cart.
    await page.goto('/products');
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
    const blueTopCard = page.locator('.features_items .product-image-wrapper:has(.single-products > .productinfo > p:text-is("Blue Top"))');
    await expect(blueTopCard).toHaveCount(1);
    const viewProduct = blueTopCard.locator('.choose a[href="/product_details/1"]');
    await expect(viewProduct).toHaveCount(1);
    await expect(viewProduct).toHaveAttribute('href', '/product_details/1');
    await viewProduct.click();
    // The retained trace showed this full-page Google vignette after the URL
    // changes to #google_vignette, with a visible advertisement frame and an
    // accessible “Close ad” button in its cross-origin frame.
    const vignetteFrameSelector = 'ins[data-vignette-loaded="true"] iframe[title="Advertisement"]:visible';
    const vignetteFrame = page.locator(vignetteFrameSelector);
    if (page.url().includes('#google_vignette')) {
      await expect(vignetteFrame).toHaveCount(1);
      const closeVignette = page.frameLocator(vignetteFrameSelector).getByRole('button', { name: 'Close ad' });
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
    await quantity.fill('1');
    await expect(quantity).toHaveValue('1');
    await page.locator('.product-information').getByRole('button', { name: /Add to cart/ }).click();
    const addModal = page.locator('#cartModal');
    await expect(addModal.getByRole('heading', { name: 'Added!' })).toBeVisible();
    await expect(addModal.getByText('Your product has been added to cart.')).toBeVisible();
    await expect(addModal.getByRole('link', { name: 'View Cart' })).toBeVisible();

    // 4. Open View Cart from the confirmation.
    await addModal.getByRole('link', { name: 'View Cart' }).click();
    await expect(cartRows).toHaveCount(1);
    const blueTopRow = cartRows.filter({ has: page.getByRole('link', { name: 'Blue Top', exact: true }) });
    await expect(blueTopRow).toHaveCount(1);
    await expect(blueTopRow.getByRole('link', { name: 'Blue Top', exact: true })).toBeVisible();
    await expect(blueTopRow.locator('.cart_price')).toHaveText('Rs. 500');
    await expect(blueTopRow.getByRole('button', { name: '1', exact: true })).toBeVisible();
    await expect(blueTopRow.locator('.cart_total')).toHaveText('Rs. 500');
  });
});
