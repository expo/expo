// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import ObjectiveC
import ExpoModulesCore

/**
 Process-wide observation of every `URLSessionTask` that runs on any `URLSession` the app creates.

 ## Why method swizzling instead of `URLProtocol`

 An earlier draft of this module used a `URLProtocol` subclass plus configuration swizzling. That
 has a fundamental flaw: a `URLProtocol` only sees the `URLRequest`, not the originating
 `URLSession`. To actually run the request we replayed it through a singleton inner session,
 which silently dropped per-session state — cookies, proxy, TLS settings, `httpAdditionalHeaders`,
 cache policy — and broke the very isolation guarantees ephemeral sessions are picked for.

 The established observability SDKs (Sentry, Datadog, Bugsnag, New Relic) all converged on method
 swizzling at the `URLSessionTask` level. We do the same here.

 ## What we swizzle

 Two methods on `__NSCFLocalSessionTask`, the private concrete class that backs every public
 `URLSessionTask` on iOS 12+. The class name has been stable across iOS versions; the same
 approach is used in production by Datadog and Bugsnag.

 1. **`-resume`** — fires once per task at start time. We attach an `ObservationContext` to the
    task via `objc_setAssociatedObject` so observation state travels with it across delegate
    callbacks and threads, and emit `requestStarted`.

 2. **`-setState:`** — fires on every state transition. On `.completed` we read `task.error`,
    `task.response`, and the task's wall-clock byte counters, build a `NetworkRequest`
    snapshot, and emit `requestCompleted`.

 The `setState:` hook is the universal completion seam: it fires for tasks created with a
 completion handler (no public delegate path), tasks running on `URLSession.shared` (Apple's
 private delegate), and tasks awaited via `async`/`await`. Delegate-based completion handlers
 alone would miss all three.

 ## Per-phase metrics via delegate proxy

 `URLSessionTaskMetrics` (redirect chain, DNS/connect/TLS timestamps) is only available through
 `urlSession(_:task:didFinishCollecting:)`, which requires a session delegate. We swizzle
 `+sessionWithConfiguration:delegate:delegateQueue:` to wrap the caller's delegate in a
 `DelegateProxy` that captures metrics into the task's `ObservationContext` while forwarding
 every other selector to the caller's original delegate via Objective-C method forwarding.

 Tasks without a delegate (the shared session, completion-handler tasks) still get observed via
 the `setState:` hook — they just won't carry per-phase metric detail.

 ## Recursion safety

 expo-observe sets `Expo-AppMetrics-Skip: 1` on outgoing telemetry uploads. The `resume` swizzle
 checks for this header on `task.originalRequest` and skips attaching observation state. The
 header is forwarded to the server as-is — it lands on o.expo.dev, which we control.

 ## What we don't catch

 - **WebSocket tasks.** `URLSessionWebSocketTask` extends `URLSessionTask` so the swizzles fire,
   but websockets don't produce meaningful HTTP metrics. We skip them inside the `resume` hook.

 ## Dev-launcher interop

 When expo-dev-launcher's network inspector is active (`EX_DEV_CLIENT_NETWORK_INSPECTOR` debug
 flag), `ExpoRequestInterceptorProtocol` runs every user-facing fetch through a replay on its
 own private `URLSession`. The user-facing fetch produces two `__NSCFLocalSessionTask` instances:

 - an **outer** task on the caller's `URLSession`, which fires `resume` first but whose metrics
   are degraded (the URLProtocol short-circuits the real network).
 - an **inner** task on dev-launcher's `URLSession`, which carries the real
   `URLSessionTaskMetrics` (redirect chain, per-phase timings, byte splits).

 We pair them up by request URL: the outer's `resume` creates an `ObservationContext` and adds
 it to `pendingReplays`; the inner's `resume` (microseconds later) claims it via
 `takePendingReplay`, attaches the same context to the inner task, and flags the outer's
 setState/metrics paths to short-circuit. Recording happens once, from the inner task's
 `didFinishCollectingMetrics:` callback, carrying the inner task's real metrics and the outer's
 `requestStarted` event id. See `pendingReplays` for the data structure.
 */
