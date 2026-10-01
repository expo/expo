// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/// A completed network request as an OTLP client span. The sink assigns the trace and span ids
/// when it stores the span.
///
/// For expo-observe. Not a stable API.
public struct NetworkSpan: Sendable {
  /// `SpanKind` values from the OTLP proto.
  public static let internalKind = 1
  public static let clientKind = 3

  /// `Status.code` values from the OTLP proto. UNSET is expressed by a `nil` `statusCode`.
  public static let statusError = 2

  public let name: String
  public let kind: Int
  public let startTimestampMs: Int64
  public let endTimestampMs: Int64
  public let statusCode: Int?
  public let statusMessage: String?
  /// JSON object of span attributes.
  public let attributes: String?
  /// JSON array of span events (`[{name, timeMs?, attributes}]`).
  public let events: String?
}

extension NetworkSpan {
  /// Maps a completed request onto a client span, per the OTel HTTP semantic conventions.
  ///
  /// The attribute keys are the set the ingestion endpoint extracts into dedicated columns.
  /// Returns `nil` when the snapshot has no usable timestamps, leaving nothing to anchor a span
  /// to.
  static func from(request: NetworkRequest) -> NetworkSpan? {
    let start = request.timings.fetchStart
    let end = request.timings.responseEnd
    let duration = request.timings.totalDuration
    guard
      let resolvedStart = start ?? end?.addingTimeInterval(-duration),
      let resolvedEnd = end ?? start?.addingTimeInterval(duration)
    else {
      return nil
    }

    // Case-sensitive per the conventions: an unknown or nonstandard method becomes `_OTHER`
    // (verbatim value preserved in `http.request.method_original`) and names the span `HTTP`,
    // so caller-controlled verbs can't mint unbounded span names.
    let isKnownMethod = knownHttpMethods.contains(request.method)
    var attributes: [String: Any] = [
      "http.request.method": isKnownMethod ? request.method : "_OTHER",
      "url.full": redactedUrlFull(request.url),
    ]
    if !isKnownMethod {
      attributes["http.request.method_original"] = request.method
    }
    if let host = request.url.host {
      attributes["server.address"] = host
    }
    if let port = request.url.port ?? defaultPort(forScheme: request.url.scheme) {
      attributes["server.port"] = port
    }
    if let statusCode = request.statusCode {
      attributes["http.response.status_code"] = statusCode
    }
    if let version = semconvProtocolVersion(request.networkProtocol) {
      attributes["network.protocol.version"] = version
    }
    if let requestBytesSent = request.requestBytesSent {
      attributes["http.request.size"] = requestBytesSent
    }
    if let responseBytesReceived = request.responseBytesReceived {
      attributes["http.response.size"] = responseBytesReceived
    }
    // Not a semconv attribute: a cached response is timestamped and byte-counted like a download,
    // so without this a large cache hit reads as an impossible transfer rate. Omitted when the
    // platform did not classify the fetch, so its absence never implies a network load.
    if let fetchType = request.fetchType {
      attributes["expo.http.resource.fetch_type"] = fetchType.rawValue
    }
    let httpErrorStatus = (request.statusCode ?? 0) >= 400
    // A cancellation is not a failure, per the conventions, but an error status still wins: a
    // request canceled while reading a 500 was answered with a 500.
    let wasCanceled = request.errorType == canceledErrorType
    let canceled = wasCanceled && !httpErrorStatus
    // Must stay low-cardinality, so never the localized description.
    let resolvedErrorType =
      httpErrorStatus
      ? request.statusCode.map(String.init)
      : (wasCanceled ? nil : request.errorType)
    if !canceled, let errorType = resolvedErrorType {
      attributes["error.type"] = errorType
    }

    let failed = !canceled && (request.errorDescription != nil || request.errorType != nil || httpErrorStatus)
    // A deliberate deviation: the conventions model redirects as resent spans
    // (`http.request.resend_count`), but this pipeline records one span per chain.
    let events: [[String: Any]] = request.redirects.map { redirect in
      var event: [String: Any] = [
        "name": "expo.http.redirect",
        // `expo.`-namespaced: the naming guidelines advise against application-specific names
        // under a semconv namespace. The status code reuses the registry attribute it matches.
        "attributes": [
          "expo.http.redirect.from": redirect.fromUrl.absoluteString,
          "expo.http.redirect.to": redirect.toUrl.absoluteString,
          "http.response.status_code": redirect.statusCode,
        ],
      ]
      // An OTLP event outside its own span has no valid place on the timeline. Without a time
      // the exporter anchors it to the span start.
      if let respondedAt = redirect.respondedAt?.unixMilliseconds,
        respondedAt >= resolvedStart.unixMilliseconds,
        respondedAt <= resolvedEnd.unixMilliseconds
      {
        event["timeMs"] = respondedAt
      }
      return event
    }

    return NetworkSpan(
      name: isKnownMethod ? request.method : "HTTP",
      kind: NetworkSpan.clientKind,
      startTimestampMs: resolvedStart.unixMilliseconds,
      endTimestampMs: resolvedEnd.unixMilliseconds,
      statusCode: failed ? NetworkSpan.statusError : nil,
      statusMessage: failed ? request.errorDescription : nil,
      attributes: serializeJSON(attributes),
      events: events.isEmpty ? nil : serializeJSON(events)
    )
  }

