# Products cart quantity behaviors

## Application Overview

Automation Exercise cart coverage for Blue Top. Observed UI: product detail /product_details/1 displays Blue Top, Rs. 500, a Quantity spinbutton initially set to 1, and Add to cart; successful addition opens an “Added!” confirmation with “Your product has been added to cart.”, Continue Shopping, and View Cart. Cart renders table columns Item, Description, Price, Quantity, and Total; an empty cart renders “Cart is empty! Click here to buy products.” Search for “Blue Top” renders “Searched Products” and a Blue Top product card. Limitations observed during exploration: a Google vignette can intercept a product-link click, and the planner form-fill abstraction does not accept a spinbutton type (an implementation should use a direct locator). Every planned case must create a fresh browser context with no shared storageState and must not delete cart rows to recover its precondition.

## Test Scenarios

### 1. Blue Top cart flows

**Seed:** `tests/seed.spec.ts`

#### 1.1. adds Blue Top with quantity 2 from product details

**File:** `tests/products-cart/blue-top-detail-quantity.spec.ts`

**Steps:**
  1. Create a fresh browser context for this case without loading or sharing storageState; navigate to Cart.
    - expect: Isolation requirement: this case owns its browser context and data; it has no dependency on any other case.
  2. Assert the Cart precondition without performing recovery cleanup.
    - expect: Observed empty-cart message “Cart is empty! Click here to buy products.” is visible.
    - expect: Zero product rows are present. If the cart is not empty, fail this case; do not delete items automatically.
  3. Navigate independently to Products, locate Blue Top, and open its View Product detail page.
    - expect: Observed product-detail identity: heading “Blue Top”, unit price “Rs. 500”, and Quantity spinbutton initially “1” are visible.
  4. Set the Blue Top quantity spinbutton explicitly to 2, verify it remains 2, and select Add to cart.
    - expect: Observed successful-add announcement appears: heading “Added!” and text “Your product has been added to cart.”.
    - expect: Observed confirmation offers “Continue Shopping” and “View Cart”.
  5. Select View Cart from the confirmation.
    - expect: Exactly one Blue Top product row is present.
    - expect: Cart row name is “Blue Top”; unit price is “Rs. 500”; quantity is “2”; total is “Rs. 1000”.
    - expect: Assumption under test: a detail-page quantity of 2 is reflected as one cart row with the calculated total.

#### 1.2. increments Blue Top quantity when it is added twice

**File:** `tests/products-cart/blue-top-repeated-add.spec.ts`

**Steps:**
  1. Create a fresh browser context for this case without loading or sharing storageState; navigate to Cart.
    - expect: Isolation requirement: this case owns its browser context and data; it has no dependency on any other case.
  2. Assert the Cart precondition without performing recovery cleanup.
    - expect: Observed empty-cart message “Cart is empty! Click here to buy products.” is visible.
    - expect: Zero product rows are present. If the cart is not empty, fail this case; do not delete items automatically.
  3. Navigate independently to Products and use the Blue Top product card to Add to cart once.
    - expect: Observed successful-add announcement appears: “Added!” and “Your product has been added to cart.”.
    - expect: Observed confirmation provides Continue Shopping and View Cart.
  4. Choose Continue Shopping, then add the same Blue Top product card a second time.
    - expect: The same observed successful-add announcement appears after the second action.
    - expect: View Cart is available in the second confirmation.
  5. Select View Cart from the second confirmation.
    - expect: Assumption under test: two separate adds consolidate into exactly one Blue Top product row.
    - expect: Expected cart row values: name “Blue Top”, unit price “Rs. 500”, quantity “2”, total “Rs. 1000”.

#### 1.3. searches for Blue Top and verifies observed matching results

**File:** `tests/products-cart/search-blue-top.spec.ts`

**Steps:**
  1. Create a fresh browser context for this case without loading or sharing storageState; navigate to Cart.
    - expect: Isolation requirement: this case owns its browser context and data; it has no dependency on any other case.
  2. Assert the Cart precondition without performing recovery cleanup.
    - expect: Observed empty-cart message “Cart is empty! Click here to buy products.” is visible.
    - expect: Zero product rows are present. If the cart is not empty, fail this case; do not delete items automatically.
  3. Navigate independently to Products, enter “Blue Top” in the observed Search Product field, and submit with the search button.
    - expect: The URL reflects the submitted search as /products?search=Blue%20Top.
    - expect: Observed heading “Searched Products” is visible.
  4. Inspect the returned product cards.
    - expect: At least one logical product result is present. Treat the normal and overlay variants of the same product card as one logical result; do not count them twice.
    - expect: Every returned logical product name contains “Blue Top”, case-insensitively.
    - expect: Observed result contract: Blue Top is displayed with price “Rs. 500”, Add to cart, and View Product linking to /product_details/1.

#### 1.4. adds Blue Top with explicit quantity 1 and shows one exact cart row

**File:** `tests/products-cart/blue-top-detail-quantity-one.spec.ts`

**Steps:**
  1. Create a fresh browser context for this case without loading or sharing storageState; navigate to Cart.
    - expect: Isolation requirement: this case owns its browser context and data; it has no dependency on any other case.
  2. Assert the Cart precondition without performing recovery cleanup.
    - expect: Observed empty-cart message “Cart is empty! Click here to buy products.” is visible.
    - expect: Zero product rows are present. If the cart is not empty, fail this case; do not delete items automatically.
  3. Navigate independently to Blue Top’s product detail from Products and explicitly set the Quantity spinbutton to 1 before selecting Add to cart.
    - expect: Observed detail UI identifies “Blue Top” and “Rs. 500”.
    - expect: The explicit quantity control value is 1 before the add action.
    - expect: Observed successful-add announcement is “Added!” / “Your product has been added to cart.” and offers View Cart.
  4. Open View Cart from the confirmation.
    - expect: Exactly one product row is present.
    - expect: The sole row name is “Blue Top”.
    - expect: The sole row unit price is “Rs. 500”.
    - expect: The sole row quantity is “1”.
    - expect: The sole row total is “Rs. 500”.
    - expect: Assumption under test: explicitly entering 1 produces a single, non-duplicated row.

#### 1.5. deletes prepared Blue Top and shows the empty cart

**File:** `tests/products-cart/delete-blue-top.spec.ts`

**Steps:**
  1. Create a fresh browser context for this case without loading or sharing storageState; navigate to Cart.
    - expect: Isolation requirement: this case owns its browser context and data; it has no dependency on any other case.
  2. Assert the Cart precondition without performing recovery cleanup.
    - expect: Observed empty-cart message “Cart is empty! Click here to buy products.” is visible.
    - expect: Zero product rows are present. If the cart is not empty, fail this case; do not delete items automatically.
  3. Within this same test case, independently navigate to Blue Top’s detail page, explicitly set Quantity to 1, add it, and open View Cart.
    - expect: Observed successful-add announcement is displayed before viewing the cart.
    - expect: Exactly one prepared Blue Top cart row is visible before deletion.
  4. Activate the prepared Blue Top row’s inner × delete control.
    - expect: Zero product rows remain.
    - expect: Observed empty-cart message “Cart is empty! Click here to buy products.” is visible.
    - expect: Assumption under test: deleting the sole prepared row transitions Cart to its empty state.
