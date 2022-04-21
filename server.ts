import { Context, Portal, serveStatic } from "./server_deps.ts";
import { createOgImage } from "./mod.ts";

const app = new Portal();

async function serveOgImage(ctx: Context): Promise<Response> {
  const canvas = await createOgImage(ctx.request);
  return new Response(canvas.toBuffer(), {
    headers: {
      "content-type": "image/png",
      "Cache-Control":
        `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`,
    },
  });
}

app.get({ pathname: "/{:text}.png" }, serveOgImage);
app.get({ pathname: "*" }, serveStatic(new URL("./static", import.meta.url)));

await app.listen({ port: 8080 });