enum NetworkRequestTaskSwizzling {
  /**
   Header name any caller can set to opt a request out of observation. Outgoing telemetry uploads
   in expo-observe set this so they don't recursively observe themselves.

   The header is forwarded to the destination verbatim — once a `URLSessionTask` is created we
   can't safely mutate `originalRequest`, so we read it but don't strip it. The intended use is
   on requests to endpoints we control (o.expo.dev); setting it on a request to a third party
   leaks `Expo-AppMetrics-Skip: 1` to that host.

   No `X-` prefix per RFC 6648. Callers that can't import this constant (expo-observe must not
   depend on app-metrics internals) hardcode the same literal — keep the two in sync if this
   ever changes.
   */
  static let internalHeaderName = "Expo-AppMetrics-Skip"

  /**
   Property key that expo-dev-launcher's `ExpoRequestInterceptorProtocol` stamps on the inner
   request it creates when replaying a request through its own `URLSession` (dev mode only, gated
   on `EX_DEV_CLIENT_NETWORK_INSPECTOR`).

   When the dev-launcher inspector is active, every user-facing fetch produces two tasks:
   - an **outer** task created against the user's `URLSession`, with no property — fires `resume`
     first but the network never goes through it (the URLProtocol intercepts).
   - an **inner** task on dev-launcher's private `URLSession`, carrying this property — does the
     actual network work and carries the real `URLSessionTaskMetrics` (redirects, per-phase
     timings, byte splits).

   We want one observation per logical fetch, with the inner task's metrics. The resume swizzle
   moves the outer's `ObservationContext` to the inner via `pendingReplays` (URL-keyed) so the
   inner records into the same id the user-facing `requestStarted` event used. The outer task's
   setState/metrics callbacks then short-circuit on `context.replayedByDevLauncher`.

   The literal must match `REQUEST_ID` in
   `packages/expo-modules-core/ios/DevTools/ExpoRequestInterceptorProtocol.swift`. The value
   is internal to that file (no public symbol); duplicating the string is the same trick the
   expo-observe header constant uses. Keep them in sync.
   */
  fileprivate static let devLauncherRequestIdKey = "ExpoRequestInterceptorProtocol.requestId"

  /// Installs the swizzles. Idempotent — guarded by `installed` so repeat calls are no-ops.
  static func install() {
    state.withLock { installed in
      if installed {
        return
      }
      installed = true

      installResumeSwizzle()
      installSetStateSwizzle()
      installSessionInitSwizzle()
    }
  }

  // MARK: - State

  private static let state = Mutex<Bool>(false)

  /// Marker key used by `objc_setAssociatedObject` to attach an `ObservationContext` to a task.
  /// The value is never read - only the pointer's identity matters - so the "mutable global"
  /// concurrency warning is a false positive. `nonisolated(unsafe)` opts out of the check.
  /// File-scope so the `DelegateProxy` in this file can reach it through `&observationContextKey`.
  nonisolated(unsafe) fileprivate static var observationContextKey: UInt8 = 0

  /// Captured pointers to the original IMPs of the methods we swizzled, so the replacement blocks
  /// can call through to Apple's implementation. `Mutex` because the blocks fire on whatever
  /// thread `URLSessionTask` is operating on.
  private static let originalResumeImp = Mutex<IMP?>(nil)
  private static let originalSetStateImp = Mutex<IMP?>(nil)
  private static let originalSessionInitImp = Mutex<IMP?>(nil)

