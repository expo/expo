internal import ExpoModulesJSI_Cxx
internal import jsi
import os

/// A Swift representation of a JavaScript Promise.
///
/// `JavaScriptPromise` bridges JavaScript promises with Swift's async/await, allowing you to create
/// deferred promises that can be resolved or rejected from Swift, or wrap existing JavaScript promises
/// to await their results. It provides type-safe access to promise resolution and rejection, integrating
/// JavaScript's asynchronous patterns with Swift's concurrency model.
public struct JavaScriptPromise: JavaScriptType, ~Copyable {
  /// Held instead of the runtime, because the promise is settled and released from any thread.
  private let scheduler: JavaScriptRuntime.Scheduler

  /// Owns the promise's JSI values (the object and, for a deferred promise, its resolve/reject
  /// functions). Registered with the runtime's ``LongLivedObjectCollection`` so they're released on
  /// the JS thread rather than against a freed runtime when a wrapper outlives its runtime (e.g. an
  /// async function's promise held by a URLSession delegate).
  ///
  /// There are two release paths, both on the JS thread while the runtime is alive:
  /// - When the ``JavaScriptPromise`` wrapper is dropped, its `deinit` schedules a job that
  ///   deregisters this state and releases the values, so a stream of promises doesn't pin their
  ///   objects (and resolution values) until teardown.
  /// - If the wrapper outlives the runtime, the teardown sweep (``allowRelease()``) releases whatever
  ///   is still registered before the runtime is destroyed.
  ///
  /// The state stays registered for as long as the wrapper is alive, even after the promise settles,
  /// so ``asValue()`` keeps returning a valid object. Settling only releases the resolve/reject
  /// functions, which can no longer be called and are the bulk of a deferred promise's held state.
  @JavaScriptActor
  private final class LongLivedState: LongLivedObject {
    let runtimeHandle: JavaScriptRuntimeHandle
    // Stored as raw `jsi::Value`s with one shared `runtimeHandle`, rather than three
    // `JavaScriptValue?` wrappers: avoids two redundant `runtimeHandle` retains/releases per promise
    // and keeps `undefined` as the empty sentinel.
    nonisolated(unsafe) var object: facebook.jsi.Value
    nonisolated(unsafe) var resolveFunction: facebook.jsi.Value
    nonisolated(unsafe) var rejectFunction: facebook.jsi.Value
    /// The Swift-side receiver `await()` suspends on, created together with the `then` callbacks that
    /// feed it on the first `await()`. Not created at construction: a promise that is only handed to
    /// JavaScript and settled from Swift never needs it, and the callbacks are two host functions plus
    /// a `then` call per promise. Its presence is what marks the callbacks as installed.
    var deferredPromise: DeferredPromise?
    /// The value the promise was fulfilled with, shared with `deferredPromise`, which keeps it for the
    /// `await()` calls. Held here too, so the teardown sweep can release it on the JavaScript thread
    /// before the runtime goes away; the actor's refs are the same references.
    var settledValue: DeferredPromise.SettledValue?
    /// The error the promise was rejected with, shared with `deferredPromise` so `allowRelease()`
    /// releases its `jsi::JSError` on the teardown sweep even if `deferredPromise` or an in-flight
    /// rejection task is still referenced off-thread.
    var settledError: DeferredPromise.SettledError?
    /// Pointer-bearing `JavaScriptValue.Ref`s queued on the JavaScript thread by
    /// `resolve(_ value: consuming JavaScriptValue)`, released on teardown if the runtime goes away
    /// before the scheduled task runs.
    var pendingResolveValue: JavaScriptValue.Ref?
    var pendingResolveOverflow: [JavaScriptValue.Ref] = []
    /// JSI-owning errors (`JavaScriptError` / `expo.CppError`) queued on the JavaScript thread by
    /// `reject(_:)`, released on teardown if the runtime goes away before the scheduled task runs.
    var pendingRejectErrors: [PendingJSIError] = []

    init(
      runtimeHandle: JavaScriptRuntimeHandle,
      object: consuming facebook.jsi.Value = .undefined(),
      resolveFunction: consuming facebook.jsi.Value = .undefined(),
      rejectFunction: consuming facebook.jsi.Value = .undefined()
    ) {
      self.runtimeHandle = runtimeHandle
      self.object = object
      self.resolveFunction = resolveFunction
      self.rejectFunction = rejectFunction
    }

