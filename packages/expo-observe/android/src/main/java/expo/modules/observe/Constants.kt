package expo.modules.observe

internal const val OBSERVE_TAG = "EasObserve"
internal const val OBSERVE_DEFAULT_BASE_URL = "https://o.expo.dev/"

internal const val DISPATCH_CHUNK_SIZE = 200

// Log names that `errorSampleRate` applies to. `expo-app-metrics` writes them for JS errors and crash reports.
internal val ERROR_LOG_NAMES = setOf("js.exception", "native.exception")
