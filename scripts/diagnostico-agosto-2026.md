# Diagnóstico de `agosto.docx`

Qué tiene el documento de agosto de 2026 que impide que
`scripts/boletin_desde_doc.py` lo convierta en el `.md` del sitio, y qué habría
que cambiar **en el documento** para que salga solo.

La referencia es el contrato que el script espera, documentado en la sección 10
de `notas_sitio_web_cele.md` y en el encabezado del propio script. El documento
de julio de 2026 lo cumplía; el de agosto se apartó en siete puntos.

---

## Resumen

| # | Qué pasa | Dónde | Efecto |
|---|---|---|---|
| 1 | El archivo es `.docx` | todo | El script no arranca |
| 2 | Los países están en **Título 1** | los 8 países | Se descarta el boletín entero |
| 3 | La sección de cierre se llama «En seguimiento:» | final | Se pierde la sección |
| 4 | La fecha va sola en su párrafo | los 40 bullets | Se pierden todas las entradas |
| 5 | `ETIQUETAS:` con dos puntos y punto y coma | los 40 bullets | Se pierden todas las etiquetas |
| 6 | Un bullet encabeza «Agosto» en vez del día | Colombia | Se pierde la entrada y sus etiquetas se pegan a la anterior |
| 7 | Dos bullets cubren dos fechas | Argentina, Brasil | La segunda fecha se pierde |

Y tres cosas que no son de formato sino de contenido:

| # | Qué pasa | Cuánto |
|---|---|---|
| 8 | Falta Paraguay | 1 de 9 países |
| 9 | Etiquetas fuera del vocabulario del sitio | 15 distintas, 11 entradas quedan sin etiquetar |
| 10 | El enlace va sobre el verbo y no sobre el expediente | 21 de 40 entradas quedan sin N° de expediente |

Más: el editorial no trae título ni bajada, y hay dos párrafos con estilo de
título y sin texto.

---

## 1. Bloqueantes

Estos tres cortan la conversión antes de que se procese una sola entrada.

### 1.1 El archivo es `.docx` y el script lee Markdown

```
UnicodeDecodeError: 'utf-8' codec can't decode byte 0xa5 in position 46
```

Un `.docx` es un zip; el script abre el archivo como texto y se encuentra con
bytes binarios.

**Qué hacer:** bajar el documento desde Google Docs con
*Archivo → Descargar → Markdown (.md)*, no como Word. La exportación a Markdown
conserva los encabezados y —lo importante— los enlaces.

### 1.2 Los países están con estilo «Título 1»

El script abre un bloque de país cuando ve un encabezado de **nivel 2**
(`## ARGENTINA`). En el documento de agosto los nueve países están en Título 1.

Esto no es un detalle cosmético: el script usa el nivel 1 para reconocer dónde
empiezan las notas internas —el documento también es el manual y la lista de
pendientes, y eso no se publica—. Con los países en Título 1, el primero de
ellos abre las «notas internas» y **desde ahí no se rescata nada**. El resultado
es cero países y el mensaje:

```
error: No encontré ninguna sección de país. ¿Exportaste el documento como
Markdown? Los países tienen que ser encabezados de nivel 2.
```

**Qué hacer:** poner los nueve países en **Título 2**. En Google Docs, el
desplegable de estilos, «Título 2». El único Título 1 es el título del boletín.

### 1.3 La sección de cierre se llama «En seguimiento:»

El script busca un encabezado que diga **«Temas que vienen creciendo»**, que es
como se llamaba en julio. En agosto se llama «En seguimiento:» y está en Título
1, así que cae dentro de las notas internas y no se publica.

**Qué hacer:** conservar el nombre «Temas que vienen creciendo» y ponerlo en
Título 2. (El texto sale publicado bajo el encabezado «En seguimiento», que lo
pone el sitio; el nombre en el documento es sólo la marca que el script busca.)

---

## 2. Cosas que rompen los registros

Estas no cortan la conversión, pero vacían el resultado.

### 2.1 La fecha va sola en su párrafo

En agosto cada bullet está escrito así, en tres párrafos:

```
04/08
Se presentó el Proyecto de Ley 3686-D-2026, que busca derogar…
ETIQUETAS: LIBERTAD DE EXPRESIÓN Y DERECHOS POLÍTICOS
```

El script espera la fecha y el texto **en el mismo párrafo**:

```
**04/08** Se presentó el Proyecto de Ley 3686-D-2026, que busca derogar…
```

Como está, el párrafo de la fecha no tiene texto y el del texto no arranca con
fecha: los dos se descartan, uno por uno, con «ignoré un párrafo que no arranca
con fecha». Son los 40 bullets del mes.

**Qué hacer:** pegar la fecha al principio del texto. Si un bullet necesita dos
párrafos —hay varios en agosto—, el segundo va a quedar suelto igual, así que
conviene que cada bullet sea **un solo párrafo**.

