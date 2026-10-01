package expo.modules.appmetrics.records

/** One metric sample, without the session it belongs to. For expo-observe. Not a stable API. */
data class MetricRecord(
  // ISO 8601 date string
  val timestamp: String,
  val category: String,
  val name: String,
  val value: Double,
  val routeName: String? = null,
  val updateId: String? = null,
  // JSON string
  val params: String? = null
)
