package expo.modules.appmetrics.logevents

import android.util.Log
import expo.modules.appmetrics.TAG

// Single-character ellipsis appended to a truncated value, kept short so the
// prefix stays close to the original length budget.
internal const val TRUNCATION_SUFFIX = "…"

/**
 * Truncates `value` to `maxLength` characters, appending [TRUNCATION_SUFFIX] and logging
 * `warningMessage` (when given) only if truncation actually happens. Returns `value`
 * unchanged when it already fits.
 */
internal fun truncateToMaxLength(value: String, maxLength: Int, warningMessage: String? = null): String {
  if (value.length <= maxLength) {
    return value
  }
  warningMessage?.let { Log.w(TAG, it) }
  return value.substring(0, maxLength - TRUNCATION_SUFFIX.length) + TRUNCATION_SUFFIX
}
