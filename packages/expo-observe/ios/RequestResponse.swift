// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Represents the response from the EAS server, if the request was successful.
 */
internal struct RequestResponse: Codable {
  let eventsProcessed: Int
  let metricsInserted: Int

  static func from(data: Data) throws -> Self {
    let decoder = JSONDecoder()
    return try decoder.decode(Self.self, from: data)
  }
}
