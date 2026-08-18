import ExpoAppMetrics
import Foundation

// MARK: -- Open Telemetry data classes

struct OTStringValue: Codable, Sendable {
  let stringValue: String
}

/// Tagged union mirroring the OTLP `AnyValue` shape — encodes as an object with
/// exactly one of `stringValue` / `intValue` / `doubleValue` / `boolValue` /
/// `arrayValue` / `kvlistValue`, depending on the variant.
enum OTAnyValue: Codable, Sendable {
  case string(String)
  case int(Int64)
  case double(Double)
  case bool(Bool)
  case array([OTAnyValue])
  case kvlist([OTKeyValue])

  private enum CodingKeys: String, CodingKey {
    case stringValue, intValue, doubleValue, boolValue, arrayValue, kvlistValue
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    switch self {
    case .string(let value):
      try container.encode(value, forKey: .stringValue)
    case .int(let value):
      // OTLP/JSON spec encodes int64 as a stringified number to avoid loss in JS-style number
      // handling, but the EAS observability backend (ClickHouse) rejects strings here and requires
      // a JSON number. Emit as a number to match the server contract.
      try container.encode(value, forKey: .intValue)
    case .double(let value):
      try container.encode(value, forKey: .doubleValue)
    case .bool(let value):
      try container.encode(value, forKey: .boolValue)
    case .array(let values):
      try container.encode(OTArrayValue(values: values), forKey: .arrayValue)
    case .kvlist(let values):
      try container.encode(OTKeyValueList(values: values), forKey: .kvlistValue)
    }
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    if let value = try container.decodeIfPresent(String.self, forKey: .stringValue) {
      self = .string(value)
    } else if let value = try container.decodeIfPresent(Int64.self, forKey: .intValue) {
      self = .int(value)
    } else if let value = try container.decodeIfPresent(Double.self, forKey: .doubleValue) {
      self = .double(value)
    } else if let value = try container.decodeIfPresent(Bool.self, forKey: .boolValue) {
      self = .bool(value)
    } else if let value = try container.decodeIfPresent(OTArrayValue.self, forKey: .arrayValue) {
      self = .array(value.values)
    } else if let value = try container.decodeIfPresent(OTKeyValueList.self, forKey: .kvlistValue) {
      self = .kvlist(value.values)
    } else {
      throw DecodingError.dataCorruptedError(
        forKey: .stringValue,
        in: container,
        debugDescription: "OTAnyValue has no recognized variant"
      )
    }
  }
}

/// Inner `arrayValue` shape per the OTLP spec — wraps `values: [AnyValue]`.
struct OTArrayValue: Codable, Sendable {
  let values: [OTAnyValue]
}

/// Inner `kvlistValue` shape per the OTLP spec — wraps `values: [KeyValue]`.
struct OTKeyValueList: Codable, Sendable {
  let values: [OTKeyValue]
}

/// Key/value pair used inside `kvlistValue` (and at the top level for span
/// attributes). Same shape as `OTAttribute` but split out for the recursive case.
struct OTKeyValue: Codable, Sendable {
  let key: String
  let value: OTAnyValue
}

struct OTAttribute: Codable, Sendable {
  let key: String
  let value: OTAnyValue

  init(key: String, value: OTAnyValue) {
    self.key = key
    self.value = value
  }

  init(key: String, rawValue: String) {
    self.key = key
    self.value = .string(rawValue)
  }
}

struct OTDataPoint: Codable, Sendable {
  let timeUnixNano: UInt64
  let asDouble: Double
  let attributes: [OTAttribute]
}

struct OTGauge: Codable, Sendable {
  let dataPoints: [OTDataPoint]
}

struct OTMetric: Codable, Sendable {
  let unit: String
  let name: String
  let gauge: OTGauge
}

struct OTMetadata: Codable, Sendable {
  let attributes: [OTAttribute]
}

struct OTScope: Codable, Sendable {
  let name: String
  let version: String
}

