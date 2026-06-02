// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

/**
 A `URLProtocol` subclass that observes every HTTP(S) request handled by `URLSession`s that
 include it in their `protocolClasses`. Registered globally via `URLProtocol.registerClass` and
 also injected into `URLSessionConfiguration.default`/`.ephemeral` via swizzling (see
 `NetworkRequestConfigurationSwizzling.swift`).

 The protocol is purely observational: it forwards each request to an inner `URLSession`, replays
 every callback to the outer client unchanged, and records a `NetworkRequest` snapshot on
 completion. It does *not* modify headers, bodies, status, or order.

 ## Recursion safety

 Two prongs prevent the inner session from looping back through us:

 1. The inner `URLSession`'s configuration explicitly omits this class from `protocolClasses`.
 2. Requests that already carry `internalHeaderName: "1"` are passed through with `canInit`
    returning false, so callers (expo-observe's telemetry uploads) can opt out by setting the
    header on outgoing requests.

 ## What we don't catch

 - `URLSessionWebSocketTask` — `URLProtocol` does not apply to WebSocket upgrades.
 - Background `URLSession`s — `URLProtocol` interception is unsupported there by design.
 - HTTP/3-only requests on iOS versions that wire QUIC outside `URLProtocol`.

 These gaps are inherent to `URLProtocol` and would require a separate hook to cover.
 */
final class NetworkRequestURLProtocol: URLProtocol {
  /**
   Header name any caller can set to opt a request out of observation. Requests carrying this header
   are not handled by us (`canInit` returns false), so they bypass observation entirely and the
   header is forwarded to the server as-is. Use a header value that's safe to leak to the endpoint.

   No `X-` prefix per RFC 6648. expo-observe sets it on its telemetry uploads to avoid observing
   itself; third-party code can do the same to keep its own traffic out of the stream. Callers that
   can't import this constant (e.g. expo-observe, which must not depend on app-metrics internals)
   hardcode the same literal — keep the two in sync if this ever changes.
   */
  static let internalHeaderName = "Expo-AppMetrics-Skip"

  /**
   Registers the protocol class globally. Idempotent — `URLProtocol.registerClass` deduplicates
   internally.
   */
  static func register() {
    URLProtocol.registerClass(NetworkRequestURLProtocol.self)
  }

  private var sessionTask: URLSessionTask?
  private let observationId = UUID()
  private var startDate = Date()
  private var capturedMetrics: URLSessionTaskMetrics?
  private var capturedResponse: HTTPURLResponse?

  /**
   The `Task` that fans the `requestStarted` notification out on `AppMetricsActor`. `didComplete`
   awaits it before recording the completion so the two events can't arrive out of order: each
   `AppMetricsActor.isolated` call from a synchronous context spawns an *unstructured* task, and
   the runtime doesn't guarantee those run in submission order. Awaiting the start task chains the
   completion behind it. Written once in `startLoading` (before `task.resume()`, so it's visible
   by the time any delegate callback fires) and read once in `didComplete`.
   */
  private var startNotification: Task<Void, Error>?

  /**
   The original request's body stream, retained so we can hand a fresh copy to the inner session
   on demand. See `startLoading` for why this is necessary.
   */
  private var bodyStream: InputStream?

  // MARK: - URLProtocol

  override class func canInit(with request: URLRequest) -> Bool {
    guard let scheme = request.url?.scheme?.lowercased(), scheme == "http" || scheme == "https" else {
      return false
    }
    if request.value(forHTTPHeaderField: internalHeaderName) != nil {
      return false
    }
    // Avoid double-handling: `URLSession` consults `canInit` for every registered protocol on
    // every request, including the ones our inner session creates. The marker property below is
    // set on requests we've already wrapped.
    if URLProtocol.property(forKey: handledMarkerKey, in: request) != nil {
      return false
    }
    return true
  }

  override class func canonicalRequest(for request: URLRequest) -> URLRequest {
    return request
  }

