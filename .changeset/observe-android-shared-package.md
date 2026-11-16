---
'expo-observe': major
---

[Android] Move the native classes to the `expo.modules.observe` package. If your app adds the OkHttp interceptor and event listener to its own `OkHttpClient`, import `NetworkRequestInterceptor` and `NetworkRequestEventListener` from `expo.modules.observe.shared.networkrequests`.