    func trackPendingResolveValue(_ ref: JavaScriptValue.Ref) {
      if pendingResolveValue == nil {
        pendingResolveValue = ref
      } else {
        pendingResolveOverflow.append(ref)
      }
    }

    func untrackPendingResolveValue(_ ref: JavaScriptValue.Ref) {
      let target = Unmanaged.passUnretained(ref).toOpaque()
      if let pending = pendingResolveValue, Unmanaged.passUnretained(pending).toOpaque() == target {
        pendingResolveValue = nil
      } else if !pendingResolveOverflow.isEmpty {
        pendingResolveOverflow.removeAll { Unmanaged.passUnretained($0).toOpaque() == target }
      }
    }

    func trackPendingRejectError(_ error: PendingJSIError) {
      pendingRejectErrors.append(error)
    }

    func untrackPendingRejectError(_ error: PendingJSIError) {
      if !pendingRejectErrors.isEmpty {
        pendingRejectErrors.removeAll { $0 === error }
      }
    }

    func allowRelease() {
      object = .undefined()
      resolveFunction = .undefined()
      rejectFunction = .undefined()
      settledValue?.handOut.release()
      settledValue?.kept.release()
      settledValue = nil
      settledError?.release()
      settledError = nil
      pendingResolveValue?.release()
      pendingResolveValue = nil
      if !pendingResolveOverflow.isEmpty {
        for ref in pendingResolveOverflow {
          ref.release()
        }
        pendingResolveOverflow.removeAll()
      }
      if !pendingRejectErrors.isEmpty {
        for error in pendingRejectErrors {
          error.release()
        }
        pendingRejectErrors.removeAll()
      }
    }
  }

  private let longLivedState: LongLivedState

  /// Dropping the wrapper means no native code can settle or read this promise anymore, so release
  /// its long-lived state. The values can only be touched on the JS thread while the runtime is
  /// alive, so schedule the work there; if the runtime is already gone, the teardown sweep has
  /// released everything and there is nothing to do (this is the `#47454` off-thread-drop case).
  /// The release runs after a settle that is already scheduled, so the settle still finds the
  /// resolve and reject functions.
  deinit {
    guard scheduler.mayBeAlive else {
      return
    }
    scheduler.scheduleRelease { [longLivedState] runtime in
      runtime.longLivedObjects.remove(longLivedState)
      longLivedState.allowRelease()
    }
  }

  /// Initializes a promise from the existing object. The promise may already be settled.
  /// It cannot be resolved/rejected from the outside, i.e. `resolve` and `reject` functions are no-op.
  @JavaScriptActor
  public init(_ runtime: borrowing JavaScriptRuntime, _ object: consuming JavaScriptObject) throws {
    self.scheduler = runtime.scheduler
    // Reject a non-thenable here rather than at the first `await()`, which is where the `then`
    // callbacks are actually installed (see `deferredPromiseForAwait()`).
    let thenKey = JavaScriptPropNameID.cached(runtime, "then")
    var hasThen = false
    try throwCppErrorUnlessSucceeded(
      expo.hasFunctionProperty(runtime.pointee, object.pointee, thenKey.pointee, &hasThen)
    )
    guard hasThen else {
      throw JavaScriptObject.PropertyNotFunctionError(name: "then")
    }
    let state = LongLivedState(
      runtimeHandle: runtime.handle,
      object: expo.takeValueFromObject(&object.pointee)
    )
    self.longLivedState = state
    // Register only after validation succeeds, so a failed initializer doesn't leave the state pinned
    // in the collection until teardown. Owns the promise's JSI values from here until teardown (see
    // `LongLivedState`).
    runtime.longLivedObjects.add(state)
  }

