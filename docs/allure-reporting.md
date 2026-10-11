# Integración de Allure

## Decisiones de configuración

- `allure-playwright` se ejecuta junto al reporter HTML de Playwright. Así, `playwright-report/` se conserva sin sustituirlo.
- `trace: 'retain-on-failure'` y `screenshot: 'only-on-failure'` generan diagnósticos solo para fallos, incluso cuando una ejecución usa cero reintentos.
- No hay `afterEach` personalizado para adjuntar `trace.zip`. El reporter de Allure consume los adjuntos que Playwright entrega al finalizar la prueba y reconoce los traces automáticamente. Esto evita intentar adjuntar un archivo antes de que Playwright cierre el contexto y termina de escribirlo, y evita duplicarlo.
- El paquete local `allure` genera Allure Report 3 en `allure-report/` desde `allure-results/`. Es un CLI basado en Node.js, por lo que no requiere Java.

## Uso local

```bash
npm ci
npx playwright test tests/products-cart --project=chromium
npm run allure:generate
npm run allure:open
```

`allure-results/` y `allure-report/` son salidas generadas y están ignoradas por Git. Para una prueba fallida, descarga el adjunto `trace.zip` desde Allure y ábrelo localmente:

```bash
npx playwright show-trace trace.zip
```

Allure conserva el archivo adjunto; Trace Viewer es el visor destinado a abrir el ZIP. Esta integración no depende de ni promete un visor de traces embebido en el reporte de Allure.

## CI

El workflow instala Node 24 y Chromium; ejecuta los cinco casos de `tests/products-cart` en Chromium y después intenta generar Allure Report 3 mediante un paso `always()`. El paso de pruebas no usa `continue-on-error`, de modo que un fallo de pruebas sigue haciendo fallar el job. Se publican como artifacts `playwright-report/`, `test-results/`, `allure-results/` y `allure-report/`. No se configura GitHub Pages ni historial de Allure.

## Validación observada

La validación se hizo con `allure-playwright` 3.13.0 y Allure Report 3.20.1.

1. Los cinco casos de `tests/products-cart` aprobaron en Chromium en 8.0 s. Se generaron cinco resultados en `allure-results/` y el reporte Allure 3 en `allure-report/`.
2. Para comprobar diagnósticos sin alterar el estado final, se cambió temporalmente solo `#submit_search` por `#submit_search_nonexistent` en `search-blue-top.spec.ts`. El caso se ejecutó con `--retries=0`, falló por esperar ese locator inexistente y Allure lo registró como `broken`.
3. El resultado del experimento contiene exactamente un adjunto de cada tipo: `screenshot` (`image/png`), `error-context` (`text/markdown`) y `trace` (`application/vnd.allure.playwright-trace`). No se añadió código de adjuntos, por lo que no hay una segunda copia manual de la captura ni del trace.
4. La validación estructural ejecutó `unzip -t` sobre el ZIP de trace: no detectó errores y encontró `test.trace`, `1-trace.network` y frames de screencast. La apertura real también se comprobó con `npx playwright show-trace <trace.zip>`: Trace Viewer cargó el caso, el snapshot de `/products` y la acción fallida `locator('#submit_search_nonexistent')`.
5. Se restauró exactamente el selector original antes de finalizar. `git diff -- tests/products-cart` no muestra cambios. Los resultados del experimento se dejaron fuera del repositorio y se restauró el reporte de la ejecución de cinco aprobados; no se repitió la suite después de la restauración porque los tests quedaron idénticos y no hubo otro cambio de tests.
