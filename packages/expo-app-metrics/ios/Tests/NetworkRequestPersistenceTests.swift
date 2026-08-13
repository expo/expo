import Foundation
import Testing

@testable import ExpoAppMetrics

private let fixedStart = Date(timeIntervalSince1970: 1_782_131_895)

private func makeTimings(
  fetchStart: Date? = fixedStart,
  responseEnd: Date? = fixedStart.addingTimeInterval(0.25),
  totalDuration: TimeInterval = 0.25
) -> NetworkRequest.Timings {
  return NetworkRequest.Timings(
    fetchStart: fetchStart,
    domainLookupStart: nil,
    domainLookupEnd: nil,
    connectStart: nil,
    connectEnd: nil,
    secureConnectionStart: nil,
    secureConnectionEnd: nil,
    requestStart: nil,
    requestEnd: nil,
    responseStart: nil,
    responseEnd: responseEnd,
    measuredResponseEnd: responseEnd,
    totalDuration: totalDuration
  )
}

private func makeRequest(
  url: String = "https://api.example.com/v1/items?page=2",
  method: String = "GET",
  statusCode: Int? = 200,
  networkProtocol: String? = "h2",
  requestBytesSent: Int64? = 412,
  responseBytesReceived: Int64? = 8_192,
  timings: NetworkRequest.Timings = makeTimings(),
  errorDescription: String? = nil,
  errorType: String? = nil,
  fetchType: NetworkRequest.FetchType? = .network,
  redirects: [NetworkRequest.Redirect] = []
) -> NetworkRequest {
  return NetworkRequest(
    id: UUID(),
    url: URL(string: url)!,
    method: method,
    statusCode: statusCode,
    networkProtocol: networkProtocol,
    requestBytesSent: requestBytesSent,
    responseBytesReceived: responseBytesReceived,
    fetchType: fetchType,
    timings: timings,
    errorDescription: errorDescription,
    errorType: errorType,
    redirects: redirects
  )
}

private func makeSpan(_ request: NetworkRequest) throws -> SpanRow {
  return try #require(SpanRow.from(request: request, sessionId: "s"))
}

/// Decodes the row's `attributes` JSON blob for assertions.
private func attributesDict(_ row: SpanRow) throws -> [String: Any] {
  let json = try #require(row.attributes)
  let object = try JSONSerialization.jsonObject(with: Data(json.utf8))
  return try #require(object as? [String: Any])
}

/// Decodes the row's `events` JSON blob for assertions.
private func eventsArray(_ row: SpanRow) throws -> [[String: Any]] {
  let json = try #require(row.events)
  let object = try JSONSerialization.jsonObject(with: Data(json.utf8))
  return try #require(object as? [[String: Any]])
}

@AppMetricsActor
@Suite("NetworkRequest to SpanRow mapping")
struct NetworkRequestSpanMappingTests {
  @Test
  func `converts a completed request into a client span with millisecond timestamps`() throws {
    let row = try makeSpan(makeRequest(method: "POST"))
    #expect(row.sessionId == "s")
    #expect(row.name == "POST")
    #expect(row.kind == SpanRow.clientKind)
    #expect(row.startTimestampMs == 1_782_131_895_000)
    #expect(row.endTimestampMs == 1_782_131_895_250)
    #expect(row.parentSpanId == nil)
    #expect(row.events == nil)
  }

  @Test
  func `maps the HTTP semantic-convention attributes the server extracts to columns`() throws {
    let attributes = try attributesDict(makeSpan(makeRequest()))
    #expect(attributes["http.request.method"] as? String == "GET")
    #expect(attributes["http.response.status_code"] as? Int == 200)
    #expect(attributes["url.full"] as? String == "https://api.example.com/v1/items?page=2")
    #expect(attributes["server.address"] as? String == "api.example.com")
    #expect(attributes["http.request.size"] as? Int64 == 412)
    #expect(attributes["http.response.size"] as? Int64 == 8_192)
  }

  @Test
  func `normalizes the network protocol name to a semconv version`() throws {
    // The OS reports `http/1.1`, `h2`, `h3`; semconv's `network.protocol.version` wants the
    // bare version, and the server stores it in a LowCardinality column.
    let expected = [
      "http/1.1": "1.1",
      "http/1.0": "1.0",
      "h2": "2",
      "h3": "3",
    ]
    for (reported, version) in expected {
      let attributes = try attributesDict(makeSpan(makeRequest(networkProtocol: reported)))
      #expect(attributes["network.protocol.version"] as? String == version)
    }
  }

