# 🧪 expo-brownfield/e2e-cli

E2E tests for `expo-brownfield` CLI validating basic cases (like handling empty args, incorrect args, unknown commands) are properly handled and ensuring that each command and option returns correct output (or calls right subcommands):

- `--help`
- `--version`
- `build-android`
- `build-ios`
- `tasks-android`

Note: The tests use local versions of Expo CLI, Create Expo and expo-default-template

## CI/CD

The tests should be automatically executed anytime changes are made to `packages/expo-brownfield/cli` through [test-suite-brownfield-cli.yml](/.github/workflows/test-suite-brownfield-cli) workflow

## Running manually

To run the tests manually make sure that you build the dependencies mentioned above (Expo CLI, Create Expo and expo-default-template) and then run the `test:e2e-cli` npm script:

```bash
yarn test:e2e-cli
```