### 2.2 La línea de etiquetas lleva `ETIQUETAS:` y punto y coma

En julio las etiquetas iban solas, en mayúsculas y sin puntuación:

```
LIBERTAD DE EXPRESIÓN DISCURSO DE ODIO
```

En agosto van anunciadas y separadas:

```
ETIQUETAS: DEFENSA DEL CONSUMIDOR; MODERACIÓN DE CONTENIDOS…
```

El script reconoce la línea de etiquetas por su forma: mayúsculas, sin enlaces
y **sin signos de puntuación**. Los dos puntos y el punto y coma la descalifican,
así que la línea no se lee como etiquetas sino como un bullet más, y se descarta
por no arrancar con fecha. Se pierden las etiquetas de las 40 entradas.

**Qué hacer:** dejar la línea sin la palabra `ETIQUETAS:` y sin punto y coma,
una etiqueta atrás de la otra. El script las separa por nombre.

### 2.3 Un bullet de Colombia encabeza «Agosto» en vez del día

```
Agosto
La Corte Constitucional de Colombia destacó en una publicación institucional…
ETIQUETAS: PRIVACIDAD Y DERECHOS ARCO; VIOLENCIA DE GÉNERO; …
```

Sin día, el bullet no se puede convertir en un registro: la entrada se pierde
**y sus etiquetas se le cuelgan al bullet anterior** (el del 12/08, que queda con
etiquetas que no son suyas). Es el caso más silencioso de la lista, porque el
resultado parece correcto.

**Qué hacer:** poner el día. Si de verdad no se sabe, dejar el bullet afuera de
la cronología y mencionarlo en el editorial.

### 2.4 Dos bullets cubren dos fechas

- Argentina: `11/08 & 13/08` — dos proyectos de etiquetado sanitario.
- Brasil: `07/08 & 12/08`.

Cada entrada del boletín tiene una fecha sola. El script se queda con la primera
y la segunda se pierde sin aviso.

**Qué hacer:** partirlos en dos bullets, uno por fecha. Si las dos normas van
juntas porque se leen juntas, dejarlas en el bullet de la primera fecha y
mencionar la segunda dentro del texto.

### 2.5 Dos encabezados de Título 1 vacíos

Hay dos párrafos con estilo de título y sin texto (antes de Colombia y antes de
México). En la exportación a Markdown quedan como un `#` suelto, que el script
lee como contenido del país anterior.

**Qué hacer:** borrarlos. Suelen aparecer al mover bloques de un lado a otro.

---

## 3. Contenido que falta o no sigue el manual

Esto no es formato: aunque el documento se arregle, estas tres cosas hay que
resolverlas en el documento.

### 3.1 Falta Paraguay

El boletín cubre nueve países y el documento trae ocho: Argentina, Brasil,
Chile, Colombia, Ecuador, Guatemala, México y Perú.

**Qué hacer:** si Paraguay no tuvo novedades, va igual, con
«Sin novedades legislativas en agosto». Que se haya mirado y no hubiera nada
también es información, y así lo dibuja el sitio.

### 3.2 Quince etiquetas que no existen en el sitio

El vocabulario del sitio son 17 etiquetas fijas (`data/etiquetas.yaml`). El
documento de agosto usa otras quince, que no entran:

| Veces | Etiqueta del documento | Qué se rescata |
|---:|---|---|
| 16 | LIBERTAD DE EXPRESIÓN Y DERECHOS POLÍTICOS | `libertad-de-expresion` |
| 9 | DERECHOS DE LOS NIÑOS | — |
| 7 | DISCRIMINACIÓN, VIOLENCIA Y DISCURSOS DE ODIO | — |
| 6 | MODERACIÓN DE CONTENIDOS Y RESPONSABILIDAD DE INTERMEDIARIOS | — |
| 5 | PRIVACIDAD Y DERECHOS ARCO | `privacidad` |
| 3 | DERECHOS DEL CONSUMIDOR | — |
| 3 | HONOR Y REPUTACIÓN | — |
| 2 | GOBIERNO DIGITAL | — |
| 1 | ACCESO A INTERNET E INFRAESTRUCTURAS | — |
| 1 | DERECHOS DE LOS NIÑOS, PRIVACIDAD Y DERECHOS ARCO | `privacidad` |
| 1 | DESC (DERECHOS DE LOS PUEBLOS INDÍGENAS) | — |
| 1 | DESC (DISCAPACIDAD) | — |
| 1 | DESC (SALUD) | — |
| 1 | LIBERTAD ELECTORAL | `electoral` |
| 1 | SEGURIDAD CIUDADANA | — |

Consecuencia: **11 de las 40 entradas se quedan sin ninguna etiqueta**, aunque
todas tienen su línea de etiquetas escrita. Son estas:

