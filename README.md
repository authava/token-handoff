# Authava Token Handoff Service

A minimal, Docker-friendly Deno service for securely handling token-based authentication handoff from a login URL redirect. This is especially useful for local development or reverse proxy auth setups where your frontend needs a session token as a browser cookie but can’t get one directly from the external auth provider (like `auth.authava.com`).

---

## 🧠 Why This Exists

When building modern apps using external authentication services like [Authava](https://authava.com), you may find yourself in this situation:

- You're developing locally (`admin.localhost`)
- Users are redirected to `https://auth.authava.com/login`
- After login, Authava sends back a `?token=...` in the redirect URL
- But since you're on a different domain, you can't directly set a secure cookie for your local app

This service solves that by:

1. Receiving the `token` as a query param
2. Setting it as a cookie with configurable domain/path/etc.
3. Redirecting users back to your app (with the cookie now in place)

---

## ✨ Features

- 🪪 **Sets a browser cookie** from a token URL param
- 🔁 **Redirects users** to your app after token handling
- 🔐 **Supports both secure and dev (`http`) cookies**
- 🧪 **Includes a `/auth/whoami` endpoint** to test what token is present in cookies

---

## 📦 Usage

### Start with Docker Compose

```yaml
services:
  token-handoff:
    image: authava/token-handoff:latest
    ports:
      - "3000:3000"
    environment:
      - TOKEN_HANDOFF_PORT=3000
      - TOKEN_HANDOFF_COOKIE_NAME=session
      - TOKEN_HANDOFF_COOKIE_DOMAIN=.localhost
      - TOKEN_HANDOFF_COOKIE_PATH=/
      - TOKEN_HANDOFF_DEFAULT_REDIRECT=http://admin.localhost:5173
      - TOKEN_HANDOFF_SECURE_COOKIE=true
```

Then visit:

```
http://localhost:3000/set?token=MY_SESSION_TOKEN&next=http://admin.localhost:5173
```

The service will:

- Set a cookie named `session`
- Redirect to the `next` URL

---

## 🛠 Environment Variables

| Variable                          | Description                                    | Default                 |
| --------------------------------- | ---------------------------------------------- | ----------------------- |
| `TOKEN_HANDOFF_PORT`              | Port to run the service                        | `3000`                  |
| `TOKEN_HANDOFF_COOKIE_NAME`       | Name of the cookie to store the token          | `session`               |
| `TOKEN_HANDOFF_COOKIE_DOMAIN`     | Domain to apply the cookie to                  | `.localhost`            |
| `TOKEN_HANDOFF_COOKIE_PATH`       | Cookie path                                    | `/`                     |
| `TOKEN_HANDOFF_DEFAULT_REDIRECT`  | Where to redirect if no `next` is provided     | `http://localhost:5173` |
| `TOKEN_HANDOFF_DEFAULT_TOKEN`     | Optional fallback token                        | _none_                  |
| `TOKEN_HANDOFF_SECURE_COOKIE` | If `true`, disables `httpOnly`, `secure=false` | `false`                 |

---

## 🔍 Endpoints

### `GET /auth/callback?token=abc123&next=http://yourapp.localhost`

Sets the cookie and redirects.

### `GET /auth/whoami`

Returns the cookie token in JSON if present.

---

## 🧪 Development

Start locally with:

```bash
deno run --allow-net --allow-env src/server.ts
```

Or build a container:

```bash
docker build -t authava/token-handoff .
docker run -p 3000:3000 authava/token-handoff
```

---

## 🔒 Note on Security

In production, ensure:

- You set `secure: true` by **not** enabling `TOKEN_HANDOFF_SECURE_COOKIE`
- Use custom cookie names and domains

This is designed for bridging auth in localhost or preview environments.

---

## 🧾 License

MIT
