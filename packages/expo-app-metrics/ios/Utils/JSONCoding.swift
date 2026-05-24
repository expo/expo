// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/**
 Encodes any `Encodable` value as a UTF-8 JSON string using ISO-8601 dates. Returns nil when
 encoding fails (a warning is logged) or when the bytes aren't valid UTF-8.
 */
func encodeAsJSONString<T: Encodable>(_ value: T) -> String? {
  let encoder = JSONEncoder()
  encoder.dateEncodingStrategy = .iso8601
  do {
    let data = try encoder.encode(value)
    return String(data: data, encoding: .utf8)
  } catch {
    logger.warn("[AppMetrics] Failed to JSON-encode value: \(error.localizedDescription)")
    return nil
  }
}

/**
 Encodes a plain `[String: String]` dictionary as a UTF-8 JSON string. Cheaper than routing through
 `Codable` when the shape is fixed.
 */
func encodeAsJSONString(_ value: [String: String]?) -> String? {
  guard let value, let data = try? JSONSerialization.data(withJSONObject: value) else {
    return nil
  }
  return String(data: data, encoding: .utf8)
}

/**
 Decodes a JSON-string column into a `[String: V]` dictionary, or nil when the string is missing or
 doesn't represent a JSON object of the expected shape.
 */
func decodeJSONDictionary<V>(_ json: String?) -> [String: V]? {
  guard let json, let data = json.data(using: .utf8) else {
    return nil
  }
  return try? JSONSerialization.jsonObject(with: data) as? [String: V]
}

/**
 Decodes a JSON-string column into the requested `Decodable` type using ISO-8601 dates. Returns nil
 when the column is absent or the payload is malformed (a warning is logged in the latter case).
 Symmetric with `encodeAsJSONString(_:)`.
 */
func decodeFromJSONString<T: Decodable>(_ type: T.Type, from json: String?) -> T? {
  guard let json, let data = json.data(using: .utf8) else {
    return nil
  }
  let decoder = JSONDecoder()
  decoder.dateDecodingStrategy = .iso8601
  do {
    return try decoder.decode(type, from: data)
  } catch {
    logger.warn("[AppMetrics] Failed to JSON-decode value as \(type): \(error.localizedDescription)")
    return nil
  }
}
