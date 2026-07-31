package expo.modules.appmetrics.logevents

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

/**
 * Options accepted by the `logEvent` module function. The event name is
 * passed as a separate positional argument and is therefore not part of this
 * record.
 */
@OptimizedRecord
data class LogEventOptions(
  @Field val displayName: String? = null,
  @Field val body: String? = null,
  @Field val attributes: Map<String, Any?>? = null,
  @Field val severity: Severity? = null
) : Record
