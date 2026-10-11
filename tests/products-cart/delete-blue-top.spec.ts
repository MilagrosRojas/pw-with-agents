import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';

// spec: specs/products-cart.md
// seed: tests/seed.spec.ts

test.describe('Blue Top cart flows', () => {
  test('deletes prepared Blue Top and shows the empty cart', async ({ page }) => {
    await allure.description(`
## Objective
Verify that deleting the single prepared **Blue Top** row returns the cart to its empty state.

## Preconditions and case independence
- The case uses Playwright's isolated \`page\` fixture; it does not load or share \`storageState\`.
- Before preparing Blue Top, it verifies the empty-cart message and zero rows; it does not delete products to restore that condition.
- The product that is deleted is added within the same case, so there is no dependency on other cases.

## Test data
- Product: \`Blue Top\`.
- Expected detail link: \`/product_details/1\`.
- Prepared quantity: \`1\`.
- Expected values before deletion: \`Rs. 500\`, quantity \`1\`, and total \`Rs. 500\`.

## Steps
1. Open the cart and confirm that it is empty and has no rows.
2. Open Products, verify **All Products**, locate the single Blue Top card, and verify its single **View Product** link to \`/product_details/1\`.
3. Activate **View Product**. Only if the observed advertising vignette appears, validate the **Close ad** button, close it, and activate **View Product** again only if the URL is still not the detail URL.
4. Verify the detail URL, enter Quantity \`1\`, confirm it, add to the cart, and open **View Cart** from the confirmation modal.
5. Verify the values of the single prepared Blue Top row and activate its \`×\` deletion control.

## Expected results
- Before deletion, there is exactly one Blue Top row with \`Rs. 500\` price, \`1\` quantity, and \`Rs. 500\` total.
- After deleting it, no rows remain and \`Cart is empty! Click here to buy products.\` is displayed.
`);
    // 1. Create a fresh browser context for this case without loading or sharing storageState; navigate to Cart.
    await page.goto('/view_cart');

    // 2. Assert the Cart precondition without performing recovery cleanup.
    const cartRows = page.locator('#cart_info_table tbody tr');
    await expect(page.getByText('Cart is empty! Click here to buy products.')).toBeVisible();
    await expect(cartRows).toHaveCount(0);

    // 3. Within this same test case, independently navigate to Blue Top’s detail page, explicitly set Quantity to 1, add it, and open View Cart.
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
    const quantity = page.locator('.product-information #quantity');
    await quantity.fill('1');
    await expect(quantity).toHaveValue('1');
    await page.locator('.product-information').getByRole('button', { name: /Add to cart/ }).click();
    const addModal = page.locator('#cartModal');
    await expect(addModal.getByRole('heading', { name: 'Added!' })).toBeVisible();
    await expect(addModal.getByText('Your product has been added to cart.')).toBeVisible();
    await addModal.getByRole('link', { name: 'View Cart' }).click();
    await expect(cartRows).toHaveCount(1);
    const blueTopRow = cartRows.filter({ has: page.getByRole('link', { name: 'Blue Top', exact: true }) });
    await expect(blueTopRow).toHaveCount(1);
    await expect(blueTopRow.getByRole('link', { name: 'Blue Top', exact: true })).toBeVisible();
    await expect(blueTopRow.locator('.cart_price')).toHaveText('Rs. 500');
    await expect(blueTopRow.getByRole('button', { name: '1', exact: true })).toBeVisible();
    await expect(blueTopRow.locator('.cart_total')).toHaveText('Rs. 500');

    // 4. Activate the prepared Blue Top row’s inner × delete control.
    await blueTopRow.locator('.cart_quantity_delete').click();
    await expect(cartRows).toHaveCount(0);
    await expect(page.getByText('Cart is empty! Click here to buy products.')).toBeVisible();
  });
});