struct OTScopeMetrics: Codable, Sendable {
  let scope: OTScope
  let metrics: [OTMetric]
}

struct OTEvent: Codable, Sendable {
  let resource: OTMetadata
  let scopeMetrics: [OTScopeMetrics]
  let schemaUrl: String
}

struct OTLogRecord: Codable, Sendable {
  let timeUnixNano: UInt64
  let observedTimeUnixNano: UInt64
  let severityNumber: Int
  let severityText: String
  let body: OTStringValue
  let attributes: [OTAttribute]
  let droppedAttributesCount: Int?
}

struct OTScopeLogs: Codable, Sendable {
  let scope: OTScope
  let logRecords: [OTLogRecord]
}

struct OTResourceLogs: Codable, Sendable {
  let resource: OTMetadata
  let scopeLogs: [OTScopeLogs]
  let schemaUrl: String
}

/// One OTLP span. Optionals (`parentSpanId`, `status`) rely on synthesized Codable's
/// `encodeIfPresent`: the ingestion endpoint rejects a span whose present `parentSpanId` isn't
/// valid hex, so a root span must omit the key entirely rather than send null or "".
struct OTSpan: Codable, Sendable {
  let traceId: String
  let spanId: String
  let parentSpanId: String?
  let name: String
  let kind: Int
  let startTimeUnixNano: UInt64
  let endTimeUnixNano: UInt64
  let attributes: [OTAttribute]
  let events: [OTSpanEvent]
  let droppedEventsCount: Int
  let status: OTSpanStatus?
}

/// `Span.Event` per the OTLP proto — used for redirect hops.
struct OTSpanEvent: Codable, Sendable {
  let timeUnixNano: UInt64
  let name: String
  let attributes: [OTAttribute]
}

/// `Status` per the OTLP proto. Only attached when the span represents a failure; a successful
/// client span stays UNSET by omitting the status entirely, per the semantic conventions.
struct OTSpanStatus: Codable, Sendable {
  let code: Int
  let message: String?
}

struct OTScopeSpans: Codable, Sendable {
  let scope: OTScope
  let spans: [OTSpan]
}

struct OTResourceSpans: Codable, Sendable {
  let resource: OTMetadata
  let scopeSpans: [OTScopeSpans]
  let schemaUrl: String
}

// MARK: -- Event extensions for Open Telemetry

/// OpenTelemetry Semantic Conventions schema URL referenced by the resource on
/// every dispatched payload. Bumping this constant signals that our attribute
/// names follow a newer revision of the conventions.
///
/// Before bumping, audit the attribute keys we set in `toOTMetadata` and
/// `toOTLogRecord` against the SemConv changelog at
/// https://github.com/open-telemetry/semantic-conventions/blob/main/CHANGELOG.md
/// — a renamed key would silently mismatch the declared schema otherwise.
private let semConvSchemaUrl = "https://opentelemetry.io/schemas/1.27.0"

// This must be kept in sync with the INTERNAL_TO_OTEL map in universe
// https://github.com/expo/universe/blob/main/server/www/src/middleware/easObserveRoutes.ts#L209
// Keyed by "<category>/<name>" — mirrors the (category, name) pair used by the
// Android port so the same metric name under a different category never silently
// collides.
let metricNameMap = [
  // App startup
  "appStartup/timeToInteractive": "expo.app_startup.tti",
  "appStartup/timeToFirstRender": "expo.app_startup.ttr",
  "appStartup/coldLaunchTime": "expo.app_startup.cold_launch_time",
  "appStartup/warmLaunchTime": "expo.app_startup.warm_launch_time",
  "appStartup/bundleLoadTime": "expo.app_startup.bundle_load_time",

  // Legacy app startup metrics - will be removed in a future release
  "appStartup/loadTime": "expo.app_startup.load_time",
  "appStartup/launchTime": "expo.app_startup.launch_time",

  // Updates
  "updates/updateDownloadTime": "expo.updates.download_time",

  // Navigation
  "navigation/cold_ttr": "expo.navigation.cold_ttr",
  "navigation/warm_ttr": "expo.navigation.warm_ttr",
  "navigation/tti": "expo.navigation.tti",
]

