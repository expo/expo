// Copyright 2025-present 650 Industries. All rights reserved.

internal protocol RequestBodyProtocol {
  func toData(_ formatting: JSONEncoder.OutputFormatting) throws -> Data
  func toString(_ formatting: JSONEncoder.OutputFormatting) throws -> String
}

/**
 Body of the request containing events with metrics for the EAS server.
 */
internal struct RequestBody: Codable, Sendable, RequestBodyProtocol {
  let easClientId: String
  let events: [Event]

  func toData(_ formatting: JSONEncoder.OutputFormatting = []) throws -> Data {
    let encoder = JSONEncoder()
    encoder.outputFormatting = formatting
    return try encoder.encode(self)
  }

  func toString(_ formatting: JSONEncoder.OutputFormatting = []) throws -> String {
    let data = try toData(formatting)
    return String(data: data, encoding: .utf8) ?? ""
  }
}
