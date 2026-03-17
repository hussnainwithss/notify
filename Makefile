.PHONY: build dev gen clean install

# Install all dependencies
install:
	cd backend && bun install
	cd cli && bun install

# Generate Encore client and compile CLI binary
build: install gen
	cd cli && bun build --compile ./cli.ts --outfile notify

# Run the backend locally
dev:
	cd backend && encore run

# Regenerate the Encore typed client from the running backend
gen:
	cd backend && encore gen client --lang typescript > ../cli/clients/notify-client.ts

# Remove compiled binary
clean:
	rm -f cli/clients/notify-client.ts
	rm -f cli/notify