private func nsFromISOString(_ dateString: String?) -> UInt64 {
  if let dateString,
    let date = try? Date.ISO8601FormatStyle().parse(dateString)
  {
    return UInt64((date.timeIntervalSince1970 * 1_000).rounded()) * 1_000_000
  }
  return UInt64(Date().timeIntervalSince1970 * 1_000_000_000)
}

extension Event.Metric {
  private func nsFromISODateString() -> UInt64 {
    return nsFromISOString(self.timestamp)
  }

  func toOTMetric() -> OTMetric {
    var attributes: [OTAttribute] = [
      OTAttribute(key: "session.id", rawValue: sessionId)
    ]
    if let routeName {
      attributes.append(OTAttribute(key: "expo.route_name", rawValue: routeName))
    }
    if let updateId {
      attributes.append(OTAttribute(key: "expo.update_id", rawValue: updateId))
    }
    if let customParamsString = try? customParams?.toJSONString() {
      attributes.append(OTAttribute(key: "expo.custom_params", rawValue: customParamsString))
    }

    let lookupKey = "\(self.category ?? "unknown")/\(self.name)"
    return OTMetric(
      unit: "s",
      name: metricNameMap[lookupKey] ?? "expo.unknown.\(self.name)",
      gauge: OTGauge(dataPoints: [
        OTDataPoint(
          timeUnixNano: nsFromISODateString(),
          asDouble: self.value,
          attributes: attributes
        )
      ])
    )
  }
}

extension Event.Log {
  func toOTLogRecord() -> OTLogRecord {
    var attributes: [OTAttribute] = [
      OTAttribute(key: "session.id", rawValue: sessionId),
      OTAttribute(key: "event.name", rawValue: name),
    ]

    var encodeTimeDrops = 0
    if let userDict = self.attributes?.value as? [String: Any] {
      let (typed, dropped) = otAttributesFromUserDict(userDict)
      attributes.append(contentsOf: typed)
      encodeTimeDrops = dropped
    }

    let totalDrops = droppedAttributesCount + encodeTimeDrops
    let timeNs = nsFromISOString(timestamp)
    return OTLogRecord(
      timeUnixNano: timeNs,
      observedTimeUnixNano: timeNs,
      severityNumber: severity.severityNumber,
      severityText: severity.severityText,
      body: OTStringValue(stringValue: body ?? ""),
      attributes: attributes,
      droppedAttributesCount: totalDrops > 0 ? totalDrops : nil
    )
  }
}

/// Maximum span events the ingestion endpoint keeps per span; anything past it is counted as
/// dropped server-side, so the SDK truncates locally and reports the loss itself instead of
/// shipping payload that is guaranteed to be discarded.
private let maxSpanEventCount = 32

/// Converts a persisted unix-epoch millisecond timestamp to nanoseconds, saturating instead of
/// trapping: a corrupt row or a device clock set far into the future must never crash the host
/// app from inside the telemetry library.
private func spanNanoseconds(fromMilliseconds milliseconds: Int64) -> UInt64 {
  let maxRepresentableMs = Int64(UInt64.max / 1_000_000)
  return UInt64(min(max(0, milliseconds), maxRepresentableMs)) * 1_000_000
}

