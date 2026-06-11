import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("NetworkRequest")
struct NetworkRequestTests {
  @Test
  func `falls back to wall-clock duration when metrics are nil`() {
    let request = URLRequest(url: URL(string: "https://expo.dev/health")!)
    let response = HTTPURLResponse(
      url: request.url!,
      statusCode: 204,
      httpVersion: "HTTP/1.1",
      headerFields: nil
    )!
    let start = Date(timeIntervalSinceReferenceDate: 1000)
    let end = Date(timeIntervalSinceReferenceDate: 1000.42)

    let snapshot = NetworkRequest.from(
      id: UUID(),
      request: request,
      response: response,
      taskBytesSent: nil,
      taskBytesReceived: nil,
      metrics: nil,
      fallbackStart: start,
      fallbackEnd: end,
      error: nil
    )

    #expect(snapshot.statusCode == 204)
    #expect(snapshot.method == "GET")
    #expect(snapshot.networkProtocol == nil)
    #expect(snapshot.requestBytesSent == nil)
    #expect(snapshot.responseBytesReceived == nil)
    // `Date(timeIntervalSinceReferenceDate:)` math is base-2 floating point; allow a single-ulp
    // tolerance so e.g. 0.4199999999999591 doesn't flake.
    #expect(abs(snapshot.timings.totalDuration - 0.42) < 0.0001)
    #expect(snapshot.timings.fetchStart == start)
    #expect(snapshot.timings.responseEnd == end)
    #expect(snapshot.errorDescription == nil)
  }

  @Test
  func `captures method override and error description`() {
    var request = URLRequest(url: URL(string: "https://expo.dev/api")!)
    request.httpMethod = "POST"
    let error = NSError(domain: NSURLErrorDomain, code: NSURLErrorTimedOut, userInfo: nil)
    let now = Date()

    let snapshot = NetworkRequest.from(
      id: UUID(),
      request: request,
      response: nil,
      taskBytesSent: nil,
      taskBytesReceived: nil,
      metrics: nil,
      fallbackStart: now,
      fallbackEnd: now,
      error: error
    )

    #expect(snapshot.method == "POST")
    #expect(snapshot.statusCode == nil)
    #expect(snapshot.errorDescription != nil)
  }
}

@AppMetricsActor
@Suite("NetworkRequestMonitor")
struct NetworkRequestMonitorTests {
  @Test
  func `records snapshots and fans out to delegates`() {
    let monitor = NetworkRequestMonitor()
    let collector = CollectingDelegate()
    monitor.addDelegate(collector)

    let snapshot = NetworkRequest.from(
      id: UUID(),
      request: URLRequest(url: URL(string: "https://expo.dev/x")!),
      response: HTTPURLResponse(url: URL(string: "https://expo.dev/x")!, statusCode: 200, httpVersion: nil, headerFields: nil),
      taskBytesSent: nil,
      taskBytesReceived: nil,
      metrics: nil,
      fallbackStart: Date(),
      fallbackEnd: Date(),
      error: nil
    )
    monitor.record(snapshot)

    #expect(monitor.recent.count == 1)
    #expect(monitor.recent.first?.id == snapshot.id)
    #expect(collector.received.count == 1)
  }

  @Test
  func `recordStart fans out to delegates without touching the ring buffer`() {
    let monitor = NetworkRequestMonitor()
    let collector = CollectingDelegate()
    monitor.addDelegate(collector)

    let started = NetworkRequestStarted(
      id: UUID(),
      url: URL(string: "https://expo.dev/x")!,
      method: "GET",
      startedAt: Date()
    )
    monitor.recordStart(started)

    #expect(collector.receivedStarts.count == 1)
    #expect(collector.receivedStarts.first?.id == started.id)
    // The ring buffer holds completed snapshots only.
    #expect(monitor.recent.isEmpty)
  }

