# OpenAI Decisions API

Curso en lecciones interactivas sobre la Decisions API de OpenAI. Un servidor local sirve las lecciones y hace de proxy a la API, así la API key nunca llega al navegador.

## Uso rápido

Requiere Node.js 21.7 o superior. No hay dependencias que instalar.

```sh
cp .env.example .env   # y pon tu OPENAI_API_KEY
npm start              # http://localhost:3000
```

Para usar otro puerto: `PORT=4000 npm start`.

## Comprobar las lecciones

Ejecuta la solución de cada lección contra la API real y guarda las respuestas como mocks en el HTML:

```sh
npm run comprobar                # todas
npm run comprobar -- 03 05       # solo esas
npm run comprobar -- --no-mocks  # sin reescribir los mocks
```

## Ejemplo con el SDK

`example/` contiene un script mínimo con el SDK oficial. Necesita su propio `.env` con `OPENAI_API_KEY`:

```sh
cd example
npm install
cp ../.env .env
node index.ts "Me habéis cobrado dos veces el pedido"
```

## Estructura

- `server.js`: servidor estático y proxy a `/v1/decisions`.
- `lecciones/`: las 11 lecciones en HTML.
- `scripts/comprobar.mjs`: validación de las soluciones y generación de mocks.
- `example/`: ejemplo con el SDK de `openai`.