extension SpanRow {
  /// Maps one persisted span row onto the OTLP wire shape. The mapping is producer-agnostic:
  /// attributes and events were shaped by whichever producer recorded the row (per its own
  /// semantic conventions), and this conversion only handles the generic concerns — timestamps,
  /// the session attribute, the event cap, and the JSON-to-`AnyValue` typing.
  func toOTSpan() -> OTSpan {
    // Millisecond precision matches the backend's DateTime64(3) storage. A clock adjustment
    // mid-span can invert the two wall-clock timestamps, and the server rejects a span whose
    // end precedes its start, so the end clamps to the start.
    let startNs = spanNanoseconds(fromMilliseconds: startTimestampMs)
    let endNs = max(startNs, spanNanoseconds(fromMilliseconds: endTimestampMs))

    var otAttributes: [OTAttribute] = [
      OTAttribute(key: "session.id", rawValue: sessionId)
    ]
    if let attributesDict = decodeJSONObject(attributes) {
      otAttributes.append(contentsOf: otAttributesFromUserDict(attributesDict).attributes)
    }

    // The ingestion endpoint keeps at most `maxSpanEventCount` events per span and counts the
    // rest as dropped; truncating locally reports the same loss without shipping payload that
    // is guaranteed to be discarded.
    let allEvents = decodeJSONArray(events) ?? []
    let otEvents = allEvents.prefix(maxSpanEventCount).compactMap { event -> OTSpanEvent? in
      guard let name = event["name"] as? String else {
        return nil
      }
      let eventAttributes = (event["attributes"] as? [String: Any]).map {
        otAttributesFromUserDict($0).attributes
      }
      // Producers may record a per-event timestamp; without one the event anchors to the span
      // start, which keeps it inside the span window.
      let timeNs = (event["timeMs"] as? Int64).map(spanNanoseconds(fromMilliseconds:)) ?? startNs
      return OTSpanEvent(timeUnixNano: timeNs, name: name, attributes: eventAttributes ?? [])
    }

    return OTSpan(
      traceId: traceId,
      spanId: spanId,
      parentSpanId: parentSpanId,
      name: name,
      kind: kind,
      startTimeUnixNano: startNs,
      endTimeUnixNano: endNs,
      attributes: otAttributes,
      events: otEvents,
      droppedEventsCount: max(0, allEvents.count - maxSpanEventCount),
      status: statusCode.map { OTSpanStatus(code: $0, message: statusMessage) }
    )
  }
}

/// Decodes a JSON-object column into a dictionary, or `nil` when absent or malformed.
private func decodeJSONObject(_ json: String?) -> [String: Any]? {
  guard let json, let data = json.data(using: .utf8) else {
    return nil
  }
  return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
}

/// Decodes a JSON-array column into an array of objects, or `nil` when absent or malformed.
private func decodeJSONArray(_ json: String?) -> [[String: Any]]? {
  guard let json, let data = json.data(using: .utf8) else {
    return nil
  }
  return (try? JSONSerialization.jsonObject(with: data)) as? [[String: Any]]
}

/// Maps a caller-supplied attribute dictionary to typed `OTAttribute`s. Returns the
/// mapped attributes plus a count of entries that could not be represented (a
/// value type we don't support, or a deeply unrepresentable nested structure) so
/// the caller can fold them into the OTel `droppedAttributesCount`.
func otAttributesFromUserDict(_ dict: [String: Any]) -> (attributes: [OTAttribute], droppedCount: Int) {
  var attributes: [OTAttribute] = []
  var droppedCount = 0
  for (key, value) in dict {
    if let mapped = otAnyValue(from: value) {
      attributes.append(OTAttribute(key: key, value: mapped))
    } else {
      droppedCount += 1
    }
  }
  return (attributes, droppedCount)
}

