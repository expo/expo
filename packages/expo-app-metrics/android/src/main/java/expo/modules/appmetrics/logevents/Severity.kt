package expo.modules.appmetrics.logevents

import expo.modules.kotlin.types.Enumerable

/**
 * Severity of a log event. Each case carries its OpenTelemetry severity number
 * (see https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitynumber)
 * and is sent as `severityText` (uppercased `rawValue`) on the wire.
 *
 * The `rawValue: String` constructor parameter is required by Expo's
 * `Enumerable` converter — it matches incoming JS strings against this value.
 */
enum class Severity(val rawValue: String, val severityNumber: Int) : Enumerable {
  TRACE("trace", 1),
  DEBUG("debug", 5),
  INFO("info", 9),
  WARN("warn", 13),
  ERROR("error", 17),
  FATAL("fatal", 21);

  /** Severity text suitable for the OpenTelemetry `severityText` field. */
  val severityText: String
    get() = rawValue.uppercase()

  companion object {
    fun fromRawValue(value: String?): Severity? =
      value?.let { raw -> entries.firstOrNull { it.rawValue == raw } }
  }
}