  @Test
  func `bounds the ring buffer`() {
    let monitor = NetworkRequestMonitor()
    let url = URL(string: "https://expo.dev/x")!
    for _ in 0..<250 {
      let snapshot = NetworkRequest.from(
        id: UUID(),
        request: URLRequest(url: url),
        response: nil,
        taskBytesSent: nil,
        taskBytesReceived: nil,
        metrics: nil,
        fallbackStart: Date(),
        fallbackEnd: Date(),
        error: nil
      )
      monitor.record(snapshot)
    }
    #expect(monitor.recent.count == 200)
  }

  @Test
  func `does not fan out events the delegate filters out`() {
    let monitor = NetworkRequestMonitor()
    let collector = FilteringDelegate(allowedHost: "api.expo.dev")
    monitor.addDelegate(collector)

    monitor.recordStart(makeStarted(url: "https://api.expo.dev/v2/sessions", method: "POST"))
    monitor.recordStart(makeStarted(url: "https://cdn.example.com/asset.png", method: "GET"))
    monitor.record(makeRequest(url: "https://api.expo.dev/v2/sessions"))
    monitor.record(makeRequest(url: "https://cdn.example.com/asset.png"))

    // Only the matching host reaches the delegate, on both the start and the completion path.
    #expect(collector.receivedStarts.count == 1)
    #expect(collector.receivedStarts.first?.url.host == "api.expo.dev")
    #expect(collector.received.count == 1)
    #expect(collector.received.first?.url.host == "api.expo.dev")
  }

  private func makeStarted(url: String, method: String) -> NetworkRequestStarted {
    return NetworkRequestStarted(id: UUID(), url: URL(string: url)!, method: method, startedAt: Date())
  }

  private func makeRequest(url: String) -> NetworkRequest {
    return NetworkRequest.from(
      id: UUID(),
      request: URLRequest(url: URL(string: url)!),
      response: nil,
      taskBytesSent: nil,
      taskBytesReceived: nil,
      metrics: nil,
      fallbackStart: Date(),
      fallbackEnd: Date(),
      error: nil
    )
  }
}

@Suite("NetworkRequestFilter")
struct NetworkRequestFilterTests {
  @Test
  func `a filter with no fields set matches every request`() {
    let filter = NetworkRequestFilter()
    #expect(filter.matches(url: URL(string: "https://anything.example.com/path")!, method: "GET"))
    #expect(filter.matches(url: URL(string: "https://other.test/x")!, method: "DELETE"))
  }

  @Test
  func `an empty array allows nothing through that dimension`() {
    var emptyHosts = NetworkRequestFilter()
    emptyHosts.hosts = []
    #expect(!emptyHosts.matches(url: URL(string: "https://api.expo.dev/x")!, method: "GET"))

    var emptyMethods = NetworkRequestFilter()
    emptyMethods.methods = []
    #expect(!emptyMethods.matches(url: URL(string: "https://api.expo.dev/x")!, method: "GET"))
  }

  @Test
  func `hosts match exactly and case-insensitively`() {
    var filter = NetworkRequestFilter()
    filter.hosts = ["API.Expo.dev"]
    #expect(filter.matches(url: URL(string: "https://api.expo.dev/v2")!, method: "GET"))
    // Exact host only — subdomains and unrelated hosts are excluded.
    #expect(!filter.matches(url: URL(string: "https://cdn.expo.dev/v2")!, method: "GET"))
    #expect(!filter.matches(url: URL(string: "https://example.com/v2")!, method: "GET"))
  }

  @Test
  func `hosts is an OR across the listed entries`() {
    var filter = NetworkRequestFilter()
    filter.hosts = ["api.expo.dev", "u.expo.dev"]
    #expect(filter.matches(url: URL(string: "https://api.expo.dev/x")!, method: "GET"))
    #expect(filter.matches(url: URL(string: "https://u.expo.dev/x")!, method: "GET"))
    #expect(!filter.matches(url: URL(string: "https://cdn.expo.dev/x")!, method: "GET"))
  }

  @Test
  func `methods match case-insensitively`() {
    var filter = NetworkRequestFilter()
    filter.methods = ["post", "PUT"]
    #expect(filter.matches(url: URL(string: "https://expo.dev/x")!, method: "POST"))
    #expect(filter.matches(url: URL(string: "https://expo.dev/x")!, method: "put"))
    #expect(!filter.matches(url: URL(string: "https://expo.dev/x")!, method: "GET"))
  }