  override func startLoading() {
    startDate = Date()

    guard let mutable = (request as NSURLRequest).mutableCopy() as? NSMutableURLRequest else {
      client?.urlProtocol(self, didFailWithError: URLError(.badURL))
      return
    }
    URLProtocol.setProperty(true, forKey: Self.handledMarkerKey, in: mutable)

    // By the time a request reaches `startLoading`, Foundation has already converted any in-memory
    // `httpBody` into an `httpBodyStream`. A plain `dataTask(with:)` ignores `httpBodyStream`, so
    // forwarding that way would silently drop POST/PUT bodies for the whole app. We instead retain
    // the stream and forward via `uploadTask(withStreamedRequest:)`, serving the stream back to the
    // inner session through the delegate's `needNewBodyStream` callback (which also lets us replay
    // it across redirects). Requests without a body fall through to a `dataTask`.
    let session = Self.sharedSessionStorage.withLock { $0 }
    let task: URLSessionTask
    if let stream = mutable.httpBodyStream {
      bodyStream = stream
      task = session.uploadTask(withStreamedRequest: mutable as URLRequest)
    } else {
      task = session.dataTask(with: mutable as URLRequest)
    }
    Self.bridge.attach(self, to: task)
    sessionTask = task

    let started = NetworkRequestStarted(
      id: observationId,
      url: mutable.url ?? URL(string: "about:blank")!,
      method: mutable.httpMethod ?? "GET",
      startedAt: startDate
    )
    startNotification = AppMetricsActor.isolated {
      NetworkRequestMonitor.shared.recordStart(started)
    }

    task.resume()
  }

  override func stopLoading() {
    sessionTask?.cancel()
    sessionTask = nil
  }

  // MARK: - Internal callbacks (driven by `BridgeDelegate`)

  fileprivate func didReceive(response: URLResponse) {
    capturedResponse = response as? HTTPURLResponse
    client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
  }

  fileprivate func didReceive(data: Data) {
    client?.urlProtocol(self, didLoad: data)
  }

  fileprivate func capture(metrics: URLSessionTaskMetrics) {
    capturedMetrics = metrics
  }

  /**
   Hands the retained request body stream to the inner session. Returns the stream once and clears
   it afterward: `InputStream`s aren't rewindable, so a redirect that needs the body re-sent can't
   be served from the same stream — the same limitation `URLSession` itself has when an app vends a
   one-shot stream. The common case (a single non-redirecting upload) is fully covered.
   */
  fileprivate func provideBodyStream() -> InputStream? {
    defer {
      bodyStream = nil
    }
    return bodyStream
  }

  fileprivate func didComplete(error: Error?) {
    let endDate = Date()
    let snapshot = NetworkRequest.from(
      id: observationId,
      request: request,
      response: capturedResponse,
      task: sessionTask,
      metrics: capturedMetrics,
      fallbackStart: startDate,
      fallbackEnd: endDate,
      error: error
    )
    let startNotification = startNotification
    AppMetricsActor.isolated {
      // Wait for the `requestStarted` fan-out to land first so subscribers never see the
      // completion before the start for the same `id`.
      _ = try? await startNotification?.value
      NetworkRequestMonitor.shared.record(snapshot)
    }

    if let error {
      client?.urlProtocol(self, didFailWithError: error)
    } else {
      client?.urlProtocolDidFinishLoading(self)
    }
  }

  fileprivate func willPerform(redirect response: HTTPURLResponse, newRequest: URLRequest) -> URLRequest? {
    // Follow the redirect inside the same task so it counts as one logical fetch from the
    // observer's perspective: one `requestStarted` when the caller fired off the request, one
    // `requestCompleted` when the final response lands. This matches what backends and OTel
    // semantic conventions expect (one span per logical HTTP operation).
    //
    // `URLSessionTaskMetrics.transactionMetrics.last` aggregates the byte counts/timings of the
    // final hop — which is what `NetworkRequest.from` already reads — so duration and bytes
    // are correct for the chain as a whole. Per-hop diagnostic detail (if we ever expose it) can
    // come from the full `transactionMetrics` array.
    //
    // Caveat for body-preserving redirects (307/308): `provideBodyStream()` vends the captured
    // request-body stream exactly once and `InputStream`s aren't rewindable, so the redirected hop
    // is sent without a body. This matches `URLSession`'s own limitation with one-shot streams and
    // is rare in practice; surfacing it would require buffering the full body up front.
    return newRequest
  }

  // MARK: - Static state

  /**
   A single shared `URLSession` is used to forward all observed requests. Its configuration
   explicitly excludes us from `protocolClasses` to break recursion, and disables its own cache
   (`urlCache = nil`, reload-ignoring policy) so caching is left entirely to the outer session the
   client created — the inner session never short-circuits a request with its own cached copy.

   Mutex-wrapped so tests can swap it in (`overrideSharedSession`) without tripping Swift 6's
   "nonisolated global shared mutable state" check.
   */
  fileprivate static let sharedSessionStorage = Mutex<URLSession>(makeForwardingSession(extraProtocols: []))