/// Converts an arbitrary `Any` value coming from the JS bridge (or the AnyCodable
/// storage roundtrip) into an `OTAnyValue`. Returns `nil` for values whose type
/// cannot be expressed in OTLP — callers should treat these as dropped attributes.
///
/// Booleans must be tested before integers because `Bool` bridges to `NSNumber`
/// and would otherwise be matched as `Int` first.
func otAnyValue(from value: Any) -> OTAnyValue? {
  // `as? Bool` succeeds for any NSNumber holding 0 or 1 — including `Int(0)` / `Int(1)` from JS,
  // which would otherwise quietly emit as `boolValue` instead of `intValue`. Distinguish real
  // booleans by checking against `CFBoolean`'s type id, which only the actual boxed Bool matches.
  if CFGetTypeID(value as CFTypeRef) == CFBooleanGetTypeID(), let bool = value as? Bool {
    return .bool(bool)
  }
  if let int = value as? Int64 {
    return .int(int)
  }
  if let int = value as? Int {
    return .int(Int64(int))
  }
  if let uint = value as? UInt {
    if uint <= UInt(Int64.max) {
      return .int(Int64(uint))
    }
    return nil
  }
  if let double = value as? Double {
    // JSON cannot represent NaN/±Infinity. JSONEncoder throws on encode by default,
    // which would fail the entire dispatch — drop the value instead so the rest of
    // the record still ships and the loss is reflected in `droppedAttributesCount`.
    return double.isFinite ? .double(double) : nil
  }
  if let float = value as? Float {
    return float.isFinite ? .double(Double(float)) : nil
  }
  if let string = value as? String {
    return .string(string)
  }
  if let array = value as? [Any] {
    let mapped = array.compactMap(otAnyValue(from:))
    if mapped.count != array.count {
      // One or more elements were unrepresentable — drop the whole array rather
      // than silently shipping a partial list.
      return nil
    }
    return .array(mapped)
  }
  if let dict = value as? [String: Any] {
    var pairs: [OTKeyValue] = []
    for (k, v) in dict {
      guard let mapped = otAnyValue(from: v) else {
        return nil
      }
      pairs.append(OTKeyValue(key: k, value: mapped))
    }
    return .kvlist(pairs)
  }
  return nil
}

extension Event {
  func toOTMetadata(_ easClientId: String) -> OTMetadata {
    var attributes: [OTAttribute] = [
      OTAttribute(key: "os.type", rawValue: "darwin"),
      OTAttribute(key: "os.name", rawValue: metadata.deviceOs),
      OTAttribute(key: "os.version", rawValue: metadata.deviceOsVersion),
      OTAttribute(key: "device.model.name", rawValue: metadata.deviceName),
      OTAttribute(key: "device.model.identifier", rawValue: metadata.deviceModel),
      OTAttribute(key: "browser.language", rawValue: metadata.languageTag),
      OTAttribute(key: "telemetry.sdk.name", rawValue: "expo-observe"),
      OTAttribute(key: "telemetry.sdk.version", rawValue: ObserveVersions.clientVersion),
      OTAttribute(key: "telemetry.sdk.language", rawValue: "swift"),
      OTAttribute(key: "expo.sdk.version", rawValue: metadata.expoSdkVersion),
      OTAttribute(key: "expo.react_native.version", rawValue: metadata.reactNativeVersion),
      OTAttribute(key: "expo.eas_client.id", rawValue: easClientId),
    ]

    // Send optional attributes only if they are set.
    // Their defaults should be defined by the backend.
    if let appIdentifier = metadata.appIdentifier {
      attributes.append(OTAttribute(key: "service.name", rawValue: appIdentifier))
    }
    if let appVersion = metadata.appVersion {
      attributes.append(OTAttribute(key: "service.version", rawValue: appVersion))
    }
    if let appName = metadata.appName {
      attributes.append(OTAttribute(key: "expo.app.name", rawValue: appName))
    }
    if let appBuildNumber = metadata.appBuildNumber {
      attributes.append(OTAttribute(key: "expo.app.build_number", rawValue: appBuildNumber))
    }
    if let appUpdateId = metadata.appUpdatesInfo?.updateId {
      // Fallback for backward compatibility
      attributes.append(OTAttribute(key: "expo.app.update_id", rawValue: appUpdateId))
      attributes.append(OTAttribute(key: "expo.app.updates.id", rawValue: appUpdateId))
    }
    if let channel = metadata.appUpdatesInfo?.channel {
      attributes.append(OTAttribute(key: "expo.app.updates.channel", rawValue: channel))
    }
    if let appUpdateRuntimeVersion = metadata.appUpdatesInfo?.runtimeVersion {
      attributes.append(OTAttribute(key: "expo.app.updates.runtime_version", rawValue: appUpdateRuntimeVersion))
    }
    if let environment = metadata.environment {
      attributes.append(OTAttribute(key: "expo.environment", rawValue: environment))
    }
    if let appEasBuildId = metadata.appEasBuildId {
      attributes.append(OTAttribute(key: "expo.eas_build.id", rawValue: appEasBuildId))
    }
    return OTMetadata(attributes: attributes)
  }