  /// Creates a new promise whose resolver or rejecter must be called from the outside (also known as a deferred promise).
  @JavaScriptActor
  public init(_ runtime: borrowing JavaScriptRuntime) throws {
    self.scheduler = runtime.scheduler
    var promiseVal = facebook.jsi.Value.undefined()
    var resolveVal = facebook.jsi.Value.undefined()
    var rejectVal = facebook.jsi.Value.undefined()

    try runtime.createDeferredPromiseTriple(
      promiseOut: &promiseVal,
      resolveOut: &resolveVal,
      rejectOut: &rejectVal
    )
    let state = LongLivedState(
      runtimeHandle: runtime.handle,
      object: promiseVal,
      resolveFunction: resolveVal,
      rejectFunction: rejectVal
    )
    self.longLivedState = state
    // Owns the promise's JSI values from here until teardown (see `LongLivedState`).
    runtime.longLivedObjects.add(state)
  }

  @JavaScriptActor
  internal init(_ runtime: borrowing JavaScriptRuntime, _ object: consuming facebook.jsi.Object) throws {
    try self.init(runtime, JavaScriptObject(runtime, object))
  }

  public var isDeferred: Bool {
    return !longLivedState.resolveFunction.isUndefined() && !longLivedState.rejectFunction.isUndefined()
  }

  /// Waits for the promise to settle. Throws ``JavaScriptCallback/RuntimeLostError`` when the runtime
  /// is gone before it subscribes to the promise.
  ///
  /// The settlement reaches this through a promise reaction, which runs only when the host drains the
  /// microtask queue. React Native does that after each task. On a runtime created with
  /// ``JavaScriptRuntime/init()`` that nothing drains, this never returns; see
  /// ``JavaScriptRuntime/drainMicrotasks()``.
  @JavaScriptActor
  public func `await`() async throws -> JavaScriptValue {
    let deferredPromise = try await deferredPromiseForAwait()
    let (ref, isOwned) = try await deferredPromise.getValue()
    if isOwned {
      // The first read takes the value itself: a move, which doesn't touch the runtime.
      return try ref.take()
    }
    // A later read clones the kept copy. Cloning touches the runtime, so it happens on the JavaScript
    // thread and the clone is moved back.
    return try await scheduler.execute { _ in
      guard let value = ref.withUnwrappedValue({ (value: borrowing JavaScriptValue) in value.copy() }) else {
        preconditionFailure("The settled promise value was released before it was read")
      }
      return value.ref()
    }.take()
  }

  public func asValue() -> JavaScriptValue {
    // Read without consuming, so the state keeps owning the object.
    if longLivedState.object.isUndefined() {
      return .undefined()
    }
    guard let jsiRuntime = longLivedState.runtimeHandle.pointee else {
      return .undefined()
    }
    assert(
      longLivedState.runtimeHandle.runtime?.isOnOwningThread() ?? true,
      "A JavaScript promise value was copied off its runtime's JavaScript thread"
    )
    return JavaScriptValue(
      longLivedState.runtimeHandle,
      facebook.jsi.Value(jsiRuntime, longLivedState.object)
    )
  }

  /// Resolves the promise with a JavaScript value. The value is consumed and moved into a
  /// `JavaScriptRef` so the hop to the JavaScript thread can carry it; see the representable
  /// overload for the semantics.
  public func resolve(_ value: consuming JavaScriptValue) {
    guard scheduler.mayBeAlive else {
      return
    }
    let needsTracking = value.hasEngineHandle
    let isOnJSThread = scheduler.isOnJavaScriptThread()
    if isOnJSThread {
      let alreadySettled = JavaScriptActor.assumeIsolated {
        longLivedState.resolveFunction.isUndefined()
      }
      if alreadySettled {
        return
      }
    }
    let valueRef = value.ref()
    var trackedOnState = false
    var trackedOnScheduler = false
    if needsTracking {
      if isOnJSThread {
        JavaScriptActor.assumeIsolated {
          longLivedState.trackPendingResolveValue(valueRef)
        }
        trackedOnState = true
      } else {
        guard scheduler.trackPendingValue(valueRef) else {
          return
        }
        trackedOnScheduler = true
      }
    }
    let scheduler = self.scheduler
    scheduler.schedule(priority: .immediate) { [longLivedState] runtime in
      if trackedOnState {
        longLivedState.untrackPendingResolveValue(valueRef)
      } else if trackedOnScheduler {
        scheduler.untrackPendingValue(valueRef)
      }
      guard !longLivedState.resolveFunction.isUndefined() else {
        valueRef.release()
        return
      }
      let resolver = expo.takeJSIValue(&longLivedState.resolveFunction)
      let rejecter = expo.takeJSIValue(&longLivedState.rejectFunction)
      let arg = valueRef.take() ?? .undefined()
      assert(arg.belongs(to: runtime), "Cannot resolve a promise with a value belonging to a different runtime")
      invokePromiseResolver(resolver: resolver, rejecter: rejecter, argument: arg.pointee, in: runtime)
    }
  }

