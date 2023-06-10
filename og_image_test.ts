import { createOgImage } from "./mod.ts";
import { assertEquals } from "./test_deps.ts";

const url = "http://0.0.0.0:8080/Hello%20World.png?theme=Light&font-size=100px";
Deno.test("[mod] overview", async function () {
  const canvas = await createOgImage(new Request(url));
  assertEquals(typeof canvas, "object");
});
