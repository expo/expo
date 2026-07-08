internal import ExpoModulesJSI_Cxx
internal import jsi

/// A Swift representation of a JavaScript Promise.
///
/// `JavaScriptPromise` bridges JavaScript promises with Swift's async/await, allowing you to create
/// deferred promises that can be resolved or rejected from Swift, or wrap existing JavaScript promises
/// to await their results. It provides type-safe access to promise resolution and rejection, integrating
/// JavaScript's asynchronous patterns with Swift's concurrency model.
public struct JavaScriptPromise: JavaScriptType, ~Copyable {
  private typealias PromiseContinuation = CheckedContinuation<JavaScriptValue.Ref, any Error>

  private weak let runtime: JavaScriptRuntime?
  private let deferredPromise = DeferredPromise()

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
    // Stored as `JavaScriptValue` (a reference type), not `JavaScriptObject`: a `Copyable` value read
    // back through `JavaScriptRef.withValue` avoids the copy a borrowed `~Copyable` object would trap on.
    let object = JavaScriptValue.Ref()
    let resolveFunction = JavaScriptValue.Ref()
    let rejectFunction = JavaScriptValue.Ref()

    func allowRelease() {
      object.release()
      resolveFunction.release()
      rejectFunction.release()
    }
  }

  private let longLivedState = LongLivedState()

  /// Dropping the wrapper means no native code can settle or read this promise anymore, so release
  /// its long-lived state. The values can only be touched on the JS thread while the runtime is
  /// alive, so schedule the work there; if the runtime is already gone, the teardown sweep has
  /// released everything and there is nothing to do (this is the `#47454` off-thread-drop case).
  deinit {
    guard let runtime else {
      return
    }
    // Capture the collection, not the runtime, so a wrapper's deinit can't prolong the runtime's
    // lifetime by keeping it alive until the scheduled job drains.
    let longLivedObjects = runtime.longLivedObjects
    runtime.schedule { [longLivedState] in
      longLivedObjects.remove(longLivedState)
      longLivedState.allowRelease()
    }
  }

  /// Initializes a promise from the existing object. The promise may already be settled.
  /// It cannot be resolved/rejected from the outside, i.e. `resolve` and `reject` functions are no-op.
  @JavaScriptActor
  public init(_ runtime: JavaScriptRuntime, _ object: consuming JavaScriptObject) throws {
    self.runtime = runtime
    longLivedState.object.reset(object.asValue())
    try setUpCallbacks()
    // Register only after setup succeeds, so a failed initializer (e.g. `then` unavailable) doesn't
    // leave the state pinned in the collection until teardown. Owns the promise's JSI values from
    // here until teardown (see `LongLivedState`).
    runtime.longLivedObjects.add(longLivedState)
  }

  /// Creates a new promise whose resolver or rejecter must be called from the outside (also known as a deferred promise).
  @JavaScriptActor
  public init(_ runtime: JavaScriptRuntime) throws {
    self.runtime = runtime

    // Create function that is the promise setup. It is called immediately on `callAsConstructor`.
    let setup = runtime.createFunction { [weak longLivedState] this, arguments in
      longLivedState?.resolveFunction.reset(arguments[0])
      longLivedState?.rejectFunction.reset(arguments[1])
      return .undefined
    }

    let object =
      try runtime
      .global()
      .getPropertyAsFunction(.cached(runtime, "Promise"))
      .callAsConstructor(setup.asValue())
    longLivedState.object.reset(object)
    try setUpCallbacks()
    // Register only after setup succeeds, so a failed initializer (e.g. `then` unavailable) doesn't
    // leave the state pinned in the collection until teardown. Owns the promise's JSI values from
    // here until teardown (see `LongLivedState`).
    runtime.longLivedObjects.add(longLivedState)
  }

  @JavaScriptActor
  internal init(_ runtime: JavaScriptRuntime, _ object: consuming facebook.jsi.Object) throws {
    try self.init(runtime, JavaScriptObject(runtime, object))
  }

  public var isDeferred: Bool {
    return !longLivedState.resolveFunction.isEmpty && !longLivedState.rejectFunction.isEmpty
  }

  @JavaScriptActor
  public func `await`() async throws -> JavaScriptValue {
    return try await deferredPromise.getValue()
  }

  public func asValue() -> JavaScriptValue {
    // Read without consuming, so the state keeps owning the object (unlike `Ref.asValue()`).
    return longLivedState.object.withValue { object in
      return object
    } ?? .undefined
  }

  public func resolve<V: JavaScriptRepresentable>(_ value: V) {
    guard let runtime else {
      return
    }

    // `resolve` is not isolated, so make sure to jump to JS thread.
    runtime.schedule(priority: .immediate) { [longLivedState] in
      // If the promise is already settled, do nothing.
      guard let resolver = longLivedState.resolveFunction.take() else {
        return
      }
      // Call the actual resolver given in the Promise setup.
      // This will also call `deferredPromise.resolve` in the `then` handler.
      _ = try! resolver.getFunction().call(arguments: value)

      // The rejecter can't be called anymore. The state stays registered so it keeps owning the
      // object until the wrapper is dropped (or the teardown sweep runs).
      longLivedState.rejectFunction.release()
    }
  }

  public func reject(_ error: any Error) {
    guard let runtime else {
      return
    }

    // `reject` is not isolated, so make sure to jump to JS thread.
    runtime.schedule(priority: .immediate) { [longLivedState] in
      // If the promise is already settled, do nothing.
      guard let rejecter = longLivedState.rejectFunction.take() else {
        return
      }
      // A `JavaScriptError` already carries the value to reject with (which may be an arbitrary JS
      // value rather than an `Error`), so reuse it. Any other native error is stringified into a
      // generic `Error`.
      let jsError = error as? JavaScriptError ?? JavaScriptError(runtime, message: String(describing: error))
      let errorValue = jsError.toValue()

      // Call the actual rejecter given in the Promise setup.
      // This will also call `deferredPromise.reject` in the `then` handler.
      _ = try! rejecter.getFunction().call(arguments: errorValue)

      // The resolver can't be called anymore. The state stays registered so it keeps owning the
      // object until the wrapper is dropped (or the teardown sweep runs).
      longLivedState.resolveFunction.release()
    }
  }

  @JavaScriptActor
  private func setUpCallbacks() throws {
    guard let runtime else {
      return
    }
    let onFulfilled = runtime.createFunction { [weak deferredPromise] this, arguments in
      guard let deferredPromise else { return .undefined }
      let value = arguments[0]
      Task.immediate_polyfill {
        await deferredPromise.resolve(value)
      }
      return .undefined
    }
    let onRejected = runtime.createFunction { [weak deferredPromise] this, arguments in
      guard let deferredPromise else { return .undefined }
      // Wrap the rejection value into a `JavaScriptError` here, on the JavaScript thread, rather
      // than inside the off-thread actor, since building the error touches the runtime.
      let error = JavaScriptError(runtime, value: arguments[0])
      Task.immediate_polyfill {
        await deferredPromise.reject(error)
      }
      return .undefined
    }
    _ = try longLivedState.object.withValue { object in
      try object?.getObject().callFunction(
        .cached(runtime, "then"),
        arguments: onFulfilled.asValue(),
        onRejected.asValue()
      )
    }
  }
}