  /// Resolves the promise with a value that has a direct JavaScript representation.
  ///
  /// Preferred over the encodable overload for a type that is both ``JavaScriptRepresentable`` and
  /// ``JavaScriptEncodable``, so existing values (primitives, containers, JSI value wrappers) keep
  /// their established representation. For example a 64-bit integer stays a JS `number` here rather
  /// than encoding to a `bigint` or rejecting for exceeding the safe-integer range.
  /// If the resolver call throws, the promise is rejected instead.
  public func resolve<V: JavaScriptRepresentable>(_ value: V) {
    guard scheduler.mayBeAlive else {
      return
    }

    // `resolve` is not isolated, so make sure to jump to JS thread.
    scheduler.schedule(priority: .immediate) { [longLivedState] runtime in
      // If the promise is already settled, do nothing.
      guard !longLivedState.resolveFunction.isUndefined() else {
        return
      }
      let resolver = expo.takeJSIValue(&longLivedState.resolveFunction)
      let rejecter = expo.takeJSIValue(&longLivedState.rejectFunction)
      let arg = value.toJavaScriptValue(in: runtime)
      invokePromiseResolver(resolver: resolver, rejecter: rejecter, argument: arg.pointee, in: runtime)
    }
  }

  /// Resolves the promise with a ``JavaScriptEncodable`` value, encoding it on the JavaScript thread.
  ///
  /// Encoding runs where `encode` is isolated to `@JavaScriptActor` and may touch the runtime, so a
  /// caller need not hop there itself. If encoding or the resolver call throws, the promise is
  /// rejected instead.
  ///
  /// Disfavored so a type that is both ``JavaScriptRepresentable`` and ``JavaScriptEncodable`` keeps
  /// resolving through the representable overload above; this serves the encodable-only types.
  @_disfavoredOverload
  public func resolve<V: JavaScriptEncodable>(_ value: sending V) {
    guard scheduler.mayBeAlive else {
      return
    }
    // `resolve` is not isolated, so make sure to jump to JS thread; the encode happens there too.
    scheduler.schedule(priority: .immediate) { [longLivedState] runtime in
      // If the promise is already settled, do nothing.
      guard !longLivedState.resolveFunction.isUndefined() else {
        return
      }
      let resolver = expo.takeJSIValue(&longLivedState.resolveFunction)
      let rejecter = expo.takeJSIValue(&longLivedState.rejectFunction)
      do {
        let encoded = try V.encode(value, in: runtime)
        invokePromiseResolver(resolver: resolver, rejecter: rejecter, argument: encoded.pointee, in: runtime)
      } catch {
        invokePromiseRejecter(rejecter: rejecter, error: error, in: runtime)
      }
    }
  }

