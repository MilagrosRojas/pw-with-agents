# Automation Exercise AI QA

Proyecto de automatización end-to-end para los flujos de productos y carrito de [Automation Exercise](https://automationexercise.com/). El alcance actual cubre la búsqueda de **Blue Top**, su adición al carrito desde listado y detalle, y su eliminación.

## Herramientas

- Node.js y npm.
- Playwright Test con TypeScript.
- Chromium, Firefox y WebKit configurados en `playwright.config.ts`.
- Allure Report y el informe HTML de Playwright para conservar resultados y diagnósticos de fallos.
- GitHub Actions para ejecutar la suite y publicar ambos informes como artefactos.

## Casos implementados

Los cinco casos están en `tests/products-cart/` y se planificaron en `specs/products-cart.md`:

1. Buscar `Blue Top` y validar que hay al menos un resultado lógico y que todos sus nombres contienen el término, sin duplicar la variante overlay de cada tarjeta.
2. Agregar Blue Top desde el detalle con cantidad explícita `1`; validar una fila con nombre, precio unitario `Rs. 500`, cantidad `1` y total `Rs. 500`.
3. Agregar Blue Top desde el detalle con cantidad `2`; validar una fila con nombre, precio unitario `Rs. 500`, cantidad `2` y total `Rs. 1000`.
4. Agregar Blue Top dos veces desde el listado; validar una única fila acumulada con cantidad `2` y total `Rs. 1000`.
5. Preparar Blue Top en el mismo caso, comprobar sus valores de fila y eliminarlo; validar que no quedan filas y aparece el carrito vacío.

Cada caso usa el fixture `page` de Playwright y valida que el carrito empieza vacío sin limpiar productos como recuperación automática.

## Ejecución en Chromium

```bash
npx playwright test tests/products-cart --project=chromium
```

## Reportes Allure

Instala las dependencias del proyecto y genera el reporte después de ejecutar las pruebas:

```bash
npm ci
npx playwright test tests/products-cart --project=chromium
npm run allure:generate
npm run allure:open
```

Allure Report 3 se ejecuta con Node.js: no añade un requisito de Java. Los resultados crudos se escriben en `allure-results/` y el informe generado en `allure-report/`; ambos directorios son generados e ignorados por Git. El reporte HTML de Playwright continúa en `playwright-report/`.

La configuración conserva screenshots y traces solo cuando una prueba falla. `allure-playwright` reconoce automáticamente los adjuntos que Playwright produce al finalizar la prueba, incluido el `trace.zip`, por lo que no se usa un `afterEach` que pudiera leerlo antes de cerrar el contexto ni código adicional que duplicase adjuntos. Para inspeccionar un trace, descárgalo desde el resultado de Allure y ábrelo con Playwright Trace Viewer:

```bash
npx playwright show-trace trace.zip
```

No se promete un visor de traces integrado en la interfaz de Allure: el ZIP descargado se abre con Trace Viewer.

Último resultado observado localmente: **5 passed (8.6 s)**. Es una única ejecución satisfactoria, no una garantía de estabilidad de la suite ni de disponibilidad continua del sitio externo.

El reporte de CI del commit [`d7d760b`](https://github.com/MilagrosRojas/automationexercise-ai-qa/actions/runs/38065877721) aporta evidencia adicional: los cinco casos de Chromium aprobaron con `retry: 0`; la ejecución de Playwright duró aproximadamente 29 s y el cierre de la viñeta se ejercitó correctamente en los casos de cantidad 1 y cantidad 2. Esta evidencia de una ejecución tampoco garantiza estabilidad futura.

## Requisitos y notas de ejecución

- Node.js compatible con el proyecto y `npm ci`.
- Navegadores de Playwright instalados, por ejemplo: `npx playwright install --with-deps`.
- Acceso de red a `https://automationexercise.com/`; los resultados también dependen de contenido de terceros servido por el sitio.
- En este entorno macOS, Chromium no pudo iniciarse dentro del sandbox: `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`. La ejecución del navegador necesitó autorización fuera de ese sandbox.
- El flujo de detalle puede recibir una viñeta de Google. El manejo de los specs se limita al iframe observado `#aswift_3` y a su botón accesible `Close ad`; no bloquea anuncios globalmente.

## Agentes de Playwright y portabilidad

Los archivos `.codex/agents/playwright_test_*.toml` conservan rutas absolutas locales para Node 24.18.0 y para `node_modules/playwright/cli.js`. Al clonar el repositorio, instala las dependencias, activa la versión indicada en `.nvmrc` y actualiza ambos valores de cada TOML a las rutas locales de la nueva máquina.

Se evaluó la configuración portable generada por `npx playwright init-agents --loop codex`:

```toml
command = "npx"
args = ["playwright", "run-test-mcp-server"]
```

No se conservó en este entorno. Desde la raíz del proyecto, el `npx` disponible resolvió `/opt/homebrew/bin/node` (Node 20.8.0), que no inicia porque falta una biblioteca ICU. Con Node 24.18.0 activado desde `.nvmrc`, `npx --no-install playwright --version` sí resolvió Playwright 1.64.0. Como el lanzador de agentes no documenta que herede ese `PATH` ni que resuelva rutas relativas desde la raíz, no se sustituyeron las rutas absolutas actuales. Antes de adoptar la variante portable en otra máquina, valida desde la raíz `node --version`, `npx --no-install playwright --version` y el arranque del MCP con `planner_setup_page`.

## GitHub Actions

El workflow [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) usa Node 24, ejecuta `npm ci`, instala Chromium con sus dependencias y ejecuta exclusivamente:

```bash
npx playwright test tests/products-cart --project=chromium
```

Se activa en `push` y `pull_request` hacia `main` o `master`, y también permite ejecución manual con `workflow_dispatch`. La ejecución conserva su estado fallido aunque la generación de Allure Report 3 se ejecuta con `always()`. El informe HTML (`playwright-report/`), los resultados de Playwright (`test-results/`), `allure-results/` y `allure-report/` se conservan como artifacts incluso cuando fallan las pruebas. Firefox y WebKit siguen configurados en `playwright.config.ts`, pero están pendientes de validación en CI para este alcance actual.
