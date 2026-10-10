import { test, expect } from '@playwright/test';

// spec: specs/products-cart.md
// seed: tests/seed.spec.ts

test.describe('Blue Top cart flows', () => {
  test('deletes prepared Blue Top and shows the empty cart', async ({ page }) => {
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