  public func reject(_ error: any Error) {
    guard scheduler.mayBeAlive else {
      return
    }

    if let pendingError = PendingJSIError.wrapIfNeeded(error) {
      let isOnJSThread = scheduler.isOnJavaScriptThread()
      if isOnJSThread {
        let alreadySettled = JavaScriptActor.assumeIsolated {
          longLivedState.rejectFunction.isUndefined()
        }
        if alreadySettled {
          return
        }
      }
      var trackedOnState = false
      var trackedOnScheduler = false
      if isOnJSThread {
        JavaScriptActor.assumeIsolated {
          longLivedState.trackPendingRejectError(pendingError)
        }
        trackedOnState = true
      } else {
        guard scheduler.trackPendingError(pendingError) else {
          return
        }
        trackedOnScheduler = true
      }
      let scheduler = self.scheduler
      scheduler.schedule(priority: .immediate) { [longLivedState] runtime in
        if trackedOnState {
          longLivedState.untrackPendingRejectError(pendingError)
        } else if trackedOnScheduler {
          scheduler.untrackPendingError(pendingError)
        }
        guard !longLivedState.rejectFunction.isUndefined() else {
          pendingError.release()
          return
        }
        let rejecter = expo.takeJSIValue(&longLivedState.rejectFunction)
        longLivedState.resolveFunction = .undefined()
        guard let error = pendingError.take() else {
          return
        }
        invokePromiseRejecter(rejecter: rejecter, error: error, in: runtime)
      }
      return
    }

    // `reject` is not isolated, so make sure to jump to JS thread.
    scheduler.schedule(priority: .immediate) { [longLivedState] runtime in
      guard !longLivedState.rejectFunction.isUndefined() else {
        return
      }
      let rejecter = expo.takeJSIValue(&longLivedState.rejectFunction)
      longLivedState.resolveFunction = .undefined()
      invokePromiseRejecter(rejecter: rejecter, error: error, in: runtime)
    }
  }

  /// The receiver `await()` suspends on. Created on the first call, together with the `then`
  /// callbacks that forward the promise's settlement to it; later calls return the same instance.
  /// Installing on an already settled promise is fine: `then` schedules the matching callback for it.
  @JavaScriptActor
  private func deferredPromiseForAwait() async throws -> DeferredPromise {
    if let deferredPromise = longLivedState.deferredPromise {
      return deferredPromise
    }
    // Without a runtime nothing can settle the promise, so throw instead of suspending for good. The
    // install below throws the same way when the runtime goes away before it runs.
    guard scheduler.mayBeAlive else {
      throw JavaScriptCallback.RuntimeLostError()
    }
    let deferredPromise = DeferredPromise()
    // Installing calls `then`, which is JavaScript, so it has to run on the runtime's JavaScript
    // thread, the same hop `resolve` and `reject` make. `@JavaScriptActor` does not get there on
    // its own: its executor runs jobs inline on the calling thread. `execute` runs the closure
    // inline when the caller is already on the JavaScript thread.
    try await scheduler.execute { [longLivedState, deferredPromise] runtime in
      guard !longLivedState.object.isUndefined() else {
        throw JavaScriptCallback.RuntimeLostError()
      }
      let onFulfilled = runtime.createFunction { [weak longLivedState, weak deferredPromise] this, arguments in
        guard
          let longLivedState,
          let deferredPromise,
          longLivedState.settledValue == nil,
          longLivedState.settledError == nil
        else {
          return .undefined()
        }
        // Both refs are made here, on the JavaScript thread: the copy for later `await()` calls clones
        // the value, and the refs let the task carry it off the JavaScript thread.
        let value = arguments.count > 0 ? arguments[0] : .undefined()
        let kept = value.copy().ref()
        let settled = DeferredPromise.SettledValue(handOut: value.ref(), kept: kept)
        longLivedState.settledValue = settled
        Task.immediate_polyfill {
          await deferredPromise.resolve(settled)
        }
        return .undefined()
      }
      let onRejected = runtime.createFunction { [weak longLivedState, weak deferredPromise] this, arguments in
        guard
          let longLivedState,
          let deferredPromise,
          longLivedState.settledValue == nil,
          longLivedState.settledError == nil
        else {
          return .undefined()
        }
        // Wrap the rejection value into a `JavaScriptError` here, on the JavaScript thread, rather
        // than inside the off-thread actor, since building the error touches the runtime.
        let rejectionValue = arguments.count > 0 ? arguments[0] : .undefined()
        let error = JavaScriptError(runtime, value: rejectionValue)
        let settledError = DeferredPromise.SettledError(error)
        longLivedState.settledError = settledError
        Task.immediate_polyfill {
          await deferredPromise.reject(settledError)
        }
        return .undefined()
      }
      // Parameter packs take copyable elements only, so the callbacks travel as refs.
      let onFulfilledRef = onFulfilled.ref()
      let onRejectedRef = onRejected.ref()
      let object = JavaScriptObject(runtime, longLivedState.object.getObject(runtime.pointee))
      try object.callFunction(.cached(runtime, "then"), arguments: onFulfilledRef, onRejectedRef)
      // Stored only once the callbacks are in place, so a failed install (e.g. `then` unavailable) is
      // retried by the next `await()` instead of leaving a receiver nothing will ever settle.
      longLivedState.deferredPromise = deferredPromise
    }
    return deferredPromise
  }
}

