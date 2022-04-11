import { Context, errorFallback, Portal, serveStatic } from "./server_deps.ts";
import { createOgImage } from "./mod.ts";

const app = new Portal();

async function serveOgImage(ctx: Context): Promise<Response> {
  try {
    const canvas = await createOgImage(ctx.request);
    return new Response(canvas.toBuffer(), {
      headers: { "content-type": "image/png" },
    });
  } catch {
    throw new Response("Bad Request", { status: 400 });
  }
}

app.get({ pathname: "/{:text}.png" }, serveOgImage);
app.get({ pathname: "*" }, serveStatic(new URL("./static", import.meta.url)));
app.catch(errorFallback);

await app.listen({ port: 8080 });
