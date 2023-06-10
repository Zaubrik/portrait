export {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.190.0/testing/asserts.ts";

export const connInfo = {
  localAddr: { transport: "tcp" as const, hostname: "127.0.0.1", port: 8080 },
  remoteAddr: { transport: "tcp" as const, hostname: "127.0.0.1", port: 48951 },
};
