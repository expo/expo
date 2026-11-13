package expo.modules.appmetrics

import expo.modules.appmetrics.logevents.sanitizeLogEventAttributes
import java.util.concurrent.atomic.AtomicReference

/**
 * Holds caller-provided global attributes that are merged into every subsequent
 * metric's `params` and log record's `attributes`. Values live for the
 * lifetime of the SDK instance and are cleared on app restart — persistent
 * storage is intentionally out of scope.
 *
 * `setGlobalAttributes` is invoked from the JS thread while `mergeWith` runs
 * on the coroutine that persists the record. An `AtomicReference` to an
 * immutable map keeps reads lock-free and prevents a concurrent set from
 * mutating a snapshot mid-merge.
 */
object GlobalAttributes {
  private val current = AtomicReference<Map<String, Any?>>(emptyMap())

  /**
   * Replaces the current set of global attributes. The input is sanitized using
   * the same rules as per-event attributes (`expo.*` reserved, empty keys
   * rejected, per-record cap).
   *
   * Passing `null` or an empty map clears the store.
   */
  fun set(attributes: Map<String, Any?>?) {
    val sanitized = sanitizeLogEventAttributes(attributes)
    current.set(sanitized.attributes ?: emptyMap())
  }

  /**
   * Returns the current global attributes merged with the given per-event
   * attributes. Per-event keys win on collision so callers can override a
   * global value for a single record without mutating the store.
   */
  fun mergeWith(eventAttributes: Map<String, Any?>?): Map<String, Any?>? {
    val snapshot = current.get()
    if (snapshot.isEmpty()) {
      return eventAttributes
    }
    if (eventAttributes.isNullOrEmpty()) {
      return snapshot
    }
    return snapshot + eventAttributes
  }
}