  @Test
  func `omits attributes that were never measured`() throws {
    // A request that died before headers has no status and no byte counts. Sending a
    // placeholder would be indistinguishable from a genuine zero.
    let request = makeRequest(
      statusCode: nil,
      networkProtocol: nil,
      requestBytesSent: nil,
      responseBytesReceived: nil
    )
    let attributes = try attributesDict(makeSpan(request))
    #expect(attributes["http.response.status_code"] == nil)
    #expect(attributes["network.protocol.version"] == nil)
    #expect(attributes["http.request.size"] == nil)
    #expect(attributes["http.response.size"] == nil)
  }

  @Test
  func `keeps ordinary query values but redacts the default-sensitive ones`() throws {
    // Redaction is the instrumentation's job per the conventions; signed-URL secrets must
    // never reach the on-device database. Ordinary parameters stay, so ingestion can still
    // group by them.
    let url = "https://api.example.com/search?q=hello&sig=secret&X-Amz-Signature=abc"
    let attributes = try attributesDict(makeSpan(makeRequest(url: url)))
    #expect(
      attributes["url.full"] as? String
        == "https://api.example.com/search?q=hello&sig=REDACTED&X-Amz-Signature=REDACTED"
    )
  }

  @Test
  func `redacts every default-sensitive query parameter of a presigned S3 URL`() throws {
    // The `url.full` convention lists five default-sensitive parameters. `X-Amz-Credential`
    // carries the access key id and `X-Amz-Security-Token` the session token; leaking either
    // is as bad as leaking the signature.
    let url =
      "https://bucket.s3.amazonaws.com/key"
      + "?X-Amz-Algorithm=AWS4-HMAC-SHA256"
      + "&X-Amz-Credential=AKIAEXAMPLE%2F20260907%2Fus-east-1%2Fs3%2Faws4_request"
      + "&X-Amz-Security-Token=session-token"
      + "&X-Amz-Signature=abc"
    let attributes = try attributesDict(makeSpan(makeRequest(url: url)))
    #expect(
      attributes["url.full"] as? String
        == "https://bucket.s3.amazonaws.com/key"
        + "?X-Amz-Algorithm=AWS4-HMAC-SHA256"
        + "&X-Amz-Credential=REDACTED"
        + "&X-Amz-Security-Token=REDACTED"
        + "&X-Amz-Signature=REDACTED"
    )
  }

  @Test
  func `redacts a sensitive parameter whose name is percent-encoded`() throws {
    // A server decodes `%73ig` back to `sig`, so a presigned URL spelled that way carries a real
    // secret. Matching the encoded name against the plain-text list would miss it.
    let url = "https://api.example.com/search?%73ig=secret&X%2DAmz%2DSignature=abc&q=hello"
    let attributes = try attributesDict(makeSpan(makeRequest(url: url)))
    #expect(
      attributes["url.full"] as? String
        == "https://api.example.com/search?%73ig=REDACTED&X%2DAmz%2DSignature=REDACTED&q=hello"
    )
  }

  @Test
  func `leaves an unredacted URL byte-identical`() throws {
    // Percent-encoding must survive: a decode/re-encode round trip would turn `a%2Bb` into a
    // literal `+`, which backends read as a space.
    let url = "https://api.example.com/search?q=a%2Bb&page=2"
    let attributes = try attributesDict(makeSpan(makeRequest(url: url)))
    #expect(attributes["url.full"] as? String == url)
  }

  @Test
  func `preserves percent-encoding in the parameters it keeps`() throws {
    // Redaction must not disturb the values it leaves alone. Decoding and re-encoding the query
    // turns `a%2Bb` into a literal `+`, which every backend reads as a space, so a search for
    // "a+b" would silently become a search for "a b" on exactly the URLs that carry a secret.
    let url = "https://api.example.com/search?q=a%2Bb&sig=secret"
    let attributes = try attributesDict(makeSpan(makeRequest(url: url)))
    #expect(attributes["url.full"] as? String == "https://api.example.com/search?q=a%2Bb&sig=REDACTED")
  }

  @Test
  func `keeps query parameters in the order they were sent`() throws {
    // `url.full` is the key URL-level analysis groups on, so reordering splits one endpoint into
    // several distinct strings depending on where the signed parameter happened to sit.
    let url = "https://api.example.com/search?sig=secret&q=hello&page=2"
    let attributes = try attributesDict(makeSpan(makeRequest(url: url)))
    #expect(attributes["url.full"] as? String == "https://api.example.com/search?sig=REDACTED&q=hello&page=2")
  }

  @Test
  func `redacts userinfo credentials from the URL`() throws {
    let attributes = try attributesDict(makeSpan(makeRequest(url: "https://user:pass@api.example.com/items")))
    #expect(attributes["url.full"] as? String == "https://REDACTED:REDACTED@api.example.com/items")
  }

  @Test
  func `records the server port, defaulting from the scheme`() throws {
    let explicit = try attributesDict(makeSpan(makeRequest(url: "https://api.example.com:8443/x")))
    #expect(explicit["server.port"] as? Int == 8443)
    let https = try attributesDict(makeSpan(makeRequest(url: "https://api.example.com/x")))
    #expect(https["server.port"] as? Int == 443)
    let http = try attributesDict(makeSpan(makeRequest(url: "http://api.example.com/x")))
    #expect(http["server.port"] as? Int == 80)
  }

  @Test
  func `records how the response was fetched, and omits it when the OS did not classify`() throws {
    // A cache hit is timestamped and byte-counted like a download, so without this attribute a
    // 7 MB response read off disk in 100 ms looks like an impossible transfer rate. `.unknown`
    // (an `NSURLProtocol` subclass intercepted the task) omits the key rather than guessing.
    let expected: [NetworkRequest.FetchType: String] = [
      .network: "network",
      .cache: "cache",
      .serverPush: "server_push",
    ]
    for (fetchType, value) in expected {
      let attributes = try attributesDict(makeSpan(makeRequest(fetchType: fetchType)))
      #expect(attributes["expo.http.resource.fetch_type"] as? String == value)
    }
    let unknown = try attributesDict(makeSpan(makeRequest(fetchType: nil)))
    #expect(unknown["expo.http.resource.fetch_type"] == nil)
  }

  @Test
  func `keeps the conventions' known methods verbatim`() throws {
    // The known set is RFC 9110's methods plus PATCH and QUERY. Each names the span and is
    // recorded as `http.request.method` as sent, with no `method_original`.
    for method in ["GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH", "QUERY"] {
      let row = try makeSpan(makeRequest(method: method))
      let attributes = try attributesDict(row)
      #expect(row.name == method)
      #expect(attributes["http.request.method"] as? String == method)
      #expect(attributes["http.request.method_original"] == nil, "unexpected method_original for \(method)")
    }
  }

  @Test
  func `maps a nonstandard method to _OTHER and names the span HTTP`() throws {
    // Case-sensitive per the conventions: even a lowercase standard verb is not "known", so
    // caller-controlled method strings can't mint unbounded span names.
    for method in ["PURGE", "get"] {
      let row = try makeSpan(makeRequest(method: method))
      let attributes = try attributesDict(row)
      #expect(row.name == "HTTP")
      #expect(attributes["http.request.method"] as? String == "_OTHER")
      #expect(attributes["http.request.method_original"] as? String == method)
    }
  }

  @Test
  func `records a canceled request without a status or error type`() throws {
    // Intentional cancellations (AbortController, prefetch aborts) are routine in RN apps;
    // per the conventions they keep their span but are not errors.
    let row = try makeSpan(
      makeRequest(
        statusCode: nil,
        errorDescription: "canceled",
        errorType: "NSURLErrorDomain:-999"
      )
    )
    #expect(row.statusCode == nil)
    #expect(row.statusMessage == nil)
    #expect(try attributesDict(row)["error.type"] == nil)
  }

  @Test
  func `keeps the error status when a request is canceled while reading an error response`() throws {
    // A cancel that arrives after the server already answered must not erase that answer: the
    // response was a 500 regardless of who hung up first. Android guards the same case.
    let row = try makeSpan(
      makeRequest(
        statusCode: 500,
        errorDescription: "canceled",
        errorType: "NSURLErrorDomain:-999"
      )
    )
    #expect(row.statusCode == SpanRow.statusError)
    #expect(try attributesDict(row)["error.type"] as? String == "500")
  }

  @Test
  func `leaves the status unset for a successful response`() throws {
    // Semconv: a client span for a 2xx response carries no explicit status.
    let row = try makeSpan(makeRequest(statusCode: 200))
    #expect(row.statusCode == nil)
    #expect(row.statusMessage == nil)
  }

  @Test
  func `marks 4xx and 5xx responses as errors`() throws {
    // Semconv makes any 4xx/5xx an error for a client span, unlike the server-span rule.
    for statusCode in [400, 404, 429, 500, 503] {
      let row = try makeSpan(makeRequest(statusCode: statusCode))
      #expect(row.statusCode == SpanRow.statusError, "expected ERROR for status \(statusCode)")
    }
  }

  @Test
  func `marks a transport failure as an error with the description as the status message`() throws {
    // `errorDescription` is localized free text, so it belongs in the status message. The
    // low-cardinality `error.type` attribute gets a separate, predictable value.
    let row = try makeSpan(
      makeRequest(
        statusCode: nil,
        errorDescription: "The Internet connection appears to be offline.",
        errorType: "NSURLErrorDomain:-1009"
      )
    )
    #expect(row.statusCode == SpanRow.statusError)
    #expect(row.statusMessage == "The Internet connection appears to be offline.")
    let attributes = try attributesDict(row)
    #expect(attributes["error.type"] as? String == "NSURLErrorDomain:-1009")
  }

  @Test
  func `sets the error type to the status code for an HTTP error response`() throws {
    // Semconv: when a request completes with an error status and no exception, `error.type`
    // is the status code as a string.
    let attributes = try attributesDict(makeSpan(makeRequest(statusCode: 503)))
    #expect(attributes["error.type"] as? String == "503")
  }

  @Test
  func `omits the error type on success`() throws {
    let attributes = try attributesDict(makeSpan(makeRequest(statusCode: 204)))
    #expect(attributes["error.type"] == nil)
  }

  @Test
  func `maps each redirect hop onto an event`() throws {
    let request = makeRequest(redirects: [
      NetworkRequest.Redirect(
        fromUrl: URL(string: "https://example.com/a")!,
        toUrl: URL(string: "https://example.com/b")!,
        statusCode: 301,
        respondedAt: fixedStart.addingTimeInterval(0.1)
      ),
      NetworkRequest.Redirect(
        fromUrl: URL(string: "https://example.com/b")!,
        toUrl: URL(string: "https://example.com/c")!,
        statusCode: 302,
        respondedAt: nil
      ),
    ])
    // Event and attribute names follow the naming guidelines: application-specific names live
    // under the `expo.` namespace, and the hop's status reuses the registry's
    // `http.response.status_code`.
    let events = try eventsArray(makeSpan(request))
    #expect(events.count == 2)
    #expect(events.allSatisfy { $0["name"] as? String == "expo.http.redirect" })
    let first = try #require(events.first?["attributes"] as? [String: Any])
    #expect(first["expo.http.redirect.from"] as? String == "https://example.com/a")
    #expect(first["expo.http.redirect.to"] as? String == "https://example.com/b")
    #expect(first["http.response.status_code"] as? Int == 301)
    #expect(first.count == 3, "unexpected attributes: \(first.keys.sorted())")
    // A hop's arrival time becomes the event time; without one the exporter anchors the event
    // to the span start, so the key is omitted rather than faked.
    #expect(events[0]["timeMs"] as? Int64 == 1_782_131_895_100)
    #expect(events[1]["timeMs"] == nil)
  }

  @Test
  func `keeps redirect event times inside the span window`() throws {
    // A hop that the platform timed before the span's own start has no valid place on the
    // timeline: OTLP events must sit within their span. Rather than ship an event that precedes
    // its span, drop the time and let the exporter anchor the event to the span start.
    let request = makeRequest(redirects: [
      NetworkRequest.Redirect(
        fromUrl: URL(string: "https://example.com/a")!,
        toUrl: URL(string: "https://example.com/b")!,
        statusCode: 301,
        respondedAt: fixedStart.addingTimeInterval(-0.5)
      ),
      NetworkRequest.Redirect(
        fromUrl: URL(string: "https://example.com/b")!,
        toUrl: URL(string: "https://example.com/c")!,
        statusCode: 302,
        respondedAt: fixedStart.addingTimeInterval(5)
      ),
    ])
    let events = try eventsArray(makeSpan(request))
    #expect(events[0]["timeMs"] == nil)
    #expect(events[1]["timeMs"] == nil)
  }

  @Test
  func `assigns generated identifiers to each span`() throws {
    let first = try makeSpan(makeRequest())
    let second = try makeSpan(makeRequest())
    #expect(first.traceId.count == 32)
    #expect(first.spanId.count == 16)
    #expect(first.traceId != second.traceId)
  }

  @Test
  func `derives a missing end timestamp from the total duration`() throws {
    // The `setState:` fallback path can produce a snapshot before the OS reported a
    // response end; the row still needs a usable window for the span.
    let timings = makeTimings(fetchStart: fixedStart, responseEnd: nil, totalDuration: 1.5)
    let row = try makeSpan(makeRequest(timings: timings))
    #expect(row.startTimestampMs == 1_782_131_895_000)
    #expect(row.endTimestampMs == 1_782_131_896_500)
  }

  @Test
  func `returns nil when the request carries no usable timestamps`() {
    // Without either endpoint of the window there is nothing to anchor a span to. The
    // factory always sets both, so this only guards direct construction.
    let timings = makeTimings(fetchStart: nil, responseEnd: nil, totalDuration: 0)
    let row = SpanRow.from(request: makeRequest(timings: timings), sessionId: "s")
    #expect(row == nil)
  }
}

