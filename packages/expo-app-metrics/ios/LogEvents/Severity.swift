// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 Severity of a log event. Each case carries its OpenTelemetry severity number
 via `severityNumber` and is sent as `severityText` (uppercased) on the wire.
 */
public enum Severity: String, Codable, Sendable, Enumerable {
  case trace, debug, info, warn, error, fatal

  /**
   OpenTelemetry severity number that matches this case.
   See https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitynumber.
   */
  public var severityNumber: Int {
    switch self {
    case .trace:
      return 1
    case .debug:
      return 5
    case .info:
      return 9
    case .warn:
      return 13
    case .error:
      return 17
    case .fatal:
      return 21
    }
  }

  /**
   Severity text suitable for the OpenTelemetry `severityText` field.
   */
  public var severityText: String {
    return rawValue.uppercased()
  }
}
