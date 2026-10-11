# PW with Agents

An end-to-end automation project for the product and cart flows of [Automation Exercise](https://automationexercise.com/). The current scope covers searching for **Blue Top**, adding it from the listing and detail page, and deleting it from the cart.

The GitHub repository is `MilagrosRojas/pw-with-agents`. The npm package is intentionally still named `automationexercise-ai-qa`; package and repository names do not need to match.

## Tooling

- Node.js 24.18.0 (see `.nvmrc`) and npm.
- Playwright Test with TypeScript.
- Chromium, Firefox, and WebKit configured in `playwright.config.ts`.
- Allure Report 3 and the Playwright HTML report for results and failure diagnostics.
- GitHub Actions for the scoped Chromium suite and report artifacts.
- Local Codex planner, generator, and healer agents; GitHub Actions does not run those agents.

## Implemented scenarios

The five scenarios live in `tests/products-cart/` and are planned in `specs/products-cart.md`:

1. Search for `Blue Top`; verify at least one logical result and that every logical product name contains the term, without counting a card overlay twice.
2. Add Blue Top from details with explicit quantity `1`; verify one row with name, `Rs. 500` unit price, quantity `1`, and `Rs. 500` total.
3. Add Blue Top from details with quantity `2`; verify one row with name, `Rs. 500` unit price, quantity `2`, and `Rs. 1000` total.
4. Add Blue Top twice from the listing; verify one accumulated row with quantity `2` and `Rs. 1000` total.
5. Prepare Blue Top in the same case, verify its row values, delete it, and verify that no rows remain and the cart is empty.

Every scenario uses Playwright's `page` fixture and verifies that the cart starts empty without deleting products as automatic recovery.

## Local execution

```bash
npm ci
npx playwright install --with-deps chromium
npx playwright test tests/products-cart --project=chromium
```

The focused command above runs only the five product-cart scenarios. A bare `npx playwright test --project=chromium` discovers eight tests: the five product-cart specs plus `tests/seed.spec.ts` and `tests/example.spec.ts` (two tests). `seed.spec.ts` is the documented seed/reference for the product-cart plan and agents; it is not imported by those specs. `example.spec.ts` is the Playwright starter example. Neither file is part of the focused CI command, but both remain available for local full-suite discovery.

## Allure reports

Run the suite, generate the report, and open it locally:

```bash
npx playwright test tests/products-cart --project=chromium
npm run allure:generate
npm run allure:open
```

Allure Report 3 runs on Node.js and adds no Java requirement. Raw results are written to `allure-results/`, and the generated report to `allure-report/`; both are generated and ignored by Git. The Playwright HTML report remains in `playwright-report/`.

The configuration retains screenshots and traces only when a test fails. `allure-playwright` automatically receives Playwright attachments after a test completes, including `trace.zip`; no custom `afterEach` reads an incomplete file before the context closes, and no custom code duplicates attachments. Download a trace from an Allure result and open it with Playwright Trace Viewer:

```bash
npx playwright show-trace trace.zip
```

Allure is not represented as an embedded Trace Viewer: the downloaded ZIP opens in Trace Viewer.

The latest local result during Allure integration was **5 passed (8.1 s)** with `retry: 0`. Vignette dismissal was exercised in the quantity 1, quantity 2, and deletion scenarios. This is one successful execution, not a guarantee of suite stability or continuous availability of the external site.

Historical evidence is retained separately: an earlier local diagnosis recorded **4 passed, 1 failed** because the quantity 2 scenario found both a Google vignette and an anchor ad with visible `Advertisement` iframes; the test failed explicitly on uniqueness rather than selecting an arbitrary iframe. An earlier successful run recorded **5 passed (8.6 s)**.

The CI report for commit [`d7d760b`](https://github.com/MilagrosRojas/pw-with-agents/actions/runs/38065877721) provides additional historical evidence: all five Chromium scenarios passed with `retry: 0`, Playwright ran for about 29 seconds, and vignette dismissal was exercised in quantity 1 and quantity 2. This additional execution is not sufficient to claim future stability.

## Requirements and execution notes

- Node.js 24.18.0 and `npm ci`.
- Playwright browsers installed, for example with `npx playwright install --with-deps`.
- Network access to `https://automationexercise.com/`; results also depend on third-party content served by that site.
- In this macOS environment Chromium could not start inside the sandbox: `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`. Browser execution required permission outside that sandbox.
- Detail navigation can receive a Google vignette. The specs detect `#google_vignette` and require exactly one visible `Advertisement` iframe inside `ins[data-vignette-loaded="true"]` before locating its accessible `Close ad` button; they do not block ads globally. The earlier diagnosis also observed a visible anchor ad, excluded by that specific container. Successful runs did not retain traces because configuration retains them only on failure, so they do not establish that the anchor ad coexisted in those executions.

## Playwright agents and portability

The `.codex/agents/playwright_test_*.toml` files intentionally retain local absolute paths to Node 24.18.0 and `node_modules/playwright/cli.js`. After cloning, install dependencies, activate the `.nvmrc` version, and adapt both values in each TOML to the local machine.

The portable configuration generated by `npx playwright init-agents --loop codex` was evaluated:

```toml
command = "npx"
args = ["playwright", "run-test-mcp-server"]
```

It was not retained in this environment. From the repository root, available `npx` resolved `/opt/homebrew/bin/node` (Node 20.8.0), which could not start because an ICU library was missing. With Node 24.18.0 activated from `.nvmrc`, `npx --no-install playwright --version` resolved Playwright 1.64.0. Because the agent launcher does not document inheriting that `PATH` or resolving relative paths from the repository root, the working absolute paths were retained. Before adopting the portable form on another machine, validate `node --version`, `npx --no-install playwright --version`, and MCP startup with `planner_setup_page` from the repository root.

## GitHub Actions

The [workflow](.github/workflows/playwright.yml) uses Node 24, runs `npm ci`, installs Chromium and its dependencies, and runs only:

```bash
npx playwright test tests/products-cart --project=chromium
```

It runs for pushes and pull requests targeting `main` or `master`, and manually through `workflow_dispatch`. The test failure state is retained even though Allure Report 3 generation uses `always()`. The HTML report (`playwright-report/`), Playwright results (`test-results/`), `allure-results/`, and `allure-report/` are uploaded as artifacts even when tests fail. Firefox and WebKit remain configured in `playwright.config.ts` but are pending CI validation for the current scope.