@AppMetricsActor
@Suite("NetworkRequestPersistence")
struct NetworkRequestPersistenceTests {
  private func withTemporaryDatabase(_ body: (MetricsDatabase) throws -> Void) throws {
    let directoryUrl = FileManager.default.temporaryDirectory
      .appendingPathComponent("NetworkRequestPersistenceTests-\(UUID().uuidString)")
    try FileManager.default.createDirectory(at: directoryUrl, withIntermediateDirectories: true)
    defer {
      try? FileManager.default.removeItem(at: directoryUrl)
    }
    let database = try MetricsDatabase(directoryUrl: directoryUrl)
    try body(database)
  }

  private func insertSession(id: String, into database: MetricsDatabase) throws {
    try database.insert(
      session: SessionRow(
        id: id,
        type: "main",
        startTimestamp: "2026-08-12T12:00:00Z",
        isActive: true
      )
    )
  }

  @Test
  func `drops every request while recording is disabled`() throws {
    try withTemporaryDatabase { database in
      try insertSession(id: "s", into: database)
      let persistence = NetworkRequestPersistence(
        database: database,
        configuration: NetworkSpansConfiguration(enabled: false)
      ) {
        return "s"
      }
      persistence.persist(makeRequest())
      #expect(try database.getSpans(afterId: -1).isEmpty)
    }
  }

