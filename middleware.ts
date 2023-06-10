import { createOgImage } from "./og_image.ts";
import { type Context, createHttpError, Status } from "./middleware_deps.ts";

/**
 * The middleware generates cached dynamic Open Graph images that you can embed
 * in your html `meta` tags.
 * ```ts
 * get({ pathname: "/{:text}.png" }, serveOgImage);
 * ```
 */
export async function serveOgImage<C extends Context>(ctx: C): Promise<C> {
  try {
    const canvas = await createOgImage(ctx.request);
    ctx.response = new Response(canvas, {
      headers: {
        "content-type": "image/png",
        "Cache-Control":
          `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`,
      },
    });
    return ctx;
  } catch (error: unknown) {
    throw error instanceof URIError
      ? createHttpError(Status.BadRequest, error.message)
      : error instanceof URIError
      ? createHttpError(Status.InternalServerError, error.message)
      : new Error("[non-error thrown]");
  }
}
