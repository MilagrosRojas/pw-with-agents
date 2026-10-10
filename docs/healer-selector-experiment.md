# Experimento de selector para healer

**Rama:** `experiment/healer-selector`
**Punto de partida:** commit `6650e37267a8b352103a3b41bbc30f5646311ee5` (`docs: record verified CI results and ad dismissal`)

## Objetivo

Crear de forma controlada un fallo de locator en el caso de búsqueda Blue Top, conservando sus assertions y resultados esperados, para diagnosticarlo posteriormente con el healer.

## Línea base

Antes de modificar el spec se ejecutó exclusivamente:

```bash
npx playwright test tests/products-cart/search-blue-top.spec.ts --project=chromium
```

**Resultado observado:** 1 passed (5.2 s).

## Cambio experimental exacto

Archivo: `tests/products-cart/search-blue-top.spec.ts`

```diff
- await page.locator('#submit_search').click();
+ await page.locator('#submit_search_nonexistent').click();
```

No se modificaron assertions, resultados esperados, datos, flujo ni otros tests.

## Ejecución controlada

Se ejecutó exclusivamente el mismo caso con:

```bash
npx playwright test tests/products-cart/search-blue-top.spec.ts --project=chromium --retries=0 --trace=retain-on-failure
```

**Resultado observado:** fallo esperado. Tras navegar a `/products` y rellenar el campo Search Product con `Blue Top`, Playwright agotó el timeout de prueba de 30 s en:

```text
locator.click: Test timeout of 30000ms exceeded.
waiting for locator('#submit_search_nonexistent')
```

La evidencia señala el locator alterado como causa: el fallo ocurrió exactamente en esa línea, antes de la assertion de URL de búsqueda y sin evidencia de una viñeta, bloqueo de navegación u otro problema de aplicación. Se retuvo el trace en:

```text
test-results/products-cart-search-blue--a2b8d-s-observed-matching-results-chromium/trace.zip
```

## Diagnóstico de `playwright_test_healer`

**Acción del agente.** El healer operó en modo de diagnóstico sin editar archivos. Revisó el error, el trace y el botón en Chromium.

**Evidencia DOM observada:**

```html
<button type="button" id="submit_search" class="btn btn-default btn-lg">
  <i class="fa fa-search"></i>
</button>
```

El locator propuesto fue `page.locator('#submit_search')`. En el navegador resolvió exactamente un elemento (`count: 1`), visible y habilitado, correspondiente a un único `<button type="button">`.

**Causa diagnosticada:** `#submit_search_nonexistent` no existe; el timeout no se atribuyó a anuncio, navegación, assertion ni defecto de aplicación.

## Aprobación humana y reparación

**Aprobación humana.** Se aprobó el diff mínimo propuesto por el healer.

**Acción del agente.** `playwright_test_healer` aplicó exclusivamente la reparación aprobada:

```diff
- await page.locator('#submit_search_nonexistent').click();
+ await page.locator('#submit_search').click();
```

No modificó documentación, otros tests, assertions, resultados esperados, retries ni timeouts. La comprobación posterior del healer confirmó que el spec volvió a coincidir con su contenido base y que `git diff --check` pasó.

## Validación posterior

**Ejecuciones del agente principal.** No fueron ejecutadas por el healer.

1. Caso de búsqueda reparado:

   ```bash
   npx playwright test tests/products-cart/search-blue-top.spec.ts --project=chromium --retries=0
   ```

   **Resultado observado:** 1 passed (5.1 s).

2. Cinco casos de productos y carrito:

   ```bash
   npx playwright test tests/products-cart --project=chromium --retries=0
   ```

   **Resultado observado:** 5 passed (7.5 s).

Las assertions y los resultados esperados se conservaron durante todo el experimento; sólo se alteró y restauró el locator del botón de búsqueda.