  @Test
  func `records only requests matching the configured filter`() throws {
    try withTemporaryDatabase { database in
      try insertSession(id: "s", into: database)
      let persistence = NetworkRequestPersistence(
        database: database,
        configuration: NetworkSpansConfiguration(enabled: true, hosts: ["API.myapp.com"], methods: nil)
      ) {
        return "s"
      }
      persistence.persist(makeRequest(url: "https://api.example.com/skip"))
      persistence.persist(makeRequest(url: "https://api.myapp.com/keep"))
      let rows = try database.getSpans(afterId: -1)
      #expect(rows.count == 1)
      let attributes = try attributesDict(#require(rows.first))
      #expect(attributes["url.full"] as? String == "https://api.myapp.com/keep")
    }
  }

  @Test
  func `applies a configuration change to subsequent requests only`() throws {
    // "Applies forward": rows persisted before the change stay in the table and still dispatch.
    try withTemporaryDatabase { database in
      try insertSession(id: "s", into: database)
      let persistence = NetworkRequestPersistence(database: database) {
        return "s"
      }
      persistence.persist(makeRequest())
      persistence.setConfiguration(NetworkSpansConfiguration(enabled: false))
      persistence.persist(makeRequest())
      #expect(try database.getSpans(afterId: -1).count == 1)
    }
  }

  @Test
  func `persists a completed request as a span attributed to the provided session`() throws {
    try withTemporaryDatabase { database in
      try insertSession(id: "main-session", into: database)
      let persistence = NetworkRequestPersistence(database: database) {
        return "main-session"
      }
      persistence.persist(makeRequest())
      let rows = try database.getSpans(afterId: -1)
      #expect(rows.count == 1)
      #expect(rows.first?.sessionId == "main-session")
      #expect(rows.first?.name == "GET")
      #expect(rows.first?.kind == SpanRow.clientKind)
    }
  }

  @Test
  func `persists each request the monitor records`() throws {
    try withTemporaryDatabase { database in
      try insertSession(id: "main-session", into: database)
      let monitor = NetworkRequestMonitor()
      monitor.persistence = NetworkRequestPersistence(database: database) {
        return "main-session"
      }
      monitor.record(makeRequest(method: "GET"))
      monitor.record(makeRequest(method: "POST"))
      let rows = try database.getSpans(afterId: -1)
      #expect(rows.map(\.name) == ["GET", "POST"])
    }
  }

  @Test
  func `drops a request whose session row does not exist yet`() throws {
    // The sessions FK protects referential integrity; persistence must degrade to a dropped
    // row rather than throw into the monitor's record path.
    try withTemporaryDatabase { database in
      let persistence = NetworkRequestPersistence(database: database) {
        return "never-inserted"
      }
      persistence.persist(makeRequest())
      let rows = try database.getSpans(afterId: -1)
      #expect(rows.isEmpty)
    }
  }
}
