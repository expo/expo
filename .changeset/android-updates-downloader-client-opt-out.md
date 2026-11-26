---
'expo-updates': minor
'@expo/config-plugins': minor
'@expo/config-types': minor
---

[Android] Add the `updates.useReactNativeHttpClient` config option. It defaults to `true`, which keeps downloading updates with a client built from React Native's `OkHttpClientProvider`. Set it to `false` to download updates with a separate OkHttp client that does not inherit app-wide interceptors or certificate pinning.