  @Test
  func `fields combine with AND`() {
    var filter = NetworkRequestFilter()
    filter.hosts = ["api.expo.dev"]
    filter.methods = ["POST"]
    // Both the host and the method must match.
    #expect(filter.matches(url: URL(string: "https://api.expo.dev/x")!, method: "POST"))
    #expect(!filter.matches(url: URL(string: "https://api.expo.dev/x")!, method: "GET"))
    #expect(!filter.matches(url: URL(string: "https://cdn.expo.dev/x")!, method: "POST"))
  }
}

@AppMetricsActor
@Suite("NetworkRequestObserver filtering")
struct NetworkRequestObserverFilterTests {
  @Test
  func `shouldObserveRequest reflects the active filter`() {
    // The suite is `@AppMetricsActor`-isolated, so the actor-isolated `filter` is set and read
    // here synchronously — exercising `shouldObserveRequest`'s logic without racing the `Task` hop that the
    // public `setFilter`/`init` use to reach the actor.
    let observer = NetworkRequestObserver()

    var post = NetworkRequestFilter()
    post.methods = ["POST"]
    observer.filter = post
    #expect(observer.shouldObserveRequest(url: URL(string: "https://expo.dev/x")!, method: "POST"))
    #expect(!observer.shouldObserveRequest(url: URL(string: "https://expo.dev/x")!, method: "GET"))

    var get = NetworkRequestFilter()
    get.methods = ["GET"]
    observer.filter = get
    #expect(observer.shouldObserveRequest(url: URL(string: "https://expo.dev/x")!, method: "GET"))
    #expect(!observer.shouldObserveRequest(url: URL(string: "https://expo.dev/x")!, method: "POST"))

    // No filter falls back to observing everything.
    observer.filter = nil
    #expect(observer.shouldObserveRequest(url: URL(string: "https://expo.dev/x")!, method: "POST"))
  }
}

@Suite("NetworkRequestSummary")
struct NetworkRequestSummaryTests {
  @Test
  func `empty when no requests are passed in`() {
    let summary = NetworkRequestSummary.from([])
    #expect(summary.isEmpty)
    #expect(summary.count == 0)
    #expect(summary.slowestHost == nil)
  }

  @Test
  func `aggregates count, failures, bytes, durations and slowest`() {
    let now = Date()
    let fast = makeRequest(
      host: "api.expo.dev",
      duration: 0.1,
      status: 200,
      bytesSent: 100,
      bytesReceived: 200,
      fetchStart: now
    )
    let slow = makeRequest(
      host: "cdn.expo.dev",
      duration: 0.8,
      status: 200,
      bytesSent: 50,
      bytesReceived: 9000,
      fetchStart: now
    )
    let failed = makeRequest(
      host: "broken.expo.dev",
      duration: 0.3,
      status: 503,
      bytesSent: 30,
      bytesReceived: 40,
      fetchStart: now
    )

    let summary = NetworkRequestSummary.from([fast, slow, failed])
    #expect(summary.count == 3)
    #expect(summary.failed == 1)
    #expect(summary.bytesSent == 180)
    #expect(summary.bytesReceived == 9240)
    #expect(abs(summary.totalDuration - 1.2) < 0.0001)
    #expect(summary.slowestDuration == 0.8)
    #expect(summary.slowestHost == "cdn.expo.dev")
  }

  @Test
  func `counts errored requests without a status as failed`() {
    let request = makeRequest(
      host: "expo.dev",
      duration: 0.2,
      status: nil,
      bytesSent: 0,
      bytesReceived: 0,
      fetchStart: Date(),
      error: "timed out"
    )
    let summary = NetworkRequestSummary.from([request])
    #expect(summary.failed == 1)
  }

