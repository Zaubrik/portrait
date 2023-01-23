import {
  CanvasRenderingContext2D,
  createCanvas,
  Image,
  ImageFormat,
  parse,
} from "./deps.ts";

const imageFormats: ImageFormat[] = ["png", "jpeg", "webp"];
const themes = {
  light: { backgroundColor: "#ffffff", dotColor: "#cccccc", color: "#000000" },
  dark: { backgroundColor: "#000000", dotColor: "#cccccc", color: "#ffffff" },
};

// Adopted from https://github.com/ije/og-image
function drawBackground(
  ctx: CanvasRenderingContext2D,
  canvasSize: [number, number],
  theme: "light" | "dark",
) {
  ctx.fillStyle = themes[theme].backgroundColor;
  ctx.fillRect(0, 0, 2048, 1170);
  // draw bg dots
  ctx.fillStyle = themes[theme].dotColor;
  const g = 100;
  for (let x = 0; x < Math.ceil(canvasSize[0] / g); x++) {
    for (let y = 0; y < 2 * Math.ceil(canvasSize[1] / g); y++) {
      let offsetX = 0;
      if (y % 2 === 0) {
        offsetX = g / 2;
      }
      ctx.fillRect(g / 2 + x * g + offsetX, g / 2 + y * g / 2, 4, 4);
    }
  }
}

function isImageFormat(format: string): format is ImageFormat {
  return imageFormats.includes(format as ImageFormat);
}

function parsePathname(pathname: string) {
  return imageFormats.some((format) => "/." + format === pathname)
    ? { ext: pathname.slice(1), name: "" } // Accept empty text.
    : parse(pathname);
}

/**
 * Takes a `Request` and generates dynamic Open Graph images that you can embed
 * in your html meta tags. It either returns a `EmulatedCanvas2D` or throws an `Error`.
 */
export async function createOgImage(request: Request): Promise<Uint8Array> {
  const canvasSize: [number, number] = [2048, 1170];
  const defaultHeight = 480;
  const spacing = 200;
  const defaultFontSize = "90px";
  const defaultTheme = "Light";
  const canvas = createCanvas(canvasSize[0], canvasSize[1]);
  const ctx = canvas.getContext("2d");
  const url = new URL(request.url);
  const parsedPathname = parsePathname(decodeURIComponent(url.pathname));
  const text = parsedPathname.name;
  const theme = (url.searchParams.get("theme") || defaultTheme)
    .toLowerCase();
  const fontSize = url.searchParams.get("font-size") || defaultFontSize;
  const imageSrc = url.searchParams.get("image");
  let imageWidth = parseInt(url.searchParams.get("width") || "0");
  let imageHeight = parseInt(url.searchParams.get("height") || "0");
  const imageFormat = parsedPathname.ext.slice(1);
  if (isImageFormat(imageFormat)) {
    if (theme === "light" || theme === "dark") {
      drawBackground(ctx, canvasSize, theme);
    } else {
      throw new URIError("The theme is invalid.");
    }
    if (imageSrc) {
      const uint8Array = await fetch(imageSrc).then(async (res) => {
        if (res.ok) {
          return new Uint8Array(await res.arrayBuffer());
        } else throw new Error("The image could not be fetched.");
      });
      const img = new Image(uint8Array);
      const r = img.width / img.height;
      if (imageWidth <= 0 && imageHeight <= 0) {
        imageWidth = r * defaultHeight;
        imageHeight = defaultHeight;
      } else if (imageWidth > 0) {
        imageHeight = imageWidth / r;
      } else if (imageHeight > 0) {
        imageWidth = r * imageHeight;
      }
      ctx.drawImage(
        img,
        (canvasSize[0] - imageWidth) / 2,
        (canvasSize[1] - imageHeight) / 2 - (text ? spacing / 2 : 0),
        imageWidth,
        imageHeight,
      );
    }
    if (text) {
      ctx.font = `${fontSize} Helvetica`;
      ctx.fillStyle = themes[theme].color;

      const t = ctx.measureText(text);
      ctx.fillText(
        text,
        (canvasSize[0] - t.width) / 2,
        (canvasSize[1] + imageHeight + spacing) / 2,
        canvasSize[0] - spacing * 2,
      );
    }
    return canvas.encode(imageFormat);
  } else {
    throw new URIError("The resource has an invalid file extension.");
  }
}
