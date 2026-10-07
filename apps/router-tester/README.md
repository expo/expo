# Router Tester

Run `pnpm prebuild` to generate the native projects, then run `pnpm ios` or `pnpm android` to build and launch the dev client.

Run `pnpm eas:build -p ios --profile development` to build on EAS. It uploads only the files this app needs from the monorepo.

Run the Maestro test with:

```bash
pnpm test:e2e
```

## e2e tests

The [e2e](https://e2e.tester.army/docs) tests in `tests/` run on a Release build of the app. Build and install it on a simulator or emulator, sign in with your ChatGPT subscription once, then run:

```bash
pnpm exec e2e login openai
pnpm exec e2e run --target ios # or --target android
```

The `.eas/workflows/e2e.yml` workflow runs them on EAS every day. Run it manually with `pnpm eas:e2e`. It reads the ChatGPT login from the `E2E_OAUTH_CREDENTIALS` secret in the `preview` environment: the contents of `~/.config/e2e/oauth.json` after `e2e login openai`. The secret is not refreshed, so set it again when a run fails with `LOGIN_REQUIRED`.