  fileprivate static let bridge = BridgeDelegate()

  /**
   Builds a `URLSession` suitable for forwarding observed requests. The session's
   `protocolClasses` exclude this class (to break recursion) and prepend any additional protocols
   the caller passes — tests use this to stitch in a fake responder so requests never escape the
   process.
   */
  static func makeForwardingSession(extraProtocols: [AnyClass]) -> URLSession {
    let configuration = URLSessionConfiguration.default
    var protocols = configuration.protocolClasses ?? []
    protocols.removeAll { $0 == NetworkRequestURLProtocol.self }
    protocols = extraProtocols + protocols
    configuration.protocolClasses = protocols
    // Disable the inner session's own cache layer. The outer session the client gave us is the
    // authoritative one (we always hand it `cacheStoragePolicy: .notAllowed`), so an independent
    // cache on the inner session would be invisible to the caller and could serve stale responses.
    configuration.urlCache = nil
    configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
    return URLSession(configuration: configuration, delegate: bridge, delegateQueue: nil)
  }

  /**
   Replaces the shared forwarding session. Tests use this to inject a session that routes through
   a fake responder. Resetting to `nil` restores the default.
   */
  static func overrideSharedSession(_ session: URLSession?) {
    sharedSessionStorage.withLock { storage in
      storage = session ?? makeForwardingSession(extraProtocols: [])
    }
  }

  private static let handledMarkerKey = "expo.appmetrics.handled"
}

/**
 `URLSession` calls back on a single delegate object, so we keep one shared delegate that routes
 each callback to the right `NetworkRequestURLProtocol` instance by looking up the `URLSessionTask`
 in a small lock-protected map.
 */
private final class BridgeDelegate: NSObject, URLSessionDataDelegate {
  /**
   Maps a forwarded `URLSessionTask` to the `NetworkRequestURLProtocol` instance that started it.

   The `URLSession` callbacks (`didReceive`, `didFinishCollecting`, `didCompleteWithError`) all
   run on the inner session's serial delegate queue, so they're already mutually serialized.
   The mutex is here for `attach`, which is called from `startLoading()` — that runs on the
   *outer* `URLSession`'s protocol-handling thread, a different queue from the inner one. Without
   synchronization, a delegate callback could `lookup` before `attach` finishes inserting and
   silently drop the observation.
   */
  private let taskToProtocol = Mutex<[Int: NetworkRequestURLProtocol]>([:])

  func attach(_ proto: NetworkRequestURLProtocol, to task: URLSessionTask) {
    taskToProtocol.withLock { map in
      map[task.taskIdentifier] = proto
    }
  }

  fileprivate func lookup(_ task: URLSessionTask) -> NetworkRequestURLProtocol? {
    return taskToProtocol.withLock { map in
      return map[task.taskIdentifier]
    }
  }

  fileprivate func detach(_ task: URLSessionTask) -> NetworkRequestURLProtocol? {
    return taskToProtocol.withLock { map in
      map.removeValue(forKey: task.taskIdentifier)
    }
  }

  // MARK: URLSessionDataDelegate

  func urlSession(
    _ session: URLSession,
    dataTask: URLSessionDataTask,
    didReceive response: URLResponse,
    completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
  ) {
    lookup(dataTask)?.didReceive(response: response)
    completionHandler(.allow)
  }

  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    lookup(dataTask)?.didReceive(data: data)
  }

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    needNewBodyStream completionHandler: @escaping (InputStream?) -> Void
  ) {
    // Called for streamed-body uploads (`uploadTask(withStreamedRequest:)`). We forward the body
    // stream we captured from the original request so POST/PUT payloads aren't dropped.
    completionHandler(lookup(task)?.provideBodyStream())
  }

  func urlSession(
    _ session: URLSession,
    task: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse,
    newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) {
    let next = lookup(task)?.willPerform(redirect: response, newRequest: request)
    completionHandler(next)
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didFinishCollecting metrics: URLSessionTaskMetrics) {
    // Fires before `didCompleteWithError`. We stash the metrics on the protocol instance and
    // assemble the snapshot from completion, where we also have the final error state.
    lookup(task)?.capture(metrics: metrics)
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    let proto = detach(task)
    proto?.didComplete(error: error)
  }
}
