internal import ExpoModulesJSI_Cxx
internal import jsi

/// A Swift representation of a JavaScript Promise.
///
/// `JavaScriptPromise` bridges JavaScript promises with Swift's async/await, allowing you to create
/// deferred promises that can be resolved or rejected from Swift, or wrap existing JavaScript promises
/// to await their results. It provides type-safe access to promise resolution and rejection, integrating
/// JavaScript's asynchronous patterns with Swift's concurrency model.
public struct JavaScriptPromise: JavaScriptType, ~Copyable {
  /// Held instead of the runtime, because the promise is settled and released from any thread.
  private let scheduler: JavaScriptRuntime.Scheduler

  /// Owns the promise's JSI values (the object, for a deferred promise its resolve/reject functions,
  /// and once settled the value or the rejection reason that `await()` reads). Registered with the runtime's ``LongLivedObjectCollection`` so they're released on
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

    /// What `await()` reads, created on the first `await()` together with the `then` callbacks that
    /// feed it. Not created at construction: a promise that is only handed to JavaScript and settled
    /// from Swift never needs it, and the callbacks cost two host functions and a `then` call per
    /// promise. Its presence is what marks the callbacks as installed.
    var settlement: Settlement?

    func allowRelease() {
      object = nil
      resolveFunction = nil
      rejectFunction = nil
      settlement?.allowRelease()
    }
  }

  /// How the promise settled, for `await()`. Like the values in ``LongLivedState``, it's only touched
  /// on the runtime's JavaScript thread.
  @JavaScriptActor
  private final class Settlement {
    /// The value the promise was fulfilled with, or the reason it was rejected with. Each `await()`
    /// gets a clone, so this one stays valid for later calls.
    nonisolated(unsafe) var fulfilledValue: JavaScriptValue?
    nonisolated(unsafe) var rejectionReason: JavaScriptValue?
    /// The `await()` calls that wait for the promise to settle.
    var awaiters: [PromiseAwaiter] = []

    var isSettled: Bool {
      return fulfilledValue != nil || rejectionReason != nil
    }

    func fulfill(_ value: consuming JavaScriptValue, runtime: JavaScriptRuntime) {
      fulfilledValue = consume value
      resumeAwaiters(runtime: runtime)
    }

    func reject(_ reason: consuming JavaScriptValue, runtime: JavaScriptRuntime) {
      rejectionReason = consume reason
      resumeAwaiters(runtime: runtime)
    }

    /// Resumes `awaiter` now if the promise has settled, or keeps it until it does.
    func add(_ awaiter: PromiseAwaiter, runtime: JavaScriptRuntime) {
      if isSettled {
        awaiter.resume(with: result(in: runtime))
      } else {
        awaiters.append(awaiter)
      }
    }

    private func resumeAwaiters(runtime: JavaScriptRuntime) {
      let awaiters = self.awaiters
      self.awaiters = []
      for awaiter in awaiters {
        awaiter.resume(with: result(in: runtime))
      }
    }

    /// A clone of the settled value for one `await()`, or the error it throws.
    private func result(in runtime: JavaScriptRuntime) -> Result<JavaScriptValue.Ref, any Error> {
      if let value = fulfilledValue?.copy() {
        return .success(value.ref())
      }
      if let reason = rejectionReason?.copy() {
        return .failure(JavaScriptError(runtime, value: reason))
      }
      return .failure(JavaScriptCallback.RuntimeLostError())
    }

    func allowRelease() {
      fulfilledValue = nil
      rejectionReason = nil
      // The runtime is going away, so nothing can settle the promise anymore. Dropping the awaiters
      // makes them throw `RuntimeLostError` instead of waiting for good.
      awaiters = []
    }
  }

  private let longLivedState = LongLivedState()

  /// Dropping the wrapper means no native code can settle or read this promise anymore, so release
  /// its long-lived state. The values can only be touched on the JS thread while the runtime is
  /// alive, so schedule the work there; if the runtime is already gone, the teardown sweep has
  /// released everything and there is nothing to do (this is the `#47454` off-thread-drop case).
  deinit {
    guard scheduler.mayBeAlive else {
      return
    }
    scheduler.schedule { [longLivedState] runtime in
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
    // callbacks are actually installed (see `settlement(of:in:)`).
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
    return longLivedState.resolveFunction != nil && longLivedState.rejectFunction != nil
  }

  /// Waits for the promise to settle. Throws ``JavaScriptCallback/RuntimeLostError`` when the runtime
  /// is gone before the promise settles.
  @JavaScriptActor
  public func `await`() async throws -> JavaScriptValue {
    // Without a runtime nothing can settle the promise, so throw instead of suspending for good.
    guard scheduler.mayBeAlive else {
      throw JavaScriptCallback.RuntimeLostError()
    }
    let ref = try await withCheckedThrowingContinuation { continuation in
      let awaiter = PromiseAwaiter(continuation)
      // The promise's values live on its runtime's JavaScript thread, which is this thread when the
      // runtime is the one bound to `JavaScriptActor`: then this runs inline.
      scheduler.runOrSchedule(priority: .immediate) { [longLivedState] runtime in
        do {
          try Self.settlement(of: longLivedState, in: runtime).add(awaiter, runtime: runtime)
        } catch {
          awaiter.resume(with: .failure(error))
        }
      }
    }
    return try ref.take()
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

  /// Resolves the promise with a JavaScript value. The value is consumed and moved into a
  /// `JavaScriptRef` so the hop to the JavaScript thread can carry it; see the representable
  /// overload for the semantics.
  public func resolve(_ value: consuming JavaScriptValue) {
    resolve(value.ref())
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
      do {
        // Call the actual resolver. If `await()` has installed the `then` callbacks, they forward
        // the settlement to `await()`.
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
      do {
        let encoded = try V.encode(value, in: runtime)
        // Call the actual resolver. If `await()` has installed the `then` callbacks, they forward
        // the settlement to `await()`.
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
      // Convert the error to its JavaScript representation. This preserves an existing
      // `JavaScriptError`'s wrapped value and a `JavaScriptThrowable`'s structured `code`
      // (mirroring the synchronous throw path in `forwardingSwiftErrorsToJS`), so the `code`
      // is not lost on async rejection. See `JavaScriptError.from(_:in:)`.
      let errorValue = JavaScriptError.from(error, in: runtime).toValue()

      // Call the actual rejecter. If `await()` has installed the `then` callbacks, they forward the
      // settlement to `await()`.
      // The call can realistically only throw when the runtime is being torn down, where dropping
      // the settle is harmless because the JS world is going away.
      _ = try? rejecter.getFunction().call(argument: errorValue)

      // The resolver can't be called anymore. The state stays registered so it keeps owning the
      // object until the wrapper is dropped (or the teardown sweep runs).
      longLivedState.resolveFunction = nil
    }
  }

  /// Returns the promise's ``Settlement``, creating it with the `then` callbacks that feed it on the
  /// first call. Installing on an already settled promise is fine: `then` schedules the matching
  /// callback for it.
  @JavaScriptActor
  private static func settlement(of state: LongLivedState, in runtime: JavaScriptRuntime) throws -> Settlement {
    if let settlement = state.settlement {
      return settlement
    }
    let settlement = Settlement()
    let onFulfilled = runtime.createFunction { [weak settlement] this, arguments in
      settlement?.fulfill(arguments[0], runtime: runtime)
      return .undefined()
    }
    let onRejected = runtime.createFunction { [weak settlement] this, arguments in
      settlement?.reject(arguments[0], runtime: runtime)
      return .undefined()
    }
    // Parameter packs take copyable elements only, so the callbacks travel as refs.
    let onFulfilledRef = onFulfilled.ref()
    let onRejectedRef = onRejected.ref()
    switch state.object {
    case .some(let object):
      try object.getObject().callFunction(.cached(runtime, "then"), arguments: onFulfilledRef, onRejectedRef)
    case .none:
      throw JavaScriptCallback.RuntimeLostError()
    }
    // Stored only once the callbacks are in place, so a failed install (e.g. `then` unavailable) is
    // retried by the next `await()`.
    state.settlement = settlement
    return settlement
  }
}

/// One `await()` call waiting for a promise to settle. Resumes its caller exactly once. When it's
/// released without having resumed, because the runtime went away first (the host dropped the work
/// that would have registered it, or the teardown sweep dropped it), it throws
/// ``JavaScriptCallback/RuntimeLostError`` so the caller doesn't wait for good.
private final class PromiseAwaiter: @unchecked Sendable {
  private var continuation: CheckedContinuation<JavaScriptValue.Ref, any Error>?

  init(_ continuation: CheckedContinuation<JavaScriptValue.Ref, any Error>) {
    self.continuation = continuation
  }

  func resume(with result: Result<JavaScriptValue.Ref, any Error>) {
    continuation?.resume(with: result)
    continuation = nil
  }

  deinit {
    continuation?.resume(throwing: JavaScriptCallback.RuntimeLostError())
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
    return try withCached(deferredPromiseFactoryKey, makeFactory) { (factory: borrowing JavaScriptFunction) in
      return try factory.call().getArray()
    }
  }
}

/// Key of the deferred promise factory in each runtime's cache.
private let deferredPromiseFactoryKey = JavaScriptRuntime.Cache.Key<JavaScriptFunction.Ref>()
