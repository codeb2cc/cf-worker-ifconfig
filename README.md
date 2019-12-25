# ʕ •́؈•̀) `Cloudflare Worker ifconfig Demo`

A Typescript port of `ifconfig.co` to Cloudflare Worker. Online demo: https://ifconfig.codeb2cc.com/

### 👩 💻 Developing

`src/index.js` calls the request handler in `src/handler.ts`, and will return the [request method](https://developer.mozilla.org/en-US/docs/Web/API/Request/method) for the given request.

### 🧪 Testing

This template comes with mocha tests which simply test that the request handler can handle each request method. `npm test` will run your tests.

### ✏️ Formatting

This template uses [`prettier`](https://prettier.io/) to format the project. To invoke, run `npm run format`.

### 👀 Previewing and Publishing

For information on how to preview and publish your worker, please see the `wrangler` [README](https://github.com/cloudflare/wrangler#%EF%B8%8F--publish).
