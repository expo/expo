# server-tester

One Expo Router app that covers the server features of Expo Router and Expo CLI. The CLI E2E tests in `packages/@expo/cli/e2e` run against this app. The app also runs on iOS and Android, so a web-only change can be checked against the native experience.

This app does not cover React Server Components. Use `apps/router-e2e` for those fixtures.

## Layout

- `app/` holds every route. Each server feature has a parent directory, for example `app/api/` for API routes and `app/routing/` for route matching. A feature repeats the common routing cases that it touches: dynamic segments, catch-all segments, and groups.
- `components/` holds the shared screen components. Use them in every route so the pages look the same on web and on native.
- `servers/` holds the Express and workerd adapters that the E2E tests start against an exported `dist` directory.

## Run

- Web, development: `pnpm start`, then open `http://localhost:8081`.
- Web, production: `pnpm export`, then `pnpm serve dist` or `pnpm serve:express`.
- iOS: `pnpm prebuild`, then `pnpm ios`.
- Android: `pnpm prebuild`, then `pnpm android`.
- E2E tests: from `packages/@expo/cli`, run `pnpm test:e2e <test name>`. The Jest global setup exports this app once into `dist` with the default options. A suite that passes `export` options to `prepareServers()` exports into its own `dist-<key>` directory instead.
