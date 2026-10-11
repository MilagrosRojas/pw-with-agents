# Allure integration

## Configuration decisions

- `allure-playwright` runs alongside Playwright's HTML reporter, so `playwright-report/` is retained rather than replaced.
- `trace: 'retain-on-failure'` and `screenshot: 'only-on-failure'` create diagnostics only for failures, including runs that use zero retries.
- There is no custom `afterEach` for `trace.zip`. The Allure reporter consumes attachments that Playwright provides after the test completes and recognizes traces automatically. This avoids attaching a file before Playwright closes the context and finishes writing it, and avoids duplication.
- The local `allure` package generates Allure Report 3 in `allure-report/` from `allure-results/`. It is a Node.js CLI and does not require Java.

## Local use

```bash
npm ci
npx playwright test tests/products-cart --project=chromium
npm run allure:generate
npm run allure:open
```

`allure-results/` and `allure-report/` are generated outputs and are ignored by Git. For a failed test, download the `trace.zip` attachment from Allure and open it locally:

```bash
npx playwright show-trace trace.zip
```

Allure retains the attachment; Trace Viewer is the intended viewer for the ZIP. This integration does not depend on or promise an embedded Trace Viewer.

## CI

The workflow installs Node 24 and Chromium, runs the five `tests/products-cart` scenarios in Chromium, and then attempts to generate Allure Report 3 in an `always()` step. The test step does not use `continue-on-error`, so a test failure still fails the job. `playwright-report/`, `test-results/`, `allure-results/`, and `allure-report/` are uploaded as artifacts. GitHub Pages and Allure history are not configured.

## Historical validation evidence

Validation used `allure-playwright` 3.13.0 and Allure Report 3.20.1.

1. The five `tests/products-cart` scenarios passed in Chromium in 8.0 seconds. Five results were generated in `allure-results/`, and the Allure 3 report was generated in `allure-report/`.
2. To validate diagnostics without changing the final state, only `#submit_search` was temporarily changed to `#submit_search_nonexistent` in `search-blue-top.spec.ts`. The scenario ran with `--retries=0`, failed while waiting for that nonexistent locator, and Allure recorded it as `broken`.
3. The experiment result contained exactly one attachment of each type: `screenshot` (`image/png`), `error-context` (`text/markdown`), and `trace` (`application/vnd.allure.playwright-trace`). No attachment code was added, so there is no manual second copy of the screenshot or trace.
4. Structural validation ran `unzip -t` on the trace ZIP with no errors and found `test.trace`, `1-trace.network`, and screencast frames. Real opening was also checked with `npx playwright show-trace <trace.zip>`: Trace Viewer loaded the scenario, the `/products` snapshot, and the failed `locator('#submit_search_nonexistent')` action.
5. The original selector was restored exactly before completion. At that point, `git diff -- tests/products-cart` reported no test changes. Experiment results were left outside the repository and the report from the five passing scenarios was restored; the suite was not repeated after restoration because the tests were identical and no other test change existed.