Argentina 06/08 y 11/08 · Brasil 07/08 y 12/08 · Chile 05/08, 11/08 y 12/08 ·
Colombia 12/08 · Perú 05/08, 20/08 y 25/08.

Ojo con la confusión de fondo: éste **no** es el vocabulario de «Objetivo
legítimo» de la matriz del Observatorio, que tiene 19 categorías y sí incluye
«Derechos de los niños» y varias de las de arriba. Son dos listas distintas para
dos cosas distintas: aquélla clasifica el objetivo declarado de la norma, ésta
etiqueta de qué trata la entrada del boletín.

**Qué hacer:** elegir una de las dos.

1. Escribir en el documento sólo las 17 del sitio. Es lo más rápido y no toca
   nada del código.
2. Ampliar `data/etiquetas.yaml` con las que falten. Hay que decidirlas una por
   una, con su nombre en inglés, y agregarlas también al desplegable del CMS
   (`static/admin/config.yml`), porque el vocabulario está escrito en los dos
   lados.

Las 17 que sí existen hoy: Libertad de expresión · Libertad de prensa · Acceso a
la información · Protección de menores · Inteligencia artificial · Violencia de
género · Discurso de odio · Plataformas digitales · Censura · Derecho a la
privacidad · Derecho a la protesta · Vigilancia · Propiedad intelectual ·
Publicidad oficial · Defensa del consumidor · Electoral · Accesibilidad.

### 3.3 El enlace va sobre el verbo y no sobre el expediente

El manual pide que el enlace de cada bullet caiga sobre el número de
expediente. De ahí saca el script el `exp`, que después se verifica contra los
CSV de la matriz al publicar.

En agosto, **21 de las 40 entradas** tienen el enlace sobre otra cosa y quedan
sin expediente:

| País | Fecha | El enlace está sobre |
|---|---|---|
| Argentina | 11/08 | «presentó» |
| Argentina | 14/08 | «presentó» |
| Argentina | 25/08 | «utilizó» |
| Argentina | 27/08 | media oración |
| Brasil | 03/08 | media oración |
| Brasil | 05/08 | «presentó» |
| Brasil | 07/08 | «Agencia Nacional de Protección de Datos (ANPD) inició» |
| Brasil | 07/08 | «promulgó» |
| Brasil | 12/08 | «ANPD informó» |
| Chile | 05/08, 11/08, 12/08 | «presentó» |
| Chile | 20/08 | «influencer fue detenido» |
| Colombia | (sin fecha) | «destacó en una publicación institucional» |
| Ecuador | 10/08 | «alertaron» |
| Ecuador | 12/08 | «Fundamedios» |
| Guatemala | 05/08, 13/08, 13/08 | media oración |
| México | 29/08 | «publicó» |
| Perú | 20/08 | «propuesta de reforma constitucional» |

**Qué hacer:** en los bullets que son sobre un proyecto, una ley o un decreto,
mover el enlace al número: `Se presentó el [Proyecto de Ley 3916-D-2026](…)`.
En los que son sobre un hecho sin expediente —el detenido en Chile, las
amenazas en Guatemala, los dichos del Presidente— está bien como está: esos
bullets no tienen expediente y el aviso es esperable.

### 3.4 El editorial no trae título ni bajada

El boletín publica un título y una bajada arriba del editorial. En el documento
van como dos encabezados de **nivel 3** al principio de la sección «TEXTO
EDITORIAL DE APERTURA». El documento de julio los tenía:

```
### La identificación obligatoria como técnica regulatoria
### De la verificación de edad al registro de líneas móviles: julio concentró…
```

El de agosto no: entra directo a los cuatro párrafos del editorial.

**Qué hacer:** agregar los dos encabezados de nivel 3. El primero es el título,
el segundo la bajada.

---

## 4. Checklist para el documento del mes que viene

- [ ] Los nueve países en **Título 2**, con el nombre solo (`ARGENTINA`).
- [ ] Un país sin novedades va igual, con «Sin novedades legislativas en …».
- [ ] Cada bullet, **un solo párrafo**, empezando por la fecha: `**04/08** …`.
- [ ] Una fecha por bullet. Dos fechas, dos bullets.
- [ ] El enlace, sobre el número de expediente.
- [ ] Las etiquetas en la línea siguiente, en mayúsculas, **sin** `ETIQUETAS:`,
      sin punto y coma, y sólo las 17 del vocabulario del sitio.
- [ ] Título y bajada del editorial, en Título 3.
- [ ] La sección de cierre, en Título 2 y llamada «Temas que vienen creciendo».
- [ ] Sin encabezados vacíos.
- [ ] Descargar con *Archivo → Descargar → Markdown (.md)*.

Con eso, `python3 scripts/boletin_desde_doc.py <archivo>.md --mes 2026-09`
escribe el boletín y sólo reporta lo que de verdad haya que revisar.
