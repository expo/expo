package expo.modules.observe.shared.dispatch

import expo.modules.observe.shared.crashreporting.NATIVE_EXCEPTION_LOG_NAME
import expo.modules.observe.shared.jserrors.JS_EXCEPTION_LOG_NAME

internal const val OBSERVE_TAG = "EasObserve"
internal const val OBSERVE_DEFAULT_BASE_URL = "https://o.expo.dev/"

internal const val DISPATCH_CHUNK_SIZE = 200

// Log names that `errorSampleRate` applies to.
internal val ERROR_LOG_NAMES = setOf(JS_EXCEPTION_LOG_NAME, NATIVE_EXCEPTION_LOG_NAME)
