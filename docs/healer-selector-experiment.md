# Healer selector experiment

**Branch:** `experiment/healer-selector`
**Starting point:** commit `6650e37267a8b352103a3b41bbc30f5646311ee5` (`docs: record verified CI results and ad dismissal`)

## Objective

Create a controlled locator failure in the Blue Top search case, preserving its assertions and expected results, and then diagnose it with the healer.

## Baseline

Before changing the spec, only this scenario ran:

```bash
npx playwright test tests/products-cart/search-blue-top.spec.ts --project=chromium
```

**Observed result:** 1 passed (5.2 s).

## Exact experimental change

File: `tests/products-cart/search-blue-top.spec.ts`

```diff
- await page.locator('#submit_search').click();
+ await page.locator('#submit_search_nonexistent').click();
```

No assertions, expected results, data, flow, or other tests were changed.

## Controlled execution

Only the same scenario ran with:

```bash
npx playwright test tests/products-cart/search-blue-top.spec.ts --project=chromium --retries=0 --trace=retain-on-failure
```

**Observed result:** expected failure. After navigating to `/products` and filling Search Product with `Blue Top`, Playwright exhausted the 30-second test timeout at:

```text
locator.click: Test timeout of 30000ms exceeded.
waiting for locator('#submit_search_nonexistent')
```

The evidence identifies the altered locator as the cause: failure occurred on that exact line, before the search URL assertion and without evidence of a vignette, navigation block, or application issue. The retained trace was located at:

```text
test-results/products-cart-search-blue--a2b8d-s-observed-matching-results-chromium/trace.zip
```

## `playwright_test_healer` diagnosis

**Agent action.** The healer ran in diagnosis-only mode without editing files. It reviewed the error, trace, and browser button.

**Observed DOM evidence:**

```html
<button type="button" id="submit_search" class="btn btn-default btn-lg">
  <i class="fa fa-search"></i>
</button>
```

The proposed locator was `page.locator('#submit_search')`. In the browser it resolved exactly one visible and enabled element: one `<button type="button">`.

**Diagnosed cause:** `#submit_search_nonexistent` does not exist; the timeout was not attributed to an ad, navigation, assertion, or application defect.

## Human approval and repair

**Human approval.** The healer's minimal proposed diff was approved.

**Agent action.** `playwright_test_healer` applied only the approved repair:

```diff
- await page.locator('#submit_search_nonexistent').click();
+ await page.locator('#submit_search').click();
```

It did not modify documentation, other tests, assertions, expected results, retries, or timeouts. The healer's follow-up check confirmed the spec matched its baseline content and `git diff --check` passed.

## Follow-up validation

**Main-agent executions.** The healer did not perform these executions.

1. Repaired search scenario:

   ```bash
   npx playwright test tests/products-cart/search-blue-top.spec.ts --project=chromium --retries=0
   ```

   **Observed result:** 1 passed (5.1 s).

2. Five product and cart scenarios:

   ```bash
   npx playwright test tests/products-cart --project=chromium --retries=0
   ```

   **Observed result:** 5 passed (7.5 s).

Assertions and expected results were retained throughout the experiment; only the search-button locator was altered and restored.
