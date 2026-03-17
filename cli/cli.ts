#!/usr/bin/env bun
import { Command } from "commander";
import Client from "./clients/notify-client";
import { registerUserCommands } from "./commands/users";
import { registerNotificationCommands } from "./commands/notifications";

const program = new Command();

program
  .name("notify")
  .version("1.0.0")
  .description("Notify CLI for users & notifications")
  .option("--api-url <url>", "Backend API URL");

const apiUrl = process.env.NOTIFY_API_URL ?? "http://localhost:4000";
const apiClient = new Client(apiUrl);

registerUserCommands(program, apiClient);
registerNotificationCommands(program, apiClient);

await program.parseAsync(process.argv);
