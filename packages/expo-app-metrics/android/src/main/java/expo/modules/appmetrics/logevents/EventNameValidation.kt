package expo.modules.appmetrics.logevents

import android.util.Log
import expo.modules.appmetrics.TAG

/**
 * Prefix reserved for internal Expo event names. Callers cannot use it so SDK-emitted
 * events stay distinguishable from app-emitted ones in the backend.
 */
private const val RESERVED_EVENT_NAME_PREFIX = "expo."

/**
 * Maximum length of a log event name in characters. Names beyond this length are
 * dropped with a warning — most log backends balk on very long names and a runaway
 * template literal can easily blow past a few hundred characters by accident.
 */
private const val MAX_EVENT_NAME_LENGTH = 256

/**
 * Validates and normalizes a caller-provided log event name.
 *
 * Returns the trimmed name on success, or `null` when the name should be rejected.
 * In the rejection case, a warning is logged explaining why so the developer can
 * fix the call site without the app crashing over a telemetry concern.
 */
internal fun validateEventName(name: String): String? {
  val trimmedName = name.trim()
  if (trimmedName.isEmpty()) {
    Log.w(TAG, "[AppMetrics] logEvent dropped: event name must not be empty.")
    return null
  }
  if (trimmedName.startsWith(RESERVED_EVENT_NAME_PREFIX)) {
    Log.w(
      TAG,
      "[AppMetrics] logEvent dropped: event name `$trimmedName` uses the reserved `expo.` prefix."
    )
    return null
  }
  if (trimmedName.length > MAX_EVENT_NAME_LENGTH) {
    Log.w(
      TAG,
      "[AppMetrics] logEvent dropped: event name is ${trimmedName.length} characters long, exceeding the $MAX_EVENT_NAME_LENGTH-character limit."
    )
    return null
  }
  return trimmedName
}