// MARK: - Single-owner promise settler

/// Single-owner settler used by `JavaScriptRuntime.createAsyncFunction` and `Task.encode`, where
/// the JS promise object is returned directly to JS (no `asValue()` clone) and no Swift caller
/// holds a `JavaScriptPromise`. Conforms to `LongLivedObject` directly and deregisters immediately
/// on settlement, avoiding a second `deinit` release hop and a separate state allocation.
///
/// Trade-off: if the host scheduler drops a queued `createAsyncFunction` task after a JS error while
/// the runtime remains alive (for example React's `clearQueues()`), this settler stays registered in
/// `longLivedObjects` until runtime teardown, where `longLivedObjects.clear()` sweeps it safely.
@JavaScriptActor
internal final class PromiseSettler: LongLivedObject, @unchecked Sendable {
  private nonisolated let scheduler: JavaScriptRuntime.Scheduler
  private nonisolated let runtimeHandle: JavaScriptRuntimeHandle
  private nonisolated(unsafe) var resolveFunction: facebook.jsi.Value = .undefined()
  private nonisolated(unsafe) var rejectFunction: facebook.jsi.Value = .undefined()

  internal init(in runtime: borrowing JavaScriptRuntime) {
    self.scheduler = runtime.scheduler
    self.runtimeHandle = runtime.handle
  }

  internal func allowRelease() {
    resolveFunction = .undefined()
    rejectFunction = .undefined()
  }

  internal func createPromise(in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    var promiseValue = facebook.jsi.Value.undefined()
    var resolveValue = facebook.jsi.Value.undefined()
    var rejectValue = facebook.jsi.Value.undefined()
    try runtime.createDeferredPromiseTriple(
      promiseOut: &promiseValue,
      resolveOut: &resolveValue,
      rejectOut: &rejectValue
    )
    resolveFunction = resolveValue
    rejectFunction = rejectValue
    return JavaScriptValue(runtimeHandle, promiseValue)
  }

  internal func register(in runtime: borrowing JavaScriptRuntime) {
    runtime.longLivedObjects.add(self)
  }

  internal func rejectSynchronously(_ error: any Error, in runtime: JavaScriptRuntime) {
    let rejecter = expo.takeJSIValue(&rejectFunction)
    resolveFunction = .undefined()
    invokePromiseRejecter(rejecter: rejecter, error: error, in: runtime)
  }

  internal nonisolated func resolve(_ value: consuming JavaScriptValue) {
    guard scheduler.mayBeAlive else {
      return
    }
    if scheduler.isOnJavaScriptThread() {
      JavaScriptActor.assumeIsolated {
        guard let runtime = runtimeHandle.runtime else {
          return
        }
        settleResolve(value, in: runtime)
      }
      return
    }
    let needsTracking = value.hasEngineHandle
    let valueRef = value.ref()
    if needsTracking && !scheduler.trackPendingValue(valueRef) {
      return
    }
    scheduler.schedule(priority: .immediate) { [self] runtime in
      if needsTracking {
        self.scheduler.untrackPendingValue(valueRef)
      }
      let taken = valueRef.take() ?? .undefined()
      self.settleResolve(taken, in: runtime)
    }
  }

  internal nonisolated func resolve<V: JavaScriptEncodable>(_ value: sending V) {
    guard scheduler.mayBeAlive else {
      return
    }
    scheduler.runOrSchedule(priority: .immediate) { [self] runtime in
      guard !self.resolveFunction.isUndefined() else {
        self.finish(in: runtime)
        return
      }
      let resolver = expo.takeJSIValue(&self.resolveFunction)
      let rejecter = expo.takeJSIValue(&self.rejectFunction)
      self.finish(in: runtime)
      do {
        let encoded = try V.encode(value, in: runtime)
        invokePromiseResolver(resolver: resolver, rejecter: rejecter, argument: encoded.pointee, in: runtime)
      } catch {
        invokePromiseRejecter(rejecter: rejecter, error: error, in: runtime)
      }
    }
  }

