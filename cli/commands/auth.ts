import { Command } from "commander";
import { saveSession, clearSession } from "../session";

export function registerAuthCommands(program: Command, apiUrl: string) {
  const auth = program.command("auth").description("Authenticate with the API");

  auth
    .command("register")
    .description("Create a new account")
    .requiredOption("--name <name>", "Your name")
    .requiredOption("--email <email>", "Your email")
    .requiredOption("--password <password>", "Your password")
    .action(async (opts: { name: string; email: string; password: string }) => {
      const resp = await fetch(`${apiUrl}/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: opts.name, email: opts.email, password: opts.password }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ message: resp.statusText }));
        console.error("Registration failed:", (err as any).message ?? resp.statusText);
        process.exit(1);
      }

      const data = await resp.json() as { token?: string };
      if (data.token) {
        await saveSession(data.token);
        console.log("Registered and logged in.");
      } else {
        console.log("Registered. Please log in.");
      }
    });

  auth
    .command("login")
    .description("Log in to your account")
    .requiredOption("--email <email>", "Your email")
    .requiredOption("--password <password>", "Your password")
    .action(async (opts: { email: string; password: string }) => {
      const resp = await fetch(`${apiUrl}/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: opts.email, password: opts.password }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ message: resp.statusText }));
        console.error("Login failed:", (err as any).message ?? resp.statusText);
        process.exit(1);
      }

      const data = await resp.json() as { token?: string };
      if (!data.token) {
        console.error("Login failed: no token in response");
        process.exit(1);
      }

      await saveSession(data.token);
      console.log("Logged in.");
    });

  auth
    .command("logout")
    .description("Log out")
    .action(async () => {
      await clearSession();
      console.log("Logged out.");
    });
}
