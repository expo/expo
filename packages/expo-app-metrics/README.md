# expo-app-metrics

`expo-app-metrics` is replaced by [`expo-observe`](https://docs.expo.dev/versions/latest/sdk/observe/). This package has no API. Importing it throws an error.

## Migrate to `expo-observe`

1. Install `expo-observe`.
2. Import the API from `expo-observe`.
3. Import the debug-only APIs from `expo-observe/debug`.
4. Remove `expo-app-metrics` from your dependencies.
