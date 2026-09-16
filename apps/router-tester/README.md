# Router Tester

Run `pnpm prebuild` to generate the native projects, then run `pnpm ios` or `pnpm android` to build and launch the dev client.

Run `pnpm eas:build -p ios --profile development` to build on EAS. It uploads only the files this app needs from the monorepo.

Run the Maestro test with:

```bash
pnpm test:e2e
```
