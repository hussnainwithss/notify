# notify

A notification system built with Encore.ts and Bun. Two microservices — `users` and `notifications` — communicate via PostgreSQL-backed APIs and an event-driven PubSub layer. A compiled CLI binary wraps the HTTP API for local interaction.

---

## Project Structure

```
/backend   Encore.ts backend (two services: users, notifications)
/cli       Bun CLI client compiled into a single binary
```

---

## Backend

### Prerequisites

- [Encore](https://encore.dev/docs/install)
- [Bun](https://bun.sh)

### Run locally

**1. Install Encore CLI**

```sh
brew install encoredev/tap/encore
```

Or see the [official install guide](https://encore.dev/docs/install).

**2. Install Bun**

```sh
curl -fsSL https://bun.sh/install | bash
```

**3. Install backend dependencies**

```sh
cd backend
bun install
```

**4. Start the backend**

```sh
encore run
```

Encore provisions PostgreSQL automatically and starts both services. The API is available at `http://localhost:4000`.

**5. In a new terminal, build the CLI**

```sh
cd ../   # back to repo root
make build
```

**6. Run CLI commands**

```sh
./cli/notify users create --name "Alice" --email "alice@example.com" --dob "1990-01-15"
./cli/notify users list
./cli/notify notification send --user-id <id> --channel in_app --title "Hello" --body "Welcome!"
./cli/notify notification list --user-id <id>
./cli/notify notification unread --user-id <id>
./cli/notify notification read --id <notification-id>
```

Encore starts both services and provisions PostgreSQL automatically. The API is available at `http://localhost:4000`.

---

## CLI

### Build the binary

Make sure the backend is running first (`make dev`), then:

```sh
make build
```

This will:
1. Install backend dependencies (auto-detects bun or yarn or npm)
2. Install CLI dependencies via Bun
3. Regenerate the typed Encore client from the running backend
4. Compile the CLI into a single binary at `cli/notify`

Available make commands:

| Command | Description |
|---|---|
| `make dev` | Start the backend with `encore run` |
| `make build` | Install deps, regenerate client, compile binary |
| `make gen` | Regenerate the Encore client only |
| `make install` | Install dependencies for backend and CLI |
| `make clean` | Remove the compiled binary |

### Configuration

Set the backend URL via flag or environment variable:

```sh
NOTIFY_API_URL=http://localhost:4000 ./notify users list
./notify --api-url http://localhost:4000 users list
```

Defaults to `http://localhost:4000` if neither is set.

### Commands

**Users**

```sh
./notify users create --name "Alice" --email "alice@example.com" --dob "1990-01-15"
./notify users list
./notify users get --id <user-id>
```

**Notifications**

```sh
./notify notification send --user-id <id> --channel in_app --title "Hello" --body "Welcome!"
./notify notification send --user-id <id> --channel email --title "Hello" --body "Welcome!"
./notify notification list --user-id <id>
./notify notification unread --user-id <id>
./notify notification read --id <notification-id>
```

---

## Architecture & Choices

### Two services, two databases

`users` and `notifications` each own their database. No cross-service joins. The notifications service maintains a local `notification_users` projection — a denormalized copy of user data it needs for dispatch decisions.

### Event-driven sync via PubSub

When a user is created or updated, the `users` service publishes a `UserCreated` or `UserUpdated` event. The `notifications` service subscribes and UPSERTs into its local projection. Both topics use `at-least-once` delivery — subscribers are idempotent by design.

### Cache-aside fallback

If a notification request arrives before the PubSub event is processed (eventual consistency gap), the notifications service falls back to a direct API call to the users service, UPSERTs the result locally, and proceeds. This keeps the system eventually consistent without Redis.

### Validation

Input is validated at the API boundary using Zod v4 before any database work. Shared validation utilities live in `backend/utils.ts`. Each service has its own schema definitions.

### CLI

Built with [Commander](https://github.com/tj/commander.js) for argument parsing — subcommand structure (`users create`, `notification send`, etc.), required option enforcement, and `--help` output for free. Compiled to a single binary via `bun build --compile`. The generated Encore client (`encore gen client`) provides fully typed HTTP calls — the CLI never touches the database directly.

---

## If I Had More Time

- **Transactional outbox** — the current design has a gap between the DB write and PubSub publish in `createUser`. A transactional outbox pattern (write event to DB in same transaction, relay process publishes) would eliminate the risk of a lost event on process crash.
- **Authentication** — endpoints are currently unauthenticated. Would add Encore auth handlers with JWT validation.
- **Pagination** — `getUsers` and `getNotifications` return unbounded result sets. Would add cursor-based pagination.
- **Real email dispatch** — swap the log-based `SendEmailNotification` stub for a real provider (Resend, SendGrid).
- **Dead letter handling** — PubSub subscribers currently have no dead letter strategy. Failed events are retried indefinitely with no alerting.
- **Tests** — integration tests against a real database using `encore test`.
- **Circuit breaking with multiple providers** — each channel would have a primary and fallback provider (e.g. Resend → SendGrid for email). A per-provider circuit breaker would open on repeated failures and automatically route to the fallback, restoring the primary once it recovers. This keeps notification delivery alive even when one provider is degraded.
- **Priority notifications** — add a `priority` field (`normal | urgent`) to notifications. Urgent notifications would bypass queuing, get immediate dispatch attempts, and trigger alerts on failure rather than silent dead-lettering.
- **Audit trail & metadata** — track a full lifecycle on each notification: `sent_at`, `read_at`, `failed_at`, `retry_count`, `failure_reason`, and a `metadata` JSONB column for arbitrary context (e.g. source service, correlation ID, campaign tag). This enables debugging delivery failures, building analytics on notification engagement, and tracing a notification back to the originating event.
- **Shared client package** — the generated Encore client currently lives inside `/cli/clients`. A cleaner structure would extract it into a standalone `/common` package that exposes the typed stubs. Any consumer — CLI, frontend, another service — would import from `@notify/client` rather than having the generated file coupled to the CLI project.
