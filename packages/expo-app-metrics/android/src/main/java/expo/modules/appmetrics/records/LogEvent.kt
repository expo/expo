package expo.modules.appmetrics.records

/** One log event, without the session it belongs to. For expo-observe. Not a stable API. */
data class LogEvent(
  // ISO 8601 date string
  val timestamp: String,
  val name: String,
  val body: String? = null,
  // Lowercase severity case name (`trace`, `debug`, `info`, `warn`, `error`, `fatal`).
  val severity: String,
  // JSON string
  val attributes: String? = null,
  val droppedAttributesCount: Int = 0
)