  @Test
  func `treats 304 and other 3xx as non-failed`() {
    // 304 is a successful conditional-GET cache hit; 301/302 are redirections URLSession
    // typically follows but if one surfaces here it's still a successful response from the
    // origin's perspective. Only 4xx/5xx (and explicit errors) belong in the failed count.
    let cacheHit = makeRequest(host: "expo.dev", duration: 0.05, status: 304, bytesSent: 0, bytesReceived: 0, fetchStart: Date())
    let redirect = makeRequest(host: "expo.dev", duration: 0.1, status: 301, bytesSent: 0, bytesReceived: 0, fetchStart: Date())
    let clientError = makeRequest(host: "expo.dev", duration: 0.1, status: 404, bytesSent: 0, bytesReceived: 0, fetchStart: Date())
    let serverError = makeRequest(host: "expo.dev", duration: 0.1, status: 500, bytesSent: 0, bytesReceived: 0, fetchStart: Date())

    let summary = NetworkRequestSummary.from([cacheHit, redirect, clientError, serverError])
    #expect(summary.count == 4)
    #expect(summary.failed == 2)
  }

  private func makeRequest(
    host: String,
    duration: TimeInterval,
    status: Int?,
    bytesSent: Int64,
    bytesReceived: Int64,
    fetchStart: Date,
    error: String? = nil
  ) -> NetworkRequest {
    return NetworkRequest(
      id: UUID(),
      url: URL(string: "https://\(host)/x")!,
      method: "GET",
      statusCode: status,
      networkProtocol: nil,
      requestBytesSent: bytesSent,
      responseBytesReceived: bytesReceived,
      timings: NetworkRequest.Timings(
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
        responseEnd: nil,
        totalDuration: duration
      ),
      errorDescription: error,
      redirects: []
    )
  }
}

@AppMetricsActor
@Suite("NetworkRequestMonitor windowing")
struct NetworkRequestMonitorWindowingTests {
  @Test
  func `filters by fetchStart inclusive on both ends`() {
    let monitor = NetworkRequestMonitor()
    let early = makeSnapshot(fetchStart: Date(timeIntervalSinceReferenceDate: 0))
    let inside = makeSnapshot(fetchStart: Date(timeIntervalSinceReferenceDate: 50))
    let late = makeSnapshot(fetchStart: Date(timeIntervalSinceReferenceDate: 100))
    monitor.record(early)
    monitor.record(inside)
    monitor.record(late)

    let summary = monitor.summarize(
      start: Date(timeIntervalSinceReferenceDate: 10),
      end: Date(timeIntervalSinceReferenceDate: 90)
    )
    #expect(summary.count == 1)
  }

  private func makeSnapshot(fetchStart: Date) -> NetworkRequest {
    return NetworkRequest(
      id: UUID(),
      url: URL(string: "https://expo.dev/x")!,
      method: "GET",
      statusCode: 200,
      networkProtocol: nil,
      requestBytesSent: 0,
      responseBytesReceived: 0,
      timings: NetworkRequest.Timings(
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
        responseEnd: nil,
        totalDuration: 0.1
      ),
      errorDescription: nil,
      redirects: []
    )
  }
}

/**
 End-to-end tests for `NetworkRequestTaskSwizzling`. We register a `FakeServerProtocol` inside the
 test's URLSession so requests never escape the process; the swizzles still fire on the real
 `__NSCFLocalSessionTask` Apple creates to drive the URLProtocol, so we observe the full lifecycle
 just as we would in production.

 Serialized because every test installs the same process-wide swizzles and shares the monitor's
 ring buffer — concurrent runs would observe each other's traffic and the assertions filter by URL
 to keep tests independent.
 */
@Suite("NetworkRequestTaskSwizzling", .serialized)
struct NetworkRequestTaskSwizzlingTests {
  init() {
    NetworkRequestTaskSwizzling.install()
  }