  /**
   How long the `setState:` fallback waits before recording. Tasks observed via the delegate
   proxy record from `didFinishCollectingMetrics:` first (with metrics) and flip `recorded=true`;
   the fallback that fires after this delay sees the flag and skips. Delegate-less sessions
   (`URLSession.shared`, completion-handler tasks) never get a metrics callback, so the fallback
   wins and records without metrics — degraded but better than nothing.

   200ms is comfortably above the observed inter-callback latency on real devices (typically a
   few ms). The cost is a small latency before the `requestCompleted` event fires for delegate-
   less traffic; acceptable for a passive observer.
   */
  private static let setStateFallbackDelay: TimeInterval = 0.2

  /// Outer-task `ObservationContext`s waiting for the corresponding dev-launcher inner replay
  /// task to fire `resume`. Keyed by request URL because that's the only identifier shared
  /// across the outer/inner pair (the inner request is a mutable copy of the outer and carries
  /// a different `ExpoRequestInterceptorProtocol.requestId` that isn't visible from the outer
  /// task's `originalRequest`).
  ///
  /// FIFO list per URL handles concurrent fetches to the same URL: the inner task that fires
  /// first picks up the oldest entry. Entries are removed when claimed; any entry whose
  /// `expiresAt` has passed (request denied by another URLProtocol, dev-launcher disabled
  /// mid-flight, etc.) is pruned on the next access so the dictionary doesn't grow unbounded.
  private static let pendingReplays = Mutex<[URL: [(context: ObservationContext, expiresAt: Date)]]>([:])

  /// Maximum time we'll keep an unclaimed outer context in `pendingReplays`. Outer/inner
  /// `resume` calls are typically microseconds apart; 5 seconds is well above the worst case
  /// while still keeping the dictionary bounded.
  private static let pendingReplayTimeout: TimeInterval = 5

  // MARK: - resume() swizzle

  private static func installResumeSwizzle() {
    guard let taskClass = NSClassFromString("__NSCFLocalSessionTask") else {
      return
    }
    let selector = #selector(URLSessionTask.resume)
    guard let method = class_getInstanceMethod(taskClass, selector) else {
      return
    }
    let block: @convention(block) (URLSessionTask) -> Void = { task in
      observeStart(task)
      if let imp = originalResumeImp.withLock({ $0 }) {
        let fn = unsafeBitCast(imp, to: (@convention(c) (AnyObject, Selector) -> Void).self)
        fn(task, selector)
      }
    }
    let newImp = imp_implementationWithBlock(block as Any)
    let original = method_setImplementation(method, newImp)
    originalResumeImp.withLock { $0 = original }
  }

