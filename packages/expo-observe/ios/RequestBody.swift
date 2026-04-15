// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Body of the request containing events with metrics for the EAS server.
 */
internal struct RequestBody: Codable, Sendable {
  let easClientId: String
  let events: [Event]
}
