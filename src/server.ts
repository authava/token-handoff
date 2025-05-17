import { Application, Context, Router } from "@oak/oak";
import { getCookies, setCookie } from "https://deno.land/std@0.224.0/http/cookie.ts";
import { generateSelfSignedCert } from "./certs.ts";

const TOKEN_HANDOFF_PORT = parseInt(Deno.env.get("TOKEN_HANDOFF_PORT") ?? "3000");
const TOKEN_HANDOFF_COOKIE_NAME = Deno.env.get("TOKEN_HANDOFF_COOKIE_NAME") ?? "session";
const TOKEN_HANDOFF_COOKIE_DOMAIN = Deno.env.get("TOKEN_HANDOFF_COOKIE_DOMAIN") ??
  "dashboard.localhost";
const TOKEN_HANDOFF_COOKIE_PATH = Deno.env.get("TOKEN_HANDOFF_COOKIE_PATH") ?? "/";
const TOKEN_HANDOFF_DEFAULT_REDIRECT = Deno.env.get("TOKEN_HANDOFF_DEFAULT_REDIRECT") ??
  "http://localhost:5173";
const TOKEN_HANDOFF_DEFAULT_TOKEN = Deno.env.get("TOKEN_HANDOFF_DEFAULT_TOKEN") ?? "";
const TOKEN_HANDOFF_SECURE_COOKIE = Deno.env.get("TOKEN_HANDOFF_SECURE_COOKIE") === "true";

const router = new Router();

router.get("/auth/callback", (ctx: Context) => {
  const token = ctx.request.url.searchParams.get("token") ?? TOKEN_HANDOFF_DEFAULT_TOKEN;
  const encodedNext = ctx.request.url.searchParams.get("next") ?? "";
  const fallback = TOKEN_HANDOFF_DEFAULT_REDIRECT;
  const USE_SECURE_COOKIE = Deno.env.get("TOKEN_HANDOFF_SECURE_COOKIE") === "true";
  const USE_HTTP_ONLY_COOKIE = Deno.env.get("TOKEN_HANDOFF_HTTP_ONLY") !== "false";

  if (!token) {
    ctx.response.status = 401;
    return;
  }

  const isBase64 = /^[A-Za-z0-9_-]+$/.test(encodedNext);
  const decodedNext = isBase64 ? atob(encodedNext) : fallback;

  setCookie(ctx.response.headers, {
    name: TOKEN_HANDOFF_COOKIE_NAME,
    value: token,
    domain: TOKEN_HANDOFF_COOKIE_DOMAIN,
    path: TOKEN_HANDOFF_COOKIE_PATH,
    httpOnly: USE_HTTP_ONLY_COOKIE,
    sameSite: USE_SECURE_COOKIE ? "None" : "Lax",
    secure: USE_SECURE_COOKIE,
  });

  ctx.response.redirect(decodedNext);
});

router.get("/auth/whoami", (ctx: Context) => {
  const cookies = getCookies(ctx.request.headers);
  const token = cookies[TOKEN_HANDOFF_COOKIE_NAME] ?? null;

  ctx.response.status = token ? 200 : 401;
  ctx.response.body = token ? { token } : { error: "No token found" };
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

if (TOKEN_HANDOFF_SECURE_COOKIE) {
  console.log(`Token handoff listening on https://0.0.0.0:${TOKEN_HANDOFF_PORT}`);
  const { certFile, keyFile } = await generateSelfSignedCert();

  const cert = await Deno.readTextFile(certFile);
  const key = await Deno.readTextFile(keyFile);

  await app.listen({
    port: TOKEN_HANDOFF_PORT,
    secure: true,
    cert,
    key,
  });
} else {
  console.log(`Token handoff listening on http://0.0.0.0:${TOKEN_HANDOFF_PORT}`);
  await app.listen({ port: TOKEN_HANDOFF_PORT });
}
