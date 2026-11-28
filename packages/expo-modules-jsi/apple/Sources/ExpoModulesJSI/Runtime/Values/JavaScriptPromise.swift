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
  private typealias PromiseContinuation = CheckedContinuation<JavaScriptValue.Ref, any Error>

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
    // Stored as values, not as `JavaScriptObject` and `JavaScriptFunction`: the deferred promise's
    // triple hands out values, and converting each one when the promise is created would clone it in
    // the engine. Only the function that actually gets called is converted, when it is called. Stored
    // inline rather than in `JavaScriptValue.Ref`s, which would cost an allocation each per promise.
    nonisolated(unsafe) var object: JavaScriptValue?
    nonisolated(unsafe) var resolveFunction: JavaScriptValue?
    nonisolated(unsafe) var rejectFunction: JavaScriptValue?
    /// The value the promise was fulfilled with, shared with `deferredPromise`, which keeps it for the
    /// `await()` calls. Held here too, so the teardown sweep can release it on the JavaScript thread
    /// before the runtime goes away; the actor's refs are the same references.
    var settledValue: DeferredPromise.SettledValue?

    // Cross-thread state guarded by `stateLock` (shared on `JavaScriptRuntime.Scheduler` so creating
    // a promise allocates no per-promise lock).
    private let stateLock: OSAllocatedUnfairLock<Void>
    /// The Swift-side receiver `await()` suspends on, created together with the `then` callbacks that
    /// feed it on the first `await()`. Not created at construction: a promise that is only handed to
    /// JavaScript and settled from Swift never needs it, and the callbacks are two host functions plus
    /// a `then` call per promise. Its presence is what marks the callbacks as installed.
    nonisolated(unsafe) private var _deferredPromise: DeferredPromise?
    /// Single-slot fast path for a value queued by `resolve(_ value: consuming JavaScriptValue)` on an
    /// async scheduler, avoiding an array allocation on the normal single-resolve path.
    nonisolated(unsafe) private var _pendingResolveValue: JavaScriptValue.Ref?
    nonisolated(unsafe) private var _overflowPendingResolveValues: [JavaScriptValue.Ref]?
    nonisolated(unsafe) private var _isDeferred: Bool
    nonisolated(unsafe) private var _isReleased = false

    nonisolated init(lock: OSAllocatedUnfairLock<Void>, isDeferred: Bool) {
      self.stateLock = lock
      self._isDeferred = isDeferred
    }

    nonisolated var deferredPromise: DeferredPromise? {
      return stateLock.withLock { _deferredPromise }
    }

    nonisolated var isDeferred: Bool {
      return stateLock.withLock { _isDeferred }
    }

    nonisolated func markSettled() {
      stateLock.withLock { _isDeferred = false }
    }

    /// Stores `deferredPromise` if the state has not been released yet. Returns `true` when the
    /// state was already released so the caller can reject the receiver immediately.
    nonisolated func storeDeferredPromise(_ deferredPromise: DeferredPromise) -> Bool {
      return stateLock.withLock {
        if _isReleased {
          return true
        }
        _deferredPromise = deferredPromise
        return false
      }
    }

    nonisolated func trackPendingResolveValue(_ ref: JavaScriptValue.Ref) -> Bool {
      return stateLock.withLock {
        guard !_isReleased else {
          return false
        }
        if _pendingResolveValue == nil {
          _pendingResolveValue = ref
        } else if _overflowPendingResolveValues != nil {
          _overflowPendingResolveValues!.append(ref)
        } else {
          _overflowPendingResolveValues = [ref]
        }
        return true
      }
    }

    nonisolated func untrackPendingResolveValue(_ ref: JavaScriptValue.Ref) {
      let target = UInt(bitPattern: Unmanaged.passUnretained(ref).toOpaque())
      stateLock.withLock {
        if let pending = _pendingResolveValue,
          UInt(bitPattern: Unmanaged.passUnretained(pending).toOpaque()) == target
        {
          _pendingResolveValue = nil
          return
        }
        _overflowPendingResolveValues?.removeAll {
          UInt(bitPattern: Unmanaged.passUnretained($0).toOpaque()) == target
        }
      }
    }

    func allowRelease() {
      object = nil
      resolveFunction = nil
      rejectFunction = nil
      settledValue?.handOut.release()
      settledValue?.kept.release()
      settledValue = nil
      let (deferredPromise, pendingValue, overflowValues):
        (
          DeferredPromise?, JavaScriptValue.Ref?, [JavaScriptValue.Ref]?
        ) = stateLock.withLock {
          _isReleased = true
          _isDeferred = false
          let deferred = _deferredPromise
          _deferredPromise = nil
          let pending = _pendingResolveValue
          _pendingResolveValue = nil
          let overflow = _overflowPendingResolveValues
          _overflowPendingResolveValues = nil
          return (deferred, pending, overflow)
        }
      pendingValue?.release()
      if let overflowValues {
        for ref in overflowValues {
          ref.release()
        }
      }
      deferredPromise?.releaseOnTeardown()
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
    self.longLivedState = LongLivedState(lock: runtime.scheduler.promiseStateLock, isDeferred: false)
    // Reject a non-thenable here rather than at the first `await()`, which is where the `then`
    // callbacks are actually installed (see `deferredPromiseForAwait()`).
    _ = try object.getPropertyAsFunction(.cached(runtime, "then"))
    longLivedState.object = object.asValue()
    // Register only after validation succeeds, so a failed initializer doesn't leave the state pinned
    // in the collection until teardown. Owns the promise's JSI values from here until teardown (see
    // `LongLivedState`).
    runtime.longLivedObjects.add(longLivedState)
  }

  /// Creates a new promise whose resolver or rejecter must be called from the outside (also known as a deferred promise).
  @JavaScriptActor
  public init(_ runtime: borrowing JavaScriptRuntime) throws {
    self.scheduler = runtime.scheduler
    self.longLivedState = LongLivedState(lock: runtime.scheduler.promiseStateLock, isDeferred: true)

    // The promise and its two settle functions come from a JavaScript closure that returns all three
    // at once, rather than from `new Promise(executor)` with a host function as the executor. The
    // host function route costs a native function and a Swift context object per promise, a re-entry
    // from the engine into Swift while the constructor runs, and an owning copy of each settle
    // function on the way back. The closure route is one JS call and three array reads.
    let triple = try runtime.createDeferredPromiseTriple()
    longLivedState.object = try triple.getValue(at: 0)
    longLivedState.resolveFunction = try triple.getValue(at: 1)
    longLivedState.rejectFunction = try triple.getValue(at: 2)
    // Owns the promise's JSI values from here until teardown (see `LongLivedState`).
    runtime.longLivedObjects.add(longLivedState)
  }

  @JavaScriptActor
  internal init(_ runtime: borrowing JavaScriptRuntime, _ object: consuming facebook.jsi.Object) throws {
    try self.init(runtime, JavaScriptObject(runtime, object))
  }

  public var isDeferred: Bool {
    return longLivedState.isDeferred
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
      if let value: JavaScriptValue = ref.take() {
        return value
      }
      throw JavaScriptCallback.RuntimeLostError()
    }
    // A later read clones the kept copy. Cloning touches the runtime, so it happens on the JavaScript
    // thread and the clone is moved back.
    return try await scheduler.execute { _ in
      guard let value = ref.withUnwrappedValue({ (value: borrowing JavaScriptValue) in value.copy() }) else {
        throw JavaScriptCallback.RuntimeLostError()
      }
      return value.ref()
    }.take()
  }

  public func asValue() -> JavaScriptValue {
    // Read without consuming, so the state keeps owning the object.
    switch longLivedState.object {
    case .some(let object):
      return object.copy()
    case .none:
      return .undefined()
    }
  }

  /// Resolves the promise with a JavaScript value. The value is consumed and tracked by the promise's
  /// long-lived state while the hop to the JavaScript thread is in flight, so the teardown sweep can
  /// release it if the runtime goes away before the task runs.
  public func resolve(_ value: consuming JavaScriptValue) {
    guard scheduler.mayBeAlive else {
      return
    }
    if !scheduler.supportsAsyncScheduling {
      let longLivedState = self.longLivedState
      var pending: JavaScriptValue? = .some(value)
      _ = scheduler.runIfSync { runtime in
        guard let resolver = longLivedState.resolveFunction.take() else {
          return
        }
        longLivedState.markSettled()
        do {
          _ = try resolver.getFunction().call(argument: pending.take()!)
          longLivedState.rejectFunction = nil
        } catch {
          let errorValue = JavaScriptError.from(error, in: runtime).toValue()
          _ = try? longLivedState.rejectFunction.take()?.getFunction().call(argument: errorValue)
          longLivedState.resolveFunction = nil
        }
      }
      return
    }
    let ref = value.ref()
    guard longLivedState.trackPendingResolveValue(ref) else {
      return
    }
    // `resolve` is not isolated, so make sure to jump to JS thread.
    scheduler.schedule(priority: .immediate) { [longLivedState] runtime in
      longLivedState.untrackPendingResolveValue(ref)
      // If the promise is already settled or released, drop the value on the JS thread and return.
      guard let resolver = longLivedState.resolveFunction.take() else {
        ref.release()
        return
      }
      longLivedState.markSettled()
      do {
        // Call the actual resolver. If `await()` has installed the `then` callbacks, they forward
        // the settlement to `deferredPromise`.
        let resolvedValue: JavaScriptValue = try ref.take()
        _ = try resolver.getFunction().call(argument: resolvedValue)

        // The rejecter can't be called anymore. The state stays registered so it keeps owning the
        // object until the wrapper is dropped (or the teardown sweep runs).
        longLivedState.rejectFunction = nil
      } catch {
        // The resolver call failed; reject with the error instead. The rejecter call itself can
        // realistically only throw when the runtime is being torn down, where dropping the settle
        // is harmless because the JS world is going away.
        let errorValue = JavaScriptError.from(error, in: runtime).toValue()
        _ = try? longLivedState.rejectFunction.take()?.getFunction().call(argument: errorValue)
        longLivedState.resolveFunction = nil
      }
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
      guard let resolver = longLivedState.resolveFunction.take() else {
        return
      }
      longLivedState.markSettled()
      do {
        // Call the actual resolver. If `await()` has installed the `then` callbacks, they forward
        // the settlement to `deferredPromise`.
        _ = try resolver.getFunction().call(argument: value.toJavaScriptValue(in: runtime))

        // The rejecter can't be called anymore. The state stays registered so it keeps owning the
        // object until the wrapper is dropped (or the teardown sweep runs).
        longLivedState.rejectFunction = nil
      } catch {
        // The resolver call failed; reject with the error instead. The rejecter call itself can
        // realistically only throw when the runtime is being torn down, where dropping the settle
        // is harmless because the JS world is going away.
        let errorValue = JavaScriptError.from(error, in: runtime).toValue()
        _ = try? longLivedState.rejectFunction.take()?.getFunction().call(argument: errorValue)
        longLivedState.resolveFunction = nil
      }
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
      guard let resolver = longLivedState.resolveFunction.take() else {
        return
      }
      longLivedState.markSettled()
      do {
        let encoded = try V.encode(value, in: runtime)
        // Call the actual resolver. If `await()` has installed the `then` callbacks, they forward
        // the settlement to `deferredPromise`.
        _ = try resolver.getFunction().call(argument: encoded)
        // The state stays registered so it keeps owning the object until the wrapper is dropped.
        longLivedState.rejectFunction = nil
      } catch {
        // Encoding or the resolver call failed; reject with the error instead. The rejecter call
        // itself can realistically only throw when the runtime is being torn down, where dropping
        // the settle is harmless because the JS world is going away.
        let errorValue = JavaScriptError.from(error, in: runtime).toValue()
        _ = try? longLivedState.rejectFunction.take()?.getFunction().call(argument: errorValue)
        longLivedState.resolveFunction = nil
      }
    }
  }

  public func reject(_ error: any Error) {
    guard scheduler.mayBeAlive else {
      return
    }

    // `reject` is not isolated, so make sure to jump to JS thread.
    scheduler.schedule(priority: .immediate) { [longLivedState] runtime in
      // If the promise is already settled, do nothing.
      guard let rejecter = longLivedState.rejectFunction.take() else {
        return
      }
      longLivedState.markSettled()
      // Convert the error to its JavaScript representation. This preserves an existing
      // `JavaScriptError`'s wrapped value and a `JavaScriptThrowable`'s structured `code`
      // (mirroring the synchronous throw path in `forwardingSwiftErrorsToJS`), so the `code`
      // is not lost on async rejection. See `JavaScriptError.from(_:in:)`.
      let errorValue = JavaScriptError.from(error, in: runtime).toValue()

      // Call the actual rejecter. If `await()` has installed the `then` callbacks, they forward the
      // settlement to `deferredPromise`.
      // The call can realistically only throw when the runtime is being torn down, where dropping
      // the settle is harmless because the JS world is going away.
      _ = try? rejecter.getFunction().call(argument: errorValue)

      // The resolver can't be called anymore. The state stays registered so it keeps owning the
      // object until the wrapper is dropped (or the teardown sweep runs).
      longLivedState.resolveFunction = nil
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
    // Installing calls `then`, which is JavaScript, so it has to run on the runtime's JavaScript
    // thread, the same hop `resolve` and `reject` make. `@JavaScriptActor` does not get there on
    // its own: its executor runs jobs inline on the calling thread. `execute` runs the closure
    // inline when the caller is already on the JavaScript thread, and serializes concurrent first
    // `await()` callers so the `then` callbacks are installed only once.
    return try await scheduler.execute { [longLivedState] runtime in
      if let existing = longLivedState.deferredPromise {
        return existing
      }
      if longLivedState.object == nil {
        throw JavaScriptCallback.RuntimeLostError()
      }
      let deferredPromise = DeferredPromise()
      let onFulfilled = runtime.createFunction { [weak longLivedState, weak deferredPromise] this, arguments in
        guard let deferredPromise else { return .undefined() }
        // Both refs are made here, on the JavaScript thread: the copy for later `await()` calls clones
        // the value, and the refs let `DeferredPromise` carry it off the JavaScript thread.
        let value: JavaScriptValue = arguments.count > 0 ? arguments[0] : .undefined()
        let kept = value.copy().ref()
        let settled = DeferredPromise.SettledValue(handOut: value.ref(), kept: kept)
        longLivedState?.settledValue = settled
        deferredPromise.resolve(settled)
        return .undefined()
      }
      let onRejected = runtime.createFunction { [weak deferredPromise] this, arguments in
        guard let deferredPromise else { return .undefined() }
        // Wrap the rejection value into a `JavaScriptError` here, on the JavaScript thread,
        // since building the error touches the runtime.
        let reason: JavaScriptValue = arguments.count > 0 ? arguments[0] : .undefined()
        let error = JavaScriptError(runtime, value: reason)
        deferredPromise.reject(error)
        return .undefined()
      }
      // Parameter packs take copyable elements only, so the callbacks travel as refs.
      let onFulfilledRef = onFulfilled.ref()
      let onRejectedRef = onRejected.ref()
      switch longLivedState.object {
      case .some(let object):
        try object.getObject().callFunction(.cached(runtime, "then"), arguments: onFulfilledRef, onRejectedRef)
      case .none:
        throw JavaScriptCallback.RuntimeLostError()
      }
      // Stored only once the callbacks are in place, so a failed install (e.g. `then` unavailable) is
      // retried by the next `await()` instead of leaving a receiver nothing will ever settle.
      if longLivedState.storeDeferredPromise(deferredPromise) {
        deferredPromise.releaseOnTeardown()
      }
      return deferredPromise
    }
  }
}

// MARK: - Deferred promise factory

extension JavaScriptRuntime {
  /// Calls the cached `() => [promise, resolve, reject]` function, creating it on first use.
  /// Evaluated from source so it captures nothing native; it is plain JavaScript the engine can
  /// optimize like any other closure.
  @JavaScriptActor
  fileprivate func createDeferredPromiseTriple() throws -> JavaScriptArray {
    let makeFactory = {
      return try self.eval(
        label: "expo-modules-jsi/deferred-promise.js",
        """
        (function () {
          let resolve, reject;
          const promise = new Promise(function (a, b) { resolve = a; reject = b; });
          return [promise, resolve, reject];
        })
        """
      ).getFunction()
    }
    return try withCached(CacheKeys.deferredPromiseFactory, makeFactory) { (factory: borrowing JavaScriptFunction) in
      return try factory.call().getArray()
    }
  }
}
