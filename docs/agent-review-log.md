# Registro de revisión de agentes

Este documento registra decisiones, evidencias y resultados observados durante la preparación de la cobertura de productos y carrito. No infiere estabilidad de la suite a partir de una sola ejecución.

## Planner — exploración y plan revisado

**Acción del agente.** `playwright_test_planner` exploró el sitio y produjo el plan `specs/products-cart.md` para Blue Top y el carrito.

**Revisión humana.** Se pidieron ajustes al plan para separar explícitamente la cantidad `2` elegida desde el detalle de dos adiciones del mismo producto. También se exigió independencia entre casos, carrito inicialmente vacío sin limpieza automática, datos preparados dentro de cada caso y diferenciación entre observaciones y supuestos.

**Resultado observado.** El plan final contiene cinco casos: búsqueda, cantidad 1 desde detalle, cantidad 2 desde detalle, adición repetida y eliminación. Registró como observados el precio `Rs. 500`, la cantidad inicial `1`, el modal `Added!` y el mensaje de carrito vacío; las consolidaciones y totales quedaron como comportamientos bajo prueba.

## Generator — primera implementación

**Acción del agente.** `playwright_test_generator` creó los cinco specs en `tests/products-cart/` a partir del plan.

**Resultado observado.** La primera ejecución informó **2 aprobados y 3 fallidos**. Los fallos correspondían a flujos que usaban el enlace View Product; no se atribuyeron automáticamente a anuncios.

## Healer — reparación rechazada

**Acción del agente.** `playwright_test_healer` revisó los fallos y propuso una reparación de selectores.

**Resultado observado.** Tras esa reparación, el resultado fue **1 aprobado y 4 fallidos**.

**Revisión humana.** La reparación fue rechazada porque asumía de forma incorrecta que View Product era descendiente de `.single-products`. Se solicitó inspección DOM real y una corrección mínima, sin modificar el caso de adición repetida.

## Revisión supervisada — scope de View Product

**Acción de revisión supervisada.** En una sesión diagnóstica se abrió `/products` directamente sólo para inspeccionar el DOM; los tests conservaron el flujo Products → View Product.

**Evidencia observada.** Para Blue Top, `.productinfo` está dentro de `.single-products`, mientras que `.choose` es un hermano de `.single-products` dentro de `.product-image-wrapper`. El contenedor lógico identificado fue `.product-image-wrapper`; dentro de él, `.choose a[href="/product_details/1"]` resolvió exactamente un enlace visible con `href` `/product_details/1`.

**Cambio aplicado bajo revisión.** Se corrigió únicamente el alcance de View Product en los cuatro specs afectados. Se conservaron assertions y el refinamiento de búsqueda que lee sólo la representación no-overlay. El spec de adición repetida no se modificó.

## Viñeta — control identificado en trace y manejo implementado

**Evidencia observada.** Un trace retenido de cantidad 1 mostró que, después de View Product, la URL quedó en `/products#google_vignette`. El documento principal tenía un iframe `#aswift_3` con título `Advertisement`; dentro de su frame de origen cruzado se observó un elemento con `role="button"`, nombre accesible `Close ad` e id `dismiss-button`.

**Acción implementada.** En los tres specs que abren el detalle (cantidad 1, cantidad 2 y eliminación), se añadió un manejo condicional y limitado a ese iframe: comprobar que existe y está visible, exigir que `Close ad` esté visible, cerrarlo con un clic normal, esperar que el iframe se oculte y volver a pulsar View Product sólo si la URL aún no es la del detalle. No se bloquearon anuncios, no se usó `force`, espera fija, navegación directa ni captura de errores de navegación o assertions.

**Limitación observada.** Una reproducción diagnóstica posterior navegó directamente al detalle y no inyectó la viñeta. Por ello, aunque el control se identificó en el trace e implementó en los specs, el cierre del anuncio **no se ejercitó en vivo durante la validación final**.

## Validación final

**Resultado observado.** El caso de cantidad 1 se ejecutó con `--trace=retain-on-failure` y aprobó. Después, los cinco casos se ejecutaron en Chromium: **5 passed (8.6 s)**.

**Condición de entorno.** El primer intento dentro del sandbox no inició Chromium por `MachPortRendezvousServer ... Permission denied (1100)` antes de abrir una página. La validación se completó fuera de ese sandbox con autorización. Este resultado único no demuestra estabilidad futura ni cubre necesariamente la aparición de la viñeta o variaciones del sitio y sus anuncios.
