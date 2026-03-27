// auth/handler.ts
import { APIError, Gateway, Header } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { auth } from "./auth";
import { db } from "./db";
import { AuthData } from "../utils";

// AuthParams defines what Encore extracts from incoming requests.
// These are passed to the auth handler automatically.
interface AuthParams {
  authorization: Header<"Authorization">;
  cookie: Header<"Cookie">;
}

// Validate Better Auth sessions for protected endpoints.
// Any endpoint with `auth: true` will run this handler first.
const handler = authHandler<AuthParams, AuthData>(async (params) => {
  // Forward the relevant headers to Better Auth for validation.
  // This supports both cookie-based (browser) and token-based (API) auth.
  const headers = new Headers();
  if (params.authorization) {
    headers.set("Authorization", params.authorization);
  }
  if (params.cookie) {
    headers.set("Cookie", params.cookie);
  }

  const session = await auth.api.getSession({ headers });

  if (!session) {
    throw APIError.unauthenticated("invalid session");
  }

  const row = await db.queryRow<{ roles: string[] }>`
    SELECT roles FROM users WHERE id = ${session.user.id}
  `;

  return { userID: session.user.id, roles: row?.roles ?? ["user"] };
});

// The gateway applies the auth handler to all incoming requests.
export const gateway = new Gateway({ authHandler: handler });