  /// Called from the swizzled `resume`. Handles three cases:
  ///
  /// 1. **Dev-launcher inner replay task** (carries `devLauncherRequestIdKey` on its request):
  ///    we already created an `ObservationContext` for the outer task. Pull it out of
  ///    `pendingReplays` by URL, attach it to the inner task, and flag the original as
  ///    `replayedByDevLauncher` so the outer's setState/metrics callbacks short-circuit. No new
  ///    `requestStarted` is emitted — the outer already did that.
  ///
  /// 2. **Outer task under dev-launcher** (no property, but dev-launcher's protocol is
  ///    installed): create the context, emit `requestStarted`, attach to the outer task as
  ///    usual — and also add to `pendingReplays` so the inner replay task can pick it up when
  ///    it `resume`s.
  ///
  /// 3. **Regular task** (no property, no dev-launcher): create context, attach, emit started.
  ///
  /// Plus the early-exit cases: websockets, internal opt-out header, non-HTTP schemes, and the
  /// idempotency check against double-attaching on a re-resumed task.
  private static func observeStart(_ task: URLSessionTask) {
    if task is URLSessionWebSocketTask {
      return
    }
    // `originalRequest` is the request as the caller submitted it. `URLProtocol`-style
    // observers see `currentRequest` post-redirect; we deliberately log the caller's intent.
    guard let request = task.originalRequest else {
      return
    }
    guard let scheme = request.url?.scheme?.lowercased(), scheme == "http" || scheme == "https" else {
      return
    }
    if request.value(forHTTPHeaderField: internalHeaderName) != nil {
      return
    }
    // Idempotent: a second `resume` on the same task — including the internal re-resume that
    // follows a 30x redirect — must not double-attach observation state.
    if objc_getAssociatedObject(task, &observationContextKey) != nil {
      return
    }

    // Dev-launcher inner replay task. Adopt the outer's context (so the snapshot keeps the same
    // id as the user-facing `requestStarted` event) and let the inner drive recording from its
    // `didFinishCollectingMetrics:` callback. The outer task's setState/metrics paths
    // short-circuit on `context.replayedByDevLauncher`.
    if URLProtocol.property(forKey: devLauncherRequestIdKey, in: request) != nil {
      guard let url = request.url, let outerContext = takePendingReplay(for: url) else {
        // No matching outer context (request opted out, fired before our swizzles installed,
        // etc.). Don't observe — recording independently would still double-count.
        return
      }
      outerContext.replayedByDevLauncher = true
      objc_setAssociatedObject(task, &observationContextKey, outerContext, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
      return
    }

    let context = ObservationContext(
      id: UUID(),
      request: request,
      startDate: Date(),
      outerUrl: request.url
    )
    objc_setAssociatedObject(task, &observationContextKey, context, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)

    // Always make the context discoverable by URL — if dev-launcher's interceptor protocol is
    // in play, the inner replay task will claim it on its own `resume`. If not, the entry is
    // removed when this request terminates (see `recordCompletion` → `removePendingReplay`).
    // We considered gating this on a lazy `URLSessionConfiguration.default.protocolClasses`
    // lookup but the lazy resolves on the first request, which may fire before dev-launcher
    // registers its protocol — locking in the wrong answer for the lifetime of the process.
    if let url = context.outerUrl {
      addPendingReplay(context: context, for: url)
    }

    let started = NetworkRequestStarted(
      id: context.id,
      url: request.url ?? URL(string: "about:blank")!,
      method: request.httpMethod ?? "GET",
      startedAt: context.startDate
    )
    context.startNotification = AppMetricsActor.isolated {
      NetworkRequestMonitor.shared.recordStart(started)
    }
  }

  /// Adds an outer-task context to `pendingReplays` so the matching dev-launcher inner replay
  /// task can pick it up. Prunes expired entries on the same URL key while we hold the lock.
  private static func addPendingReplay(context: ObservationContext, for url: URL) {
    let now = Date()
    let expiresAt = now.addingTimeInterval(pendingReplayTimeout)
    pendingReplays.withLock { pending in
      var queue = pending[url] ?? []
      queue.removeAll { $0.expiresAt < now }
      queue.append((context, expiresAt))
      pending[url] = queue
    }
  }

  /// Removes and returns the oldest non-expired outer context for `url`, or `nil` if none.
  /// Called from the inner replay task's `observeStart` to adopt the outer's context.
  private static func takePendingReplay(for url: URL) -> ObservationContext? {
    let now = Date()
    return pendingReplays.withLock { pending in
      guard var queue = pending[url] else {
        return nil
      }
      queue.removeAll { $0.expiresAt < now }
      guard !queue.isEmpty else {
        pending[url] = nil
        return nil
      }
      let head = queue.removeFirst()
      pending[url] = queue.isEmpty ? nil : queue
      return head.context
    }
  }

  /// Removes `context` from `pendingReplays[url]` if it's still there. Called from
  /// `recordCompletion` so production traffic (no dev-launcher inspector, no inner task ever
  /// claims the entry) doesn't accumulate one parked `ObservationContext` per observed
  /// request. No-op when the entry was already consumed by a `takePendingReplay`.
  private static func removePendingReplay(context: ObservationContext, for url: URL) {
    pendingReplays.withLock { pending in
      guard var queue = pending[url] else {
        return
      }
      queue.removeAll { $0.context === context }
      pending[url] = queue.isEmpty ? nil : queue
    }
  }

  // MARK: - setState: swizzle (fallback recording for delegate-less sessions)

  /**
   `__NSCFLocalSessionTask.setState:` fires on every state transition for every task in the
   process. We use it as a fallback recorder for tasks whose session doesn't have our
   `DelegateProxy` installed: `URLSession.shared`, sessions created via paths that bypassed our
   session-init swizzle, and async/await consumers that go through Apple's internal delegate.

   For delegate-based sessions the `DelegateProxy.urlSession(_:task:didFinishCollecting:)`
   callback records first (with metrics) and flips `context.recorded`. This fallback fires later
   and short-circuits on the flag. For delegate-less sessions metrics never arrive, the fallback
   wins after `setStateFallbackDelay`, and the snapshot lands without per-phase metrics — same
   degraded shape as a cache hit or an error before headers.
   */
  private static func installSetStateSwizzle() {
    guard let taskClass = NSClassFromString("__NSCFLocalSessionTask") else {
      return
    }
    let selector = NSSelectorFromString("setState:")
    guard let method = class_getInstanceMethod(taskClass, selector) else {
      return
    }
    // `URLSessionTask.State` is bridged to NSInteger. Apple uses 0=running, 1=suspended,
    // 2=canceling, 3=completed.
    let block: @convention(block) (URLSessionTask, Int) -> Void = { task, newState in
      // Run the original first so URLSession's state machine progresses normally; our recording
      // is deferred anyway so order here doesn't matter for correctness.
      if let imp = originalSetStateImp.withLock({ $0 }) {
        let fn = unsafeBitCast(
          imp,
          to: (@convention(c) (AnyObject, Selector, Int) -> Void).self
        )
        fn(task, selector, newState)
      }
      observeStateChange(task: task, newState: newState)
    }
    let newImp = imp_implementationWithBlock(block as Any)
    let original = method_setImplementation(method, newImp)
    originalSetStateImp.withLock { $0 = original }
  }

  private static let stateCompleted = URLSessionTask.State.completed.rawValue

  private static func observeStateChange(task: URLSessionTask, newState: Int) {
    // Only observe `.completed` — at `.canceling` time `task.error` is still `nil` (the
    // `NSURLErrorCancelled` lands on `.completed`), so capturing the error here would race the
    // metrics callback and snapshot a cancelled request as if it succeeded. Every task reaches
    // `.completed` regardless, so this is strictly safer and carries the real error.
    guard newState == stateCompleted else {
      return
    }
    guard let context = objc_getAssociatedObject(task, &observationContextKey) as? ObservationContext else {
      return
    }
    // Outer task under dev-launcher: the inner replay task will record from
    // `didFinishCollectingMetrics:` with the real metrics chain. Skip the outer's fallback so we
    // don't race the inner's recording. The inner task's setState fallback still runs (it has
    // its own task identity); recordCompletion's `context.recorded` flag dedupes the two paths.
    let isInnerReplayTask = task.originalRequest.flatMap {
      URLProtocol.property(forKey: devLauncherRequestIdKey, in: $0)
    } != nil
    if context.replayedByDevLauncher && !isInnerReplayTask {
      return
    }
    // Defer to let the delegate proxy's `didFinishCollectingMetrics:` win when present. The
    // captured task and error are owned by the closure; if the task is deallocated before the
    // closure fires, `task` would dangle — except `ObservationContext` is retained via the
    // associated-object slot for the lifetime of the task, and the closure captures the task by
    // strong reference. Both live until the closure runs.
    let capturedError = task.error
    DispatchQueue.global(qos: .utility).asyncAfter(deadline: .now() + setStateFallbackDelay) {
      recordCompletion(task: task, context: context, error: capturedError)
    }
  }

  /// Records a completion snapshot. Called from two paths:
  ///
  /// - `DelegateProxy.urlSession(_:task:didFinishCollecting:)` (preferred) — fires on the
  ///   session's delegate queue after the task is fully complete and metrics are populated.
  ///   The snapshot carries the full `URLSessionTaskMetrics` chain.
  /// - The `setState:` fallback (`observeStateChange`) — fires `setStateFallbackDelay` after
  ///   the state transition to `.completed`, used only for tasks whose session doesn't have
  ///   our delegate proxy. The snapshot has no metrics; `NetworkRequest.from(...)` falls back
  ///   to wall-clock timings.
  ///
  /// The check-set on `context.recorded` happens on `AppMetricsActor` to serialize the two
  /// paths — without the actor hop, the metrics callback (on the session's delegate queue) and
  /// the setState fallback (on a global queue) race on a plain `var Bool` and can both pass
  /// the check, double-recording the request. The actor also serializes `pendingReplays`
  /// cleanup so a context can't be claimed by an inner task while we're removing it.
  fileprivate static func recordCompletion(task: URLSessionTask, context: ObservationContext, error: Error?) {
    // Snapshot all task state on the calling thread — `URLSessionTask` isn't `Sendable`, so we
    // can't reach `task.response` / `task.countOfBytes*` after the actor hop.
    let response = task.response as? HTTPURLResponse
    let bytesSent = task.countOfBytesSent
    let bytesReceived = task.countOfBytesReceived
    let metrics = context.metrics
    let outerUrl = context.outerUrl

    AppMetricsActor.isolated {
      if context.recorded {
        return
      }
      context.recorded = true
      // Drain the pending-replay entry now that this request is terminal — `pendingReplays`
      // would otherwise leak one context per request when dev-launcher is off (no inner task
      // ever claims them). Safe to call when no entry exists.
      if let outerUrl {
        removePendingReplay(context: context, for: outerUrl)
      }

      let snapshot = NetworkRequest.from(
        id: context.id,
        request: context.request,
        response: response,
        taskBytesSent: bytesSent,
        taskBytesReceived: bytesReceived,
        metrics: metrics,
        fallbackStart: context.startDate,
        fallbackEnd: Date(),
        error: error
      )
      _ = try? await context.startNotification?.value
      NetworkRequestMonitor.shared.record(snapshot)
    }
  }

  // MARK: - Session initializer swizzle (for URLSessionTaskMetrics)

  /**
   Swizzles `+[URLSession sessionWithConfiguration:delegate:delegateQueue:]` so we can wrap the
   caller's delegate in a `DelegateProxy`. The proxy captures `didFinishCollecting` metrics into
   the task's `ObservationContext` while forwarding every other selector to the original.

   Sessions created without a delegate (and `URLSession.shared`) skip this path entirely — they
   still get observed by `resume`/`setState:`, just without per-phase metrics.
   */
  private static func installSessionInitSwizzle() {
    let target: AnyClass = URLSession.self
    let selector = NSSelectorFromString("sessionWithConfiguration:delegate:delegateQueue:")
    guard let method = class_getClassMethod(target, selector) else {
      return
    }
    let block: @convention(block) (
      AnyObject,
      URLSessionConfiguration,
      URLSessionDelegate?,
      OperationQueue?
    ) -> URLSession? = { cls, config, delegate, queue in
      // Wrap whatever the caller passed (including nil) so we always see the metrics callback.
      // Apple's docs say a nil delegate puts the session in "completion handler" mode; in that
      // mode the metrics callback never fires anyway, but wrapping nil is still safe — the
      // proxy responds only to the two selectors it handles.
      let wrapped = DelegateProxy(wrapping: delegate)
      guard let imp = originalSessionInitImp.withLock({ $0 }) else {
        return nil
      }
      // The delegate slot in the IMP signature is `AnyObject?` rather than `URLSessionDelegate?`
      // because `DelegateProxy` deliberately doesn't declare Swift `URLSessionDelegate` conformance
      // (see the class doc for why). At the Obj-C ABI level the slot is `id<NSURLSessionDelegate>?`,
      // which accepts any `NSObject` — `URLSession` only checks selector responses at runtime.
      let fn = unsafeBitCast(
        imp,
        to: (@convention(c) (AnyObject, Selector, URLSessionConfiguration, AnyObject?, OperationQueue?) -> URLSession?).self
      )
      return fn(cls, selector, config, wrapped, queue)
    }
    let newImp = imp_implementationWithBlock(block as Any)
    let original = method_setImplementation(method, newImp)
    originalSessionInitImp.withLock { $0 = original }
  }
}

// MARK: - ObservationContext

/**
 Per-task observation state. Stored on the task via `objc_setAssociatedObject` so it travels with
 the task across delegate callbacks, redirects, and threads without us maintaining a separate
 task→state map. Released automatically when the task or our slot is cleared.

 `@unchecked Sendable` because we cross isolation boundaries by passing the context to
 `AppMetricsActor` from `recordCompletion`. The mutable fields (`recorded`, `metrics`,
 `replayedByDevLauncher`, `startNotification`) are written from at most two places each, and
 the writes that matter for correctness — flipping `recorded`, updating the pending-replays
 dictionary, building the snapshot — all run on `AppMetricsActor`. The early
 `replayedByDevLauncher = true` write in `observeStart` happens on the resume thread before
 any actor work picks the context up, so there's no read-write race in practice.
 */
fileprivate final class ObservationContext: @unchecked Sendable {
  let id: UUID
  let request: URLRequest
  let startDate: Date
  /// URL used as the `pendingReplays` key when this context was first enqueued, or `nil` if the
  /// outer request had no URL (shouldn't happen for HTTP tasks but defended against). Kept
  /// explicit so `recordCompletion` can drain the matching `pendingReplays` entry without
  /// guessing — covers the production case where dev-launcher's inspector is off and no inner
  /// task ever consumes the entry. Without this cleanup the dictionary would accumulate one
  /// `ObservationContext` per observed request forever.
  let outerUrl: URL?
  /// `Task` that fans the `requestStarted` notification out on `AppMetricsActor`. The `setState:`
  /// hook awaits it before recording completion so the two events can't arrive out of order.
  var startNotification: Task<Void, Error>?
  /// Captured by `DelegateProxy.urlSession(_:task:didFinishCollecting:)` when a session delegate
  /// is present. `nil` for delegate-less sessions (including `URLSession.shared`); the snapshot
  /// builder falls back to wall-clock timings in that case.
  var metrics: URLSessionTaskMetrics?
  /// Set to `true` once `recordCompletion` has emitted the snapshot for this context. Guards
  /// against double-recording when both the metrics callback (on the session's delegate queue)
  /// and the `setState:` fallback (on a global queue) reach `recordCompletion` for the same
  /// task. The check-and-set runs on `AppMetricsActor` to serialize the two paths.
  var recorded: Bool = false
  /// `true` once this context has been claimed by a dev-launcher inner replay task. The outer
  /// task's setState fallback and metrics callback short-circuit when this flips — the inner
  /// task will record the snapshot from `didFinishCollectingMetrics:` with the real metrics
  /// chain.
  var replayedByDevLauncher: Bool = false

  init(id: UUID, request: URLRequest, startDate: Date, outerUrl: URL?) {
    self.id = id
    self.request = request
    self.startDate = startDate
    self.outerUrl = outerUrl
  }
}

// MARK: - DelegateProxy

/**
 `NSObject` subclass that captures `didFinishCollectingMetrics` for our observation context while
 transparently forwarding every other selector to the caller's original delegate.

 **Why we don't declare `URLSessionTaskDelegate` conformance in Swift.** `URLSession` introspects
 its delegate via `conformsToProtocol:(URLSessionDataDelegate)`, `conformsToProtocol:(URLSessionDownloadDelegate)`,
 etc., to decide which optional callbacks it should emit. If we conformed to `URLSessionTaskDelegate`
 in Swift, the Obj-C runtime would advertise that conformance for the proxy unconditionally — even
 when the wrapped delegate is actually a `URLSessionDataDelegate`. That could change which callbacks
 fire and break the caller. We instead reflect the wrapped delegate's `responds(to:)` results, plus
 `true` for the metrics selector we intercept. This is the same pattern Bugsnag's
 `BSGURLSessionPerformanceProxy` uses.

 The metrics callback is implemented as an `@objc` method so the Obj-C runtime can dispatch it via
 `responds(to:)` without us declaring formal protocol conformance.
 */
private final class DelegateProxy: NSObject {
  fileprivate let wrapped: URLSessionDelegate?

