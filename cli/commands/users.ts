import { Command } from "commander";
import type Client from "../clients/notify-client";

export function registerUserCommands(program: Command, apiClient: Client) {
  const user = program.command("users").description("Manage users");

  user
    .command("create")
    .description("Create a new user")
    .requiredOption("--name <name>", "User name")
    .requiredOption("--email <email>", "User email")
    .requiredOption("--dob <dob>", "User date of birth format YYYY-MM-DD")
    .action(async (opts: { name: string; email: string; dob: string }) => {
      const user = await apiClient.users.createUser({
        name: opts.name,
        email: opts.email,
        dateOfBirth: opts.dob,
      });
      console.log("Created user:", user);
    });

  user
    .command("list")
    .description("List all users")
    .action(async () => {
      const resp = await apiClient.users.getUsers();
      console.table(resp.users);
    });

  user
    .command("get")
    .description("get user by id")
    .requiredOption("--id <id>", "User Id")
    .action(async (opts: { id: string }) => {
      const resp = await apiClient.users.getUser(opts.id);
      console.log("user:", resp);
    });
}
