package expo.modules.appmetrics.logevents

import expo.modules.kotlin.types.Enumerable

/**
 * Severity of a log event. Each case carries its OpenTelemetry severity number
 * via `severityNumber` and is sent as `severityText` (uppercased) on the wire.
 *
 * The single `rawValue: String` constructor parameter is required by Expo's
 * `Enumerable` converter — it matches incoming JS strings against this value.
 */
enum class Severity(val rawValue: String) : Enumerable {
  TRACE("trace"),
  DEBUG("debug"),
  INFO("info"),
  WARN("warn"),
  ERROR("error"),
  FATAL("fatal");

  /**
   * OpenTelemetry severity number that matches this case.
   * See https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitynumber.
   */
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
