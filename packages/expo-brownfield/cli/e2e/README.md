# 🧪 expo-brownfield/cli/e2e

E2E tests for `expo-brownfield` CLI validating basic cases (like handling empty args, incorrect args, unknown commands) are properly handled and ensuring that each command and option returns correct output (or calls right subcommands):

- `--help`
- `--version`
- `build-android`
- `build-ios`
- `tasks-android`

## CI/CD

The tests should be automatically executed anytime changes are made to `packages/expo-brownfield/cli` through [test-suite-brownfield-cli.yml](/.github/workflows/test-suite-brownfield-cli) workflow

## Running manually

To run the tests manually simply run the `test:e2e-cli` npm script:

```bash
yarn test:e2e-cli
```
