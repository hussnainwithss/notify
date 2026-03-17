#!/usr/bin/env bun
import { Command } from "commander";
import Client from "./clients/notify-client";
import { registerUserCommands } from "./commands/users";
import { registerNotificationCommands } from "./commands/notifications";

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

const apiClient = new Client(apiUrl);

registerUserCommands(program, apiClient);
registerNotificationCommands(program, apiClient);

await program.parseAsync(process.argv);
