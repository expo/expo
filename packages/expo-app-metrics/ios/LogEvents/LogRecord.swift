// Copyright 2025-present 650 Industries. All rights reserved.

/**
 A single log record collected during a session, modeled after the OpenTelemetry
 Logs Data Model. Records stored in the local storage are of this form.
 */
public struct LogRecord: Codable, Sendable {
  public let name: String
  public let body: String?
  public let attributes: AnyCodable?
  /**
   Severity of the record. Maps to the OTel `severityNumber` and `severityText`
   fields on the wire.
   */
  public let severity: Severity
  public var timestamp: String = Date.now.ISO8601Format()

  init(
    name: String,
    body: String? = nil,
    attributes: [String: Any]? = nil,
    severity: Severity = .info,
    timestamp: String = Date.now.ISO8601Format()
  ) {
    self.name = name
    self.body = body
    self.attributes = attributes != nil ? AnyCodable(attributes) : nil
    self.severity = severity
    self.timestamp = timestamp
  }
}