  /// The conventions' known method set: RFC 9110's methods plus PATCH and QUERY, matched
  /// case-sensitively as the conventions require.
  private static let knownHttpMethods: Set<String> = [
    "GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH", "QUERY",
  ]

  /// `errorType` value NSURLSession reports for an intentional cancellation
  /// (`NSURLErrorCancelled`).
  private static let canceledErrorType = "NSURLErrorDomain:-999"

  /// The conventions' default-sensitive `url.full` parameters, plus the legacy S3 pair.
  private static let sensitiveQueryParameters: Set<String> = [
    "awsaccesskeyid", "signature", "sig", "x-amz-signature", "x-amz-credential", "x-amz-security-token",
    "x-goog-signature",
  ]

  /// Redacts userinfo and default-sensitive query values, so secrets never reach disk or the
  /// wire.
  private static func redactedUrlFull(_ url: URL) -> String {
    guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
      // An unparseable URL can't prove it carries no secrets; drop the query outright.
      return url.absoluteString.components(separatedBy: "?").first ?? url.absoluteString
    }
    // Uses `percentEncodedQueryItems`, not `queryItems`: the decoded form is not byte-faithful
    // (`a%2Bb` becomes a literal `+`, which backends read as a space), which would corrupt the
    // parameters this function keeps.
    var redactedAnything = false
    if components.user != nil || components.password != nil {
      components.user = "REDACTED"
      components.password = "REDACTED"
      redactedAnything = true
    }
    if let queryItems = components.percentEncodedQueryItems, !queryItems.isEmpty {
      var itemsChanged = false
      let redactedItems = queryItems.map { item -> URLQueryItem in
        // A valueless parameter (`?sig`) carries no secret, and giving it one would report a URL
        // the app never sent.
        // Match the decoded name: a server reads `%73ig` as `sig`.
        let decodedName = item.name.removingPercentEncoding ?? item.name
        guard sensitiveQueryParameters.contains(decodedName.lowercased()), item.value != nil else {
          return item
        }
        itemsChanged = true
        return URLQueryItem(name: item.name, value: "REDACTED")
      }
      if itemsChanged {
        components.percentEncodedQueryItems = redactedItems
        redactedAnything = true
      }
    }
    guard redactedAnything else {
      return url.absoluteString
    }
    return components.string ?? url.absoluteString
  }

  /// Scheme-default port per semconv's `server.port` (a Required attribute for HTTP client
  /// spans), used when the URL carries no explicit port.
  private static func defaultPort(forScheme scheme: String?) -> Int? {
    switch scheme?.lowercased() {
    case "https", "wss":
      return 443
    case "http", "ws":
      return 80
    default:
      return nil
    }
  }

  /// Bare protocol version per semconv's `network.protocol.version` ("1.1", "2", "3"), mapped
  /// from the ALPN-style names the OS reports ("http/1.1", "h2", "h3"). Unrecognized values pass
  /// through verbatim rather than being dropped.
  private static func semconvProtocolVersion(_ networkProtocol: String?) -> String? {
    switch networkProtocol {
    case nil:
      return nil
    case "h2":
      return "2"
    case "h3":
      return "3"
    case .some(let other):
      return other.hasPrefix("http/") ? String(other.dropFirst("http/".count)) : other
    }
  }

  /// Serializes a JSON-compatible value built above; the inputs are all strings and numbers, so
  /// a failure means a programming error and degrading to `nil` (dropped blob) is safe.
  private static func serializeJSON(_ object: Any) -> String? {
    guard let data = try? JSONSerialization.data(withJSONObject: object) else {
      logger.warn("[AppMetrics] Failed to serialize span attributes")
      return nil
    }
    return String(data: data, encoding: .utf8)
  }
}

extension Date {
  /// Unix-epoch milliseconds, the integer form the spans table and the JS redirect record use.
  var unixMilliseconds: Int64 {
    return Int64((timeIntervalSince1970 * 1_000).rounded())
  }
}