  func toOTEvent(_ easClientId: String) -> OTEvent {
    OTEvent(
      resource: toOTMetadata(easClientId),
      scopeMetrics: [
        OTScopeMetrics(
          scope: OTScope(name: "expo-observe", version: ObserveVersions.clientVersion),
          metrics: self.metrics.map { $0.toOTMetric() }
        )
      ],
      schemaUrl: semConvSchemaUrl
    )
  }

  func toOTResourceLogs(_ easClientId: String) -> OTResourceLogs {
    OTResourceLogs(
      resource: toOTMetadata(easClientId),
      scopeLogs: [
        OTScopeLogs(
          scope: OTScope(name: "expo-observe", version: ObserveVersions.clientVersion),
          logRecords: self.logs.map { $0.toOTLogRecord() }
        )
      ],
      schemaUrl: semConvSchemaUrl
    )
  }

  /// Wraps already-mapped spans in this event's resource envelope. Spans are passed in rather
  /// than derived from the event because they come from `spans` rows, which are not part of the
  /// `Event` payload shape the metrics/logs signals share.
  func toOTResourceSpans(_ easClientId: String, spans: [OTSpan]) -> OTResourceSpans {
    OTResourceSpans(
      resource: toOTMetadata(easClientId),
      scopeSpans: [
        OTScopeSpans(
          scope: OTScope(name: "expo-observe", version: ObserveVersions.clientVersion),
          spans: spans
        )
      ],
      schemaUrl: semConvSchemaUrl
    )
  }
}

// MARK: -- Request body for Open Telemetry events

internal struct OTRequestBody: Codable, Sendable {
  let resourceMetrics: [OTEvent]
}

internal struct OTLogsRequestBody: Codable, Sendable {
  let resourceLogs: [OTResourceLogs]
}

internal struct OTTracesRequestBody: Codable, Sendable {
  let resourceSpans: [OTResourceSpans]
}

// MARK: -- Response shapes for Open Telemetry endpoints

/// Per OTLP/HTTP, the `/v1/metrics`, `/v1/logs` and `/v1/traces` endpoints return an
/// `ExportXServiceResponse` with an optional `partial_success` object. Our server emits it (with
/// camelCase JSON keys — no snake_case translation) only when there were actual rejections, e.g.
/// `{ "partialSuccess": { "rejectedDataPoints": 3, "errorMessage": "..." } }`. We model the
/// union — `rejectedDataPoints` for metrics, `rejectedLogRecords` for logs, `rejectedSpans` for
/// traces — so a single decoder works for any of the endpoints.
///
/// Spec: https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md
internal struct OTPartialSuccess: Codable, Equatable, Sendable {
  let rejectedDataPoints: Int64?
  let rejectedLogRecords: Int64?
  let rejectedSpans: Int64?
  let errorMessage: String?

  /// Count of records the server says it rejected from this batch. The OTLP spec also allows
  /// `partial_success` to carry a warning-only payload (`rejectedCount == 0` with a non-empty
  /// `errorMessage`); the dispatch classifier treats that as a successful send with a logged
  /// warning rather than a batch drop.
  var rejectedCount: Int64 {
    (rejectedDataPoints ?? 0) + (rejectedLogRecords ?? 0) + (rejectedSpans ?? 0)
  }
}

internal struct OTServiceResponse: Codable, Sendable {
  let partialSuccess: OTPartialSuccess?
}
