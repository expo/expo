// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Validates the event name, truncates the body, sanitizes attributes, and builds a `LogRecord`, or
 returns `nil` when the event should be dropped (e.g. an empty or reserved name).

 Building lives here rather than on `Session` so the session class stays a thin persistence layer
 (it only stamps its own id in `receiveLog`), mirroring Android where validation and record building
 happen outside the session shared object. Pure and synchronous, so it can be unit-tested without a
 database.
 */
func makeLogRecord(name: String, options: LogEventOptions?) -> LogRecord? {
  guard let validatedName = validateEventName(name) else {
    return nil
  }
  let validatedBody = validateEventBody(options?.body)
  let sanitized = sanitizeLogEventAttributes(options?.attributes)
  // Globals merge happens in `LogRow.from` so every persistence path picks them up.
  return LogRecord(
    name: validatedName,
    body: validatedBody,
    attributes: sanitized.attributes,
    droppedAttributesCount: sanitized.droppedCount,
    severity: options?.severity ?? .info
  )
}
