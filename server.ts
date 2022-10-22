import { createOgImage } from "./mod.ts";
import {
  Context,
  createHandler,
  createRoute,
  fromFileUrl,
  listen,
  serveDir,
} from "./server_deps.ts";

function identity<X>(x: X) {
  return x;
}

async function serveOgImage(ctx: Context): Promise<Context> {
  const canvas = await createOgImage(ctx.request);
  ctx.response = new Response(canvas.toBuffer(), {
    headers: {
      "content-type": "image/png",
      "Cache-Control":
        `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`,
    },
  });
  return ctx;
}

async function serveStatic(ctx: Context) {
  ctx.response = await serveDir(ctx.request, {
    fsRoot: fromFileUrl(import.meta.resolve("./static")),
    showDirListing: true,
  });
  return ctx;
}

const routeGet = createRoute("GET");
const serveOgImageRoute = routeGet({ pathname: "/{:text}?.png" })(serveOgImage);
const serveStaticRoute = routeGet({ pathname: "*", search: "" })(serveStatic);
const handler = createHandler(Context)(serveStaticRoute, serveOgImageRoute)(
  identity,
)(identity);

await listen(handler)({ port: 8080 });
