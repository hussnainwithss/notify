#!/usr/bin/env bun
import { Command } from "commander";
import Client from "./clients/notify-client";
import { registerUserCommands } from "./commands/users";
import { registerNotificationCommands } from "./commands/notifications";
import { registerAuthCommands } from "./commands/auth";
import { loadSession } from "./session";

const apiUrlFlag = process.argv.indexOf("--api-url");
const apiUrl =
  (apiUrlFlag !== -1 ? process.argv[apiUrlFlag + 1] : undefined) ??
  process.env.NOTIFY_API_URL ??
  "http://localhost:4000";

const program = new Command();

program
  .name("notify")
  .version("1.0.0")
  .description("Notify CLI for users & notifications")
  .option("--api-url <url>", "Backend API URL");

const token = await loadSession();
const apiClient = new Client(apiUrl, {
  requestInit: {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  },
});

registerAuthCommands(program, apiUrl);
registerUserCommands(program, apiClient);
registerNotificationCommands(program, apiClient);

await program.parseAsync(process.argv);
