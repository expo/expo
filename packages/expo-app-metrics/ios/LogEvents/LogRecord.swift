// Copyright 2025-present 650 Industries. All rights reserved.

/**
 A single log event collected during a session. Records of this shape are
 persisted in the local storage and exposed to consumers (e.g. `expo-observe`)
 that decide how to dispatch or display them.
 */
public struct LogRecord: Codable, Sendable {
  public let name: String
  public let body: String?
  public let attributes: AnyCodable?
  /**
   Number of attributes the SDK dropped while accepting this record (caller
   tried to use a reserved key, exceeded the per-record cap, etc.). Consumers
   may choose to forward this count to whatever ingest format they target.
   */
  public let droppedAttributesCount: Int
  /**
   Severity of the event.
   */
  public let severity: Severity
  public var timestamp: String = Date.now.ISO8601Format()

  init(
    name: String,
    body: String? = nil,
    attributes: [String: Any]? = nil,
    droppedAttributesCount: Int = 0,
    severity: Severity = .info,
    timestamp: String = Date.now.ISO8601Format()
  ) {
    self.name = name
    self.body = body
    self.attributes = attributes != nil ? AnyCodable(attributes) : nil
    self.droppedAttributesCount = droppedAttributesCount
    self.severity = severity
    self.timestamp = timestamp
  }
}
