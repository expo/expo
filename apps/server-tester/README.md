# server-tester

One Expo Router app that covers the server features of Expo Router and Expo CLI. The CLI E2E tests in `packages/@expo/cli/e2e` run against this app. The app also runs on iOS and Android, so a web-only change can be checked against the native experience.

This app does not cover React Server Components. Use `apps/router-e2e` for those fixtures.

## Layout

- `app/` holds every route. Each server feature has a parent directory, for example `app/api/` for API routes and `app/routing/` for route matching. A feature repeats the common routing cases that it touches: dynamic segments, catch-all segments, and groups.
- `components/` holds the shared screen components. Use them in every route so the pages look the same on web and on native.
- `servers/` holds the Express and workerd adapters that the E2E tests start against an exported `dist` directory.

## Environment variables

| Variable                                                                                       | Effect                                                                 |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `E2E_ROUTER_WEB_OUTPUT`                                                                        | Web output mode: `server` (default), `static`, or `single`.            |
| `E2E_ROUTER_ASYNC`                                                                             | Async routes: `true`, `false`, `development`, or `production`.         |
| `E2E_ROUTER_SPLIT_STRATEGY`                                                                    | Set to `granular` to enable granular chunking.                         |
| `E2E_ROUTER_API_ROUTES`                                                                        | Set to `true` or `false` to force the `apiRoutes` plugin option.       |
| `E2E_ROUTER_SITEMAP`                                                                           | Set to `false` to disable the sitemap route.                           |
| `E2E_ROUTER_REDIRECTS`, `E2E_ROUTER_REWRITES`, `E2E_ROUTER_HEADERS`, `E2E_ROUTER_PAGE_HEADERS` | JSON values for the matching `expo-router` plugin options.             |
| `E2E_ROUTER_THROW_ON_LOAD`                                                                     | Set to `true` so `app/errors/throw-on-load.tsx` throws while it loads. |
| `E2E_FAVICON`                                                                                  | Path to the `web.favicon` image, for example `./assets/icon.png`.      |
| `EXPO_E2E_BASE_PATH`                                                                           | Sets `experiments.baseUrl`.                                            |

## Run

- Web, development: `pnpm start`, then open `http://localhost:8081`.
- Web, production: `pnpm export`, then `pnpm serve dist` or `pnpm serve:express`.
- iOS: `pnpm prebuild`, then `pnpm ios`.
- Android: `pnpm prebuild`, then `pnpm android`.
- E2E tests: from `packages/@expo/cli`, run `pnpm test:e2e <test name>`.
