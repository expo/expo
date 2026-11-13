package expo.modules.appmetrics.logevents

/**
 * Severity of a log event. The matching OpenTelemetry severity number
 * (https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitynumber)
 * is exposed via the `severityNumber` extension property below.
 */
internal enum class Severity(val rawValue: String) {
  TRACE("trace"),
  DEBUG("debug"),
  INFO("info"),
  WARN("warn"),
  ERROR("error"),
  FATAL("fatal");

  /** OpenTelemetry `severityNumber` value for this case. */
  val severityNumber: Int
    get() = when (this) {
      TRACE -> 1
      DEBUG -> 5
      INFO -> 9
      WARN -> 13
      ERROR -> 17
      FATAL -> 21
    }

  /** Severity text suitable for the OpenTelemetry `severityText` field. */
  val severityText: String
    get() = rawValue.uppercase()

  companion object {
    fun fromRawValue(value: String?): Severity? =
      value?.let { raw -> entries.firstOrNull { it.rawValue == raw } }
  }
}