  @Test
  func `observes a request that completes via the fake server`() async throws {
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [FakeServerProtocol.self]
    let session = URLSession(configuration: config)

    let collector = CollectingDelegate()
    try await AppMetricsActor.isolated {
      NetworkRequestMonitor.shared.addDelegate(collector)
    }.value

    let url = URL(string: "https://fake.test/hello")!
    let (data, response) = try await session.data(from: url)

    #expect((response as? HTTPURLResponse)?.statusCode == 200)
    #expect(String(data: data, encoding: .utf8) == "hi")

    let recorded = await waitForRecorded(matching: url)
    #expect(recorded != nil)
    #expect(recorded?.statusCode == 200)

    let startEvent = collector.receivedStarts.first { $0.url == url }
    #expect(startEvent != nil)
    #expect(startEvent?.method == "GET")
    #expect(startEvent?.id == recorded?.id)
  }

  @Test
  func `skips requests that carry the internal opt-out header`() async throws {
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [FakeServerProtocol.self]
    let session = URLSession(configuration: config)

    var request = URLRequest(url: URL(string: "https://fake.test/internal")!)
    request.setValue("1", forHTTPHeaderField: NetworkRequestTaskSwizzling.internalHeaderName)
    _ = try await session.data(for: request)

    // Sleep briefly to let any stray recording attempt complete.
    try await Task.sleep(nanoseconds: 50_000_000)
    let recorded = try await AppMetricsActor.isolated {
      return NetworkRequestMonitor.shared.recent.first(where: { $0.url.path == "/internal" })
    }.value
    #expect(recorded == nil)
  }

  /**
   With task-resume swizzling the caller's session is never replaced — POST bodies reach the
   server through the URL loading system's normal path. The fake echoes whatever it receives; a
   matching echo proves the body wasn't dropped.
   */
  @Test
  func `preserves request bodies for uploads`() async throws {
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [FakeServerProtocol.self]
    let session = URLSession(configuration: config)

    let payload = Data("{\"hello\":\"world\"}".utf8)
    var request = URLRequest(url: URL(string: "https://fake.test/echo")!)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = payload

    let (data, response) = try await session.data(for: request)

    #expect((response as? HTTPURLResponse)?.statusCode == 200)
    #expect(data == payload)
  }

  /**
   With the swizzle approach the caller's `URLSession` configuration is preserved verbatim — no
   inner session, no replay. Ephemeral sessions used to leak cookies into `HTTPCookieStorage.shared`
   under the old URLProtocol-replay implementation; this test pins that the leak is gone.
   `FakeServerProtocol` returns a `Set-Cookie` header for `/cookie-test`, so the assertion would
   fail loudly if cookies started flowing into the shared jar again.
   */
  @Test
  func `does not leak cookies from an ephemeral session into the shared storage`() async throws {
    // Wipe any cookie a previous test or stray network state might have planted on `fake.test`.
    if let stale = HTTPCookieStorage.shared.cookies(for: URL(string: "https://fake.test/")!) {
      for cookie in stale {
        HTTPCookieStorage.shared.deleteCookie(cookie)
      }
    }

    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [FakeServerProtocol.self]
    let session = URLSession(configuration: config)

    let url = URL(string: "https://fake.test/cookie-test")!
    _ = try await session.data(from: url)

    let sharedAfter = HTTPCookieStorage.shared.cookies(for: URL(string: "https://fake.test/")!) ?? []
    // The ephemeral session's cookie storage is in-memory and isolated; the global shared storage
    // must not gain any cookies from a request issued on it.
    #expect(sharedAfter.isEmpty)
  }

  /**
   `URLSessionWebSocketTask` extends `URLSessionTask` so the swizzle's `resume` fires on it, but
   websockets don't produce useful HTTP metrics and we deliberately skip them. We resume a
   websocket task pointed at a URL that will never connect, then cancel it; the swizzle must not
   have recorded a snapshot.
   */
  @Test
  func `skips websocket tasks`() async throws {
    let config = URLSessionConfiguration.ephemeral
    let session = URLSession(configuration: config)
    let url = URL(string: "wss://fake.invalid.test/never-connects")!
    let task = session.webSocketTask(with: url)
    task.resume()
    task.cancel()

    try await Task.sleep(nanoseconds: 50_000_000)
    let recorded = try await AppMetricsActor.isolated {
      return NetworkRequestMonitor.shared.recent.first(where: { $0.url == url })
    }.value
    #expect(recorded == nil)
  }

