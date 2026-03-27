import { join } from "node:path";
import { homedir } from "node:os";

const SESSION_PATH = join(homedir(), ".notify", "session.json");

interface Session {
  token: string;
}

export async function saveSession(token: string): Promise<void> {
  await Bun.write(SESSION_PATH, JSON.stringify({ token }));
}

export async function loadSession(): Promise<string | null> {
  const file = Bun.file(SESSION_PATH);
  if (!(await file.exists())) return null;
  const session: Session = await file.json();
  return session.token ?? null;
}

export async function clearSession(): Promise<void> {
  const file = Bun.file(SESSION_PATH);
  if (await file.exists()) {
    await Bun.$`rm ${SESSION_PATH}`.quiet();
  }
}