  init(wrapping wrapped: URLSessionDelegate?) {
    self.wrapped = wrapped
    super.init()
  }

  private static let metricsSelector = NSSelectorFromString("URLSession:task:didFinishCollectingMetrics:")

  override func responds(to aSelector: Selector!) -> Bool {
    if aSelector == Self.metricsSelector {
      return true
    }
    return wrapped?.responds(to: aSelector) ?? false
  }

  override func forwardingTarget(for aSelector: Selector!) -> Any? {
    if aSelector == Self.metricsSelector {
      return nil
    }
    if let wrapped, wrapped.responds(to: aSelector) {
      return wrapped
    }
    return nil
  }

  /**
   Canonical recording site. `didFinishCollectingMetrics:` is Apple's "task is fully done" signal
   — by the time it fires, the last byte has been transferred and `task.error` / `task.response`
   are stable. We capture metrics, record the snapshot, then forward to the wrapped delegate.

   The explicit `@objc` selector matches Apple's mangling exactly. Without it Swift would emit
   `urlSession:task:didFinishCollecting:` (the argument-label form), but `URLSession` dispatches
   `URLSession:task:didFinishCollectingMetrics:`. We can't inherit the right name from a protocol
   because we deliberately don't conform to `URLSessionTaskDelegate` in Swift (see class comment).

   This mirrors Bugsnag's `BSGURLSessionPerformanceDelegate` approach. Sentry takes a different
   path (record from `setState:` without metrics) and explicitly trades away redirect-chain
   detail; we keep the chain by recording here.
   */
  @objc(URLSession:task:didFinishCollectingMetrics:)
  func urlSession(_ session: URLSession, task: URLSessionTask, didFinishCollecting metrics: URLSessionTaskMetrics) {
    if let context = objc_getAssociatedObject(task, &NetworkRequestTaskSwizzling.observationContextKey) as? ObservationContext {
      // The outer task under dev-launcher gets a degraded metrics callback (the URLProtocol
      // short-circuits the real network). The inner replay task's callback is where the real
      // chain lands. Skip the outer's metrics callback when its context was claimed by an inner
      // task; the inner's own callback will record. The two tasks are told apart by the
      // property dev-launcher stamps on the inner's request.
      let isInnerReplayTask = task.originalRequest.flatMap {
        URLProtocol.property(forKey: NetworkRequestTaskSwizzling.devLauncherRequestIdKey, in: $0)
      } != nil
      let skipDueToReplay = context.replayedByDevLauncher && !isInnerReplayTask
      if !skipDueToReplay {
        context.metrics = metrics
        NetworkRequestTaskSwizzling.recordCompletion(task: task, context: context, error: task.error)
      }
    }
    // After stashing the metrics and recording, forward to the wrapped delegate so it sees the
    // callback too.
    if let wrapped = wrapped as? URLSessionTaskDelegate {
      wrapped.urlSession?(session, task: task, didFinishCollecting: metrics)
    }
  }
}