  /**
   Requests marked with `ExpoRequestInterceptorProtocol.requestId` are dev-launcher inner replays —
   the swizzle must skip them so we don't double-record every request in dev-client builds. Drive
   the check through `URLProtocol.setProperty(_:forKey:in:)` directly; we don't need the
   dev-launcher itself to repro the condition.
   */
  @Test
  func `skips dev-launcher inner replay tasks`() async throws {
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [FakeServerProtocol.self]
    let session = URLSession(configuration: config)

    let url = URL(string: "https://fake.test/dev-launcher-replay")!
    let mutable = (URLRequest(url: url) as NSURLRequest).mutableCopy() as! NSMutableURLRequest
    URLProtocol.setProperty("test-request-id", forKey: "ExpoRequestInterceptorProtocol.requestId", in: mutable)
    _ = try await session.data(for: mutable as URLRequest)

    try await Task.sleep(nanoseconds: 50_000_000)
    let recorded = try await AppMetricsActor.isolated {
      return NetworkRequestMonitor.shared.recent.first(where: { $0.url == url })
    }.value
    #expect(recorded == nil)
  }

  /**
   Sessions created without a delegate (and the global `URLSession.shared`-style completion-handler
   path) skip our `DelegateProxy`, so `didFinishCollectingMetrics:` never fires. The `setState:`
   fallback has to win after `setStateFallbackDelay` and still record the snapshot — degraded (no
   per-phase metrics) but present.
   */
  @Test
  func `records delegate-less sessions via the setState fallback`() async throws {
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [FakeServerProtocol.self]
    // Explicitly pass `nil` delegate so our session-init swizzle doesn't get to wrap a real one.
    // `URLSession(configuration:delegate:delegateQueue:)` with a nil delegate matches the
    // completion-handler-only mode in Apple's docs.
    let session = URLSession(configuration: config, delegate: nil, delegateQueue: nil)

    let url = URL(string: "https://fake.test/delegate-less")!
    let result: (Data, URLResponse?) = try await withCheckedThrowingContinuation { continuation in
      let task = session.dataTask(with: url) { data, response, error in
        if let error {
          continuation.resume(throwing: error)
          return
        }
        continuation.resume(returning: (data ?? Data(), response))
      }
      task.resume()
    }
    #expect((result.1 as? HTTPURLResponse)?.statusCode == 200)
    #expect(String(data: result.0, encoding: .utf8) == "hi")

    let recorded = await waitForRecorded(matching: url)
    #expect(recorded != nil)
    #expect(recorded?.statusCode == 200)
  }

  private func waitForRecorded(matching url: URL, attempts: Int = 50) async -> NetworkRequest? {
    for _ in 0..<attempts {
      let found = try? await AppMetricsActor.isolated {
        return NetworkRequestMonitor.shared.recent.first(where: { $0.url == url })
      }.value
      if let found {
        return found
      }
      try? await Task.sleep(nanoseconds: 20_000_000)
    }
    return nil
  }
}

/**
 The JS-facing observer mostly forwards to `NetworkRequestMonitor`, which is exercised by the
 `NetworkRequestMonitor` suite. What's specific to the observer is the payload shape — the dict
 it hands to `emit()` is the wire format JS consumers see. These tests pin that shape down so
 renames (`fromUrl` → `from`, `responseEnd` → `endedAt`, etc.) require a deliberate change.
 */
@Suite("NetworkRequestObserver")
struct NetworkRequestObserverTests {
  @Test
  func `startedPayload contains the started-event keys`() {
    let id = UUID()
    let startedAt = Date(timeIntervalSinceReferenceDate: 1000)
    let request = NetworkRequestStarted(
      id: id,
      url: URL(string: "https://expo.dev/start")!,
      method: "POST",
      startedAt: startedAt
    )

    let payload = NetworkRequestObserver.startedPayload(for: request)

    #expect(payload["id"] as? String == id.uuidString)
    #expect(payload["url"] as? String == "https://expo.dev/start")
    #expect(payload["method"] as? String == "POST")
    #expect(payload["startedAt"] as? String == startedAt.ISO8601Format())
    // Only the four documented keys — anything extra means the JS contract grew unintentionally.
    #expect(Set(payload.keys) == ["id", "url", "method", "startedAt"])
  }