  internal nonisolated func reject(_ error: any Error) {
    guard scheduler.mayBeAlive else {
      return
    }
    if scheduler.isOnJavaScriptThread() {
      JavaScriptActor.assumeIsolated {
        guard let runtime = runtimeHandle.runtime else {
          return
        }
        let rejecter = expo.takeJSIValue(&rejectFunction)
        finish(in: runtime)
        invokePromiseRejecter(rejecter: rejecter, error: error, in: runtime)
      }
      return
    }
    if let pendingError = PendingJSIError.wrapIfNeeded(error) {
      guard scheduler.trackPendingError(pendingError) else {
        return
      }
      scheduler.schedule(priority: .immediate) { [self] runtime in
        self.scheduler.untrackPendingError(pendingError)
        let rejecter = expo.takeJSIValue(&self.rejectFunction)
        self.finish(in: runtime)
        guard let error = pendingError.take() else {
          return
        }
        invokePromiseRejecter(rejecter: rejecter, error: error, in: runtime)
      }
      return
    }
    scheduler.schedule(priority: .immediate) { [self] runtime in
      let rejecter = expo.takeJSIValue(&self.rejectFunction)
      self.finish(in: runtime)
      invokePromiseRejecter(rejecter: rejecter, error: error, in: runtime)
    }
  }

  private func settleResolve(_ argument: borrowing JavaScriptValue, in runtime: JavaScriptRuntime) {
    assert(argument.belongs(to: runtime), "Cannot resolve a promise with a value belonging to a different runtime")
    guard !resolveFunction.isUndefined() else {
      finish(in: runtime)
      return
    }
    let resolver = expo.takeJSIValue(&resolveFunction)
    let rejecter = expo.takeJSIValue(&rejectFunction)
    finish(in: runtime)
    invokePromiseResolver(resolver: resolver, rejecter: rejecter, argument: argument.pointee, in: runtime)
  }

  private func finish(in runtime: JavaScriptRuntime) {
    allowRelease()
    runtime.longLivedObjects.remove(self)
  }
}

/// Holds a JSI-owning error (`JavaScriptError` or `expo.CppError`) behind a lock while a promise
/// rejection is queued on the scheduler, so runtime teardown can release the underlying `jsi::JSError`
/// before the engine is destroyed.
internal final class PendingJSIError: @unchecked Sendable {
  private enum Storage {
    case jsError(JavaScriptError)
    case cppError(expo.CppError)
  }

  private let storage: OSAllocatedUnfairLock<Storage?>

  private init(_ value: Storage) {
    self.storage = OSAllocatedUnfairLock(uncheckedState: value)
  }

  static func wrapIfNeeded(_ error: any Error) -> PendingJSIError? {
    if let jsError = error as? JavaScriptError {
      return PendingJSIError(.jsError(jsError))
    }
    if let cppError = error as? expo.CppError {
      return PendingJSIError(.cppError(cppError))
    }
    return nil
  }

  func take() -> (any Error)? {
    let taken = storage.withLockUnchecked { value -> Storage? in
      defer { value = nil }
      return value
    }
    switch taken {
    case .jsError(let jsError):
      return jsError
    case .cppError(let cppError):
      return cppError
    case nil:
      return nil
    }
  }

  func release() {
    let released = storage.withLockUnchecked { value -> Storage? in
      defer { value = nil }
      return value
    }
    _ = released
  }
}

// MARK: - Shared settlement & deferred promise helpers

@JavaScriptActor
@inline(__always)
private func invokePromiseResolver(
  resolver: borrowing facebook.jsi.Value,
  rejecter: borrowing facebook.jsi.Value,
  argument: borrowing facebook.jsi.Value,
  in runtime: JavaScriptRuntime
) {
  do {
    // Call the actual resolver. If `await()` has installed the `then` callbacks, they forward
    // the settlement to `deferredPromise`.
    try throwCppErrorUnlessSucceeded(
      expo.callValueAsFunctionIgnoringResult(runtime.pointee, resolver, argument)
    )
  } catch {
    // The resolver call failed; reject with the error instead.
    invokePromiseRejecter(rejecter: rejecter, error: error, in: runtime)
  }
}

