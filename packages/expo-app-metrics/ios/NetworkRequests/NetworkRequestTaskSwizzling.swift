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

 2. **`-setState:`** — fires on every state transition. On `.completed` / `.canceling`, we read
    `task.error`, `task.response`, and the task's wall-clock byte counters, build a
    `NetworkRequest` snapshot, and emit `requestCompleted`.

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
 - **Dev-builds with the expo-dev-launcher network inspector active.** When that inspector is on
   (`EX_DEV_CLIENT_NETWORK_INSPECTOR` debug flag), `ExpoRequestInterceptorProtocol` installs a
   `URLProtocol` that replays every request through its own inner `URLSession`. Our swizzle still
   observes the outer (user-facing) task, but that task's `URLSessionTaskMetrics` carries only
   the final replayed response — redirect chains and per-transaction byte splits are invisible
   from the outer side. Production builds (release or dev without the inspector) get the full
   chain. Tracking a clean fix that coordinates with expo-modules-core's interceptor instead of
   reaching across packages would require a follow-up — left as a known dev-mode limitation.
 */
enum NetworkRequestTaskSwizzling {
  /**
   Header name any caller can set to opt a request out of observation. Outgoing telemetry uploads
   in expo-observe set this so they don't recursively observe themselves. The header is forwarded
   to the server as-is — pick a value that's safe to leak to the endpoint.

   No `X-` prefix per RFC 6648. Callers that can't import this constant (expo-observe must not
   depend on app-metrics internals) hardcode the same literal — keep the two in sync if this ever
   changes.
   */
  static let internalHeaderName = "Expo-AppMetrics-Skip"

  /**
   Property key that expo-dev-launcher's `ExpoRequestInterceptorProtocol` stamps on the inner
   request it creates when replaying a request through its own `URLSession` (dev mode only, gated
   on `EX_DEV_CLIENT_NETWORK_INSPECTOR`). We treat its presence as "this task is a dev-launcher
   replay, not a user-initiated fetch" and skip observation, otherwise every request in a
   dev-client build is recorded twice.

   The literal must match `REQUEST_ID` in
   `packages/expo-modules-core/ios/DevTools/ExpoRequestInterceptorProtocol.swift`. The value
   is internal to that file (no public symbol); duplicating the string is the same trick the
   expo-observe header constant uses. Keep them in sync.
   */
  private static let devLauncherRequestIdKey = "ExpoRequestInterceptorProtocol.requestId"

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

  /**
   Called from the swizzled `resume`. If the task is observable (HTTP, not a websocket, not
   opted-out, not already observed), attaches an `ObservationContext` and emits `requestStarted`.
   */
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
    // expo-dev-launcher's `ExpoRequestInterceptorProtocol` (gated by EX_DEV_CLIENT_NETWORK_INSPECTOR
    // in dev builds) intercepts a request and re-issues it through its own internal `URLSession`.
    // That inner task is also an `__NSCFLocalSessionTask` and would otherwise be observed as a
    // separate fetch, double-recording every request in the dev client. The dev-launcher stamps
    // its inner request with the property key below; we treat the presence of that property as
    // "this is a dev-launcher replay, not a user-initiated request" and skip observation.
    if URLProtocol.property(forKey: devLauncherRequestIdKey, in: request) != nil {
      return
    }
    // Idempotent: a second `resume` on the same task — including the internal re-resume that
    // follows a 30x redirect — must not double-attach observation state.
    if objc_getAssociatedObject(task, &observationContextKey) != nil {
      return
    }

    let context = ObservationContext(
      id: UUID(),
      request: request,
      startDate: Date()
    )
    objc_setAssociatedObject(task, &observationContextKey, context, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)

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
  private static let stateCanceling = URLSessionTask.State.canceling.rawValue

  private static func observeStateChange(task: URLSessionTask, newState: Int) {
    guard newState == stateCompleted || newState == stateCanceling else {
      return
    }
    guard let context = objc_getAssociatedObject(task, &observationContextKey) as? ObservationContext else {
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

  /**
   Records a completion snapshot. Called from two paths:

   - `DelegateProxy.urlSession(_:task:didFinishCollecting:)` (preferred) — fires on the session's
     delegate queue after the task is fully complete and metrics are populated. The snapshot
     carries the full `URLSessionTaskMetrics` chain.
   - The `setState:` fallback (`observeStateChange`) — fires `setStateFallbackDelay` after the
     state transition to `.completed`/`.canceling`, used only for tasks whose session doesn't
     have our delegate proxy. The snapshot has no metrics; `NetworkRequest.from(...)` falls back
     to wall-clock timings.

   The `recorded` flag makes whichever path runs first the winner; the loser short-circuits.
   */
  fileprivate static func recordCompletion(task: URLSessionTask, context: ObservationContext, error: Error?) {
    if context.recorded {
      return
    }
    context.recorded = true

    let snapshot = NetworkRequest.from(
      id: context.id,
      request: context.request,
      response: task.response as? HTTPURLResponse,
      task: task,
      metrics: context.metrics,
      fallbackStart: context.startDate,
      fallbackEnd: Date(),
      error: error
    )
    let startNotification = context.startNotification
    AppMetricsActor.isolated {
      _ = try? await startNotification?.value
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
 */
fileprivate final class ObservationContext {
  let id: UUID
  let request: URLRequest
  let startDate: Date
  /// `Task` that fans the `requestStarted` notification out on `AppMetricsActor`. The `setState:`
  /// hook awaits it before recording completion so the two events can't arrive out of order.
  var startNotification: Task<Void, Error>?
  /// Captured by `DelegateProxy.urlSession(_:task:didFinishCollecting:)` when a session delegate
  /// is present. `nil` for delegate-less sessions (including `URLSession.shared`); the snapshot
  /// builder falls back to wall-clock timings in that case.
  var metrics: URLSessionTaskMetrics?
  /// Set to `true` the first time the `setState:` swizzle records a completion snapshot. Guards
  /// against double-recording on rapid `.canceling` → `.completed` sequences.
  var recorded: Bool = false

  init(id: UUID, request: URLRequest, startDate: Date) {
    self.id = id
    self.request = request
    self.startDate = startDate
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
      context.metrics = metrics
      NetworkRequestTaskSwizzling.recordCompletion(task: task, context: context, error: task.error)
    }
    // After stashing the metrics and recording, forward to the wrapped delegate so it sees the
    // callback too.
    if let wrapped = wrapped as? URLSessionTaskDelegate {
      wrapped.urlSession?(session, task: task, didFinishCollecting: metrics)
    }
  }
}
