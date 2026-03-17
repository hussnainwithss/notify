.PHONY: build dev gen clean install

# Auto-detect package manager for backend (yarn > npm)
PKG_MANAGER := $(shell if yarn --version > /dev/null 2>&1; then echo yarn; else echo npm; fi)

# Install all dependencies
install:
	cd backend && $(PKG_MANAGER) install
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