@JavaScriptActor
private func invokePromiseRejecter(
  rejecter: borrowing facebook.jsi.Value,
  error: any Error,
  in runtime: JavaScriptRuntime
) {
  guard !rejecter.isUndefined() else {
    return
  }
  // Convert the error to its JavaScript representation without eagerly reading `.stack` into a
  // `jsi::JSError`. Preserves an existing `JavaScriptError`'s wrapped value, an `expo.CppError`'s
  // original JS error, and a `JavaScriptThrowable`'s structured `code`.
  let errorValue = makeRejectionErrorValue(from: error, in: runtime)
  // The call can realistically only throw when the runtime is being torn down, where dropping
  // the settle is harmless because the JS world is going away.
  expo.callValueAsFunctionIgnoringErrors(runtime.pointee, rejecter, errorValue)
}

/// Creates a JS `Error` value directly without routing through `jsi::JSError` (which eagerly reads
/// `.message` and `.stack` back into C++ strings). Preserves an existing `JavaScriptError`'s wrapped
/// value, an `expo.CppError`'s original JS error, and a `JavaScriptThrowable`'s `code`.
@JavaScriptActor
private func makeRejectionErrorValue(from error: any Error, in runtime: JavaScriptRuntime) -> facebook.jsi.Value {
  let jsiRuntime = runtime.pointee
  if let jsError = error as? JavaScriptError {
    return jsError.toJSIValue(in: jsiRuntime)
  }
  if let cppError = error as? expo.CppError {
    return cppError.asValue(jsiRuntime)
  }
  if let throwable = error as? JavaScriptThrowable {
    var result = facebook.jsi.Value.undefined()
    let code = throwable.code
    if code.isEmpty {
      throwable.message.withJSIUTF8 { msgUtf8, msgLen in
        result = expo.createErrorValue(jsiRuntime, msgUtf8, msgLen)
      }
    } else {
      let codeKey = JavaScriptPropNameID.cached(runtime, "code")
      throwable.message.withJSIUTF8 { msgUtf8, msgLen in
        code.withJSIUTF8 { codeUtf8, codeLen in
          result = expo.createErrorValueWithCode(jsiRuntime, msgUtf8, msgLen, codeKey.pointee, codeUtf8, codeLen)
        }
      }
    }
    return result
  }
  var result = facebook.jsi.Value.undefined()
  String(describing: error).withJSIUTF8 { msgUtf8, msgLen in
    result = expo.createErrorValue(jsiRuntime, msgUtf8, msgLen)
  }
  return result
}

extension JavaScriptRuntime {
  /// Invokes `new Promise(executor)` using a cached native `HostFunction` executor that writes the
  /// engine's `resolve` and `reject` functions straight into the out-parameters.
  @JavaScriptActor
  fileprivate func createDeferredPromiseTriple(
    promiseOut: UnsafeMutablePointer<facebook.jsi.Value>,
    resolveOut: UnsafeMutablePointer<facebook.jsi.Value>,
    rejectOut: UnsafeMutablePointer<facebook.jsi.Value>
  ) throws {
    let promiseKey = JavaScriptPropNameID.cached(self, "Promise")
    let cachedExecutor =
      unretainedCachedValue(for: CacheKeys.deferredPromiseExecutor)
      ?? {
        let ref = JavaScriptRef(JavaScriptValue(self, expo.createDeferredPromiseExecutor(self.pointee)))
        cache.store(ref, for: CacheKeys.deferredPromiseExecutor)
        return Unmanaged.passUnretained(ref)
      }()
    try cachedExecutor._withUnsafeGuaranteedRef { ref in
      try ref.withUnwrappedValue { (executor: borrowing JavaScriptValue) in
        try throwCppErrorUnlessSucceeded(
          expo.createDeferredPromiseTriple(
            self.pointee,
            promiseKey.pointee,
            executor.pointee,
            promiseOut,
            resolveOut,
            rejectOut
          )
        )
      }!
    }
  }
}
