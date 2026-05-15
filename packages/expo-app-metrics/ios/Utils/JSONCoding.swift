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

/**
 Maps a `MetricRow` straight into the `[String: Any]` shape the JS bridge consumes — same field set
 as the TS `Metric` type. Cheaper than round-tripping through `JSONEncoder` + `JSONSerialization`
 when the payload is a long list of metrics. The persisted `sessionId` is not included; JS receives
 metrics under their owning `Session` shared object, so the foreign key is implicit.
 */
func metricRowAsJSObject(_ row: MetricRow) -> [String: Any] {
  var dict: [String: Any] = [
    "timestamp": row.timestamp,
    "name": row.name,
    "value": row.value
  ]
  if let category = row.category {
    dict["category"] = category
  }
  if let routeName = row.routeName {
    dict["routeName"] = routeName
  }
  if let updateId = row.updateId {
    dict["updateId"] = updateId
  }
  if let params: [String: Any] = decodeJSONDictionary(row.params) {
    dict["params"] = params
  }
  return dict
}

/**
 Maps a `LogRow` straight into the `[String: Any]` shape the JS bridge consumes — same field set as
 the TS `LogRecord` type. Storage- and dispatch-only fields (`sessionId`, `droppedAttributesCount`)
 are not surfaced on the JS read path.
 */
func logRowAsJSObject(_ row: LogRow) -> [String: Any] {
  var dict: [String: Any] = [
    "timestamp": row.timestamp,
    "name": row.name,
    "severity": row.severity
  ]
  if let body = row.body {
    dict["body"] = body
  }
  if let attributes: [String: Any] = decodeJSONDictionary(row.attributes) {
    dict["attributes"] = attributes
  }
  return dict
}