  @Test
  func `completedPayload normalizes timings and redirects`() {
    let id = UUID()
    let fetchStart = Date(timeIntervalSinceReferenceDate: 2000)
    let responseEnd = Date(timeIntervalSinceReferenceDate: 2000.5)
    let request = NetworkRequest(
      id: id,
      url: URL(string: "https://expo.dev/end")!,
      method: "GET",
      statusCode: 200,
      networkProtocol: "h2",
      requestBytesSent: 123,
      responseBytesReceived: 4567,
      timings: NetworkRequest.Timings(
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
        totalDuration: 0.5
      ),
      errorDescription: nil,
      redirects: [
        NetworkRequest.Redirect(
          fromUrl: URL(string: "https://expo.dev/a")!,
          toUrl: URL(string: "https://expo.dev/b")!,
          statusCode: 301
        )
      ]
    )

    let payload = NetworkRequestObserver.completedPayload(for: request)

    #expect(payload["id"] as? String == id.uuidString)
    #expect(payload["url"] as? String == "https://expo.dev/end")
    #expect(payload["method"] as? String == "GET")
    #expect(payload["statusCode"] as? Int == 200)
    #expect(payload["networkProtocol"] as? String == "h2")
    #expect(payload["requestBytesSent"] as? Int64 == 123)
    #expect(payload["responseBytesReceived"] as? Int64 == 4567)
    #expect(payload["startedAt"] as? String == fetchStart.ISO8601Format())
    #expect(payload["completedAt"] as? String == responseEnd.ISO8601Format())
    #expect(payload["totalDuration"] as? TimeInterval == 0.5)

    let redirects = payload["redirects"] as? [[String: Any?]]
    #expect(redirects?.count == 1)
    #expect(redirects?.first?["fromUrl"] as? String == "https://expo.dev/a")
    #expect(redirects?.first?["toUrl"] as? String == "https://expo.dev/b")
    #expect(redirects?.first?["statusCode"] as? Int == 301)
  }

  @Test
  func `completedPayload preserves nulls and empty redirects`() {
    // Failed request before the response arrived: status, protocol, byte counts and end timestamps
    // are all nil. The dict keys must still be present so JS code can read them without crashing.
    let id = UUID()
    let fetchStart = Date(timeIntervalSinceReferenceDate: 3000)
    let request = NetworkRequest(
      id: id,
      url: URL(string: "https://expo.dev/error")!,
      method: "GET",
      statusCode: nil,
      networkProtocol: nil,
      requestBytesSent: nil,
      responseBytesReceived: nil,
      timings: NetworkRequest.Timings(
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
        responseEnd: nil,
        totalDuration: 0.1
      ),
      errorDescription: "timed out",
      redirects: []
    )

    let payload = NetworkRequestObserver.completedPayload(for: request)

    // `payload[key]` returns `Optional<Any?>` because the dict's value type is `Any?`. A missing
    // key is the outer `.none`; a present-but-nil key is `.some(.none)`. The JS contract says
    // every key is present, so assert on the outer `.some` and the inner nil separately.
    #expect(payload.keys.contains("statusCode"))
    #expect((payload["statusCode"] ?? "missing") as? Int == nil)
    #expect(payload.keys.contains("networkProtocol"))
    #expect((payload["networkProtocol"] ?? "missing") as? String == nil)
    #expect(payload.keys.contains("requestBytesSent"))
    #expect(payload.keys.contains("completedAt"))
    #expect((payload["completedAt"] ?? "missing") as? String == nil)
    #expect(payload["errorDescription"] as? String == "timed out")

    // `redirects` is always present as an empty array, never `nil` — JS callers `.map` over it
    // without a null-guard.
    let redirects = payload["redirects"] as? [[String: Any?]]
    #expect(redirects != nil)
    #expect(redirects?.isEmpty == true)
  }
}

