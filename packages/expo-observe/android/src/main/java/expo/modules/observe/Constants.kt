package expo.modules.observe

import expo.modules.appmetrics.crashreporting.NATIVE_EXCEPTION_LOG_NAME
import expo.modules.appmetrics.jserrors.JS_EXCEPTION_LOG_NAME

internal const val OBSERVE_TAG = "EasObserve"
internal const val OBSERVE_DEFAULT_BASE_URL = "https://o.expo.dev/"

internal const val DISPATCH_CHUNK_SIZE = 200

// The database of the telemetry queues that app metrics storage replaced.
internal const val LEGACY_DATABASE_NAME = "eas_observe"

// Log names that `errorSampleRate` applies to.
internal val ERROR_LOG_NAMES = setOf(JS_EXCEPTION_LOG_NAME, NATIVE_EXCEPTION_LOG_NAME)
