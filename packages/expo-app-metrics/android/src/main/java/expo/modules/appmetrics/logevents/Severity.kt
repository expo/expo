package expo.modules.appmetrics.logevents

import expo.modules.kotlin.types.Enumerable

/**
 * Severity of a log event. The `rawValue: String` constructor parameter is the
 * single field Expo's `Enumerable` converter inspects when coercing an incoming
 * JS string, so it must stay the only primary-constructor argument. The
 * matching OpenTelemetry severity number
 * (https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitynumber)
 * is exposed via the `severityNumber` extension property below.
 */
enum class Severity(val rawValue: String) : Enumerable {
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