// MARK: - Test helpers

private final class CollectingDelegate: NetworkRequestObserverDelegate, @unchecked Sendable {
  private let lock = NSLock()
  private var completed: [NetworkRequest] = []
  private var started: [NetworkRequestStarted] = []

  var received: [NetworkRequest] {
    lock.lock()
    defer {
      lock.unlock()
    }
    return completed
  }

  var receivedStarts: [NetworkRequestStarted] {
    lock.lock()
    defer {
      lock.unlock()
    }
    return started
  }

  func onNetworkRequestStarted(_ request: NetworkRequestStarted) {
    lock.lock()
    defer {
      lock.unlock()
    }
    started.append(request)
  }

  func onNetworkRequestCompleted(_ request: NetworkRequest) {
    lock.lock()
    defer {
      lock.unlock()
    }
    completed.append(request)
  }
}

/** Collecting delegate that only accepts requests for a single host, exercising the monitor's
 per-delegate `shouldObserveRequest` consult at the fan-out site. */
private final class FilteringDelegate: NetworkRequestObserverDelegate, @unchecked Sendable {
  private let allowedHost: String
  private let lock = NSLock()
  private var completed: [NetworkRequest] = []
  private var started: [NetworkRequestStarted] = []

  init(allowedHost: String) {
    self.allowedHost = allowedHost
  }

  var received: [NetworkRequest] {
    lock.lock()
    defer {
      lock.unlock()
    }
    return completed
  }

  var receivedStarts: [NetworkRequestStarted] {
    lock.lock()
    defer {
      lock.unlock()
    }
    return started
  }

  func shouldObserveRequest(url: URL, method: String) -> Bool {
    return url.host == allowedHost
  }

  func onNetworkRequestStarted(_ request: NetworkRequestStarted) {
    lock.lock()
    defer {
      lock.unlock()
    }
    started.append(request)
  }

  func onNetworkRequestCompleted(_ request: NetworkRequest) {
    lock.lock()
    defer {
      lock.unlock()
    }
    completed.append(request)
  }
}

/**
 A trivial `URLProtocol` that pretends to be a server. Routes by URL path:
 - `/cookie-test` returns a `Set-Cookie` header so the cookie-isolation test can detect a leak.
 - any other path echoes the request body back when there is one (POST/PUT payload assertions) and
   otherwise returns a `hi` body.

 Sits at the tail of the protocol chain in the test's outer session.
 */
private final class FakeServerProtocol: URLProtocol {
  override class func canInit(with request: URLRequest) -> Bool {
    return request.url?.host == "fake.test"
  }

  override class func canonicalRequest(for request: URLRequest) -> URLRequest {
    return request
  }

  override func startLoading() {
    let url = request.url!
    let headers: [String: String]? = url.path == "/cookie-test"
      ? ["Set-Cookie": "fake=value; Path=/"]
      : nil
    let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!
    client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
    let body = Self.readBody(from: request) ?? Data("hi".utf8)
    client?.urlProtocol(self, didLoad: body)
    client?.urlProtocolDidFinishLoading(self)
  }

  override func stopLoading() {}

  /**
   Reads the request body, preferring the in-memory `httpBody` and falling back to draining
   `httpBodyStream` — by the time a request reaches a `URLProtocol`, Foundation has usually
   converted the body to a stream, which is exactly the path we want to exercise.
   */
  private static func readBody(from request: URLRequest) -> Data? {
    if let body = request.httpBody {
      return body
    }
    guard let stream = request.httpBodyStream else {
      return nil
    }
    stream.open()
    defer {
      stream.close()
    }
    var data = Data()
    let bufferSize = 1024
    var buffer = [UInt8](repeating: 0, count: bufferSize)
    while stream.hasBytesAvailable {
      let read = stream.read(&buffer, maxLength: bufferSize)
      if read <= 0 {
        break
      }
      data.append(buffer, count: read)
    }
    return data.isEmpty ? nil : data
  }
}
