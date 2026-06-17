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

  // Create refs for resolve and reject functions.
  // They will be set in the Promise setup function.
  private let resolveFunction = JavaScriptValue.Ref()
  private let rejectFunction = JavaScriptValue.Ref()

  // Stored as a class so dropping the struct off-thread only decrements an ARC count.
  // resolve() and reject() capture this in their runtime.schedule blocks, ensuring
  // jsi::Value::~Value (which calls ptr_->invalidate()) always runs on the JS thread.
  private var value: JavaScriptValue

  /// Initializes a promise from the existing object. The promise may already be settled.
  /// It cannot be resolved/rejected from the outside, i.e. `resolve` and `reject` functions are no-op.
  @JavaScriptActor
  public init(_ runtime: JavaScriptRuntime, _ jsObject: consuming JavaScriptObject) throws {
    self.runtime = runtime
    self.value = jsObject.asValue()
    try setUpCallbacks()
  }

  /// Creates a new promise whose resolver or rejecter must be called from the outside (also known as a deferred promise).
  @JavaScriptActor
  public init(_ runtime: JavaScriptRuntime) throws {
    self.runtime = runtime
    // Initialize value before any throwing work. Swift requires a ~Copyable field to be
    // consistently initialized on every code path through a throwing initializer.
    self.value = .undefined

    // Create function that is the promise setup. It is called immediately on `callAsConstructor`.
    let setup = runtime.createFunction { [weak resolveFunction, weak rejectFunction] this, arguments in
      resolveFunction?.reset(arguments[0])
      rejectFunction?.reset(arguments[1])
      return .undefined
    }

    self.value =
      try runtime
      .global()
      .getPropertyAsFunction(.cached(runtime, "Promise"))
      .callAsConstructor(setup.asValue())

    try setUpCallbacks()
  }

  @JavaScriptActor
  internal init(_ runtime: JavaScriptRuntime, _ jsObject: consuming facebook.jsi.Object) throws {
    try self.init(runtime, JavaScriptObject(runtime, jsObject))
  }

  public var isDeferred: Bool {
    return !resolveFunction.isEmpty && !rejectFunction.isEmpty
  }

  @JavaScriptActor
  public func `await`() async throws -> JavaScriptValue {
    return try await deferredPromise.getValue()
  }

  public func asValue() -> JavaScriptValue {
    return value
  }

  public func resolve<V: JavaScriptRepresentable>(_ value: V) {
    guard let runtime else {
      return
    }

    // `resolve` is not isolated, so make sure to jump to JS thread.
    runtime.schedule(priority: .immediate) { [resolveFunction, rejectFunction, value = self.value] in
      // If the promise is already settled, do nothing.
      guard let resolver = resolveFunction.take() else {
        return
      }
      // Call the actual resolver given in the Promise setup.
      // This will also call `deferredPromise.resolve` in the `then` handler.
      _ = try! resolver.getFunction().call(arguments: value)

      // Release the rejecter and the promise value on the JS thread so their
      // jsi::Value destructors (which call back into the runtime) run here.
      rejectFunction.release()
      // `value` is released when this closure drops at the end of the scheduled block.
    }
  }

  public func reject(_ error: any Error) {
    guard let runtime else {
      return
    }

    // `reject` is not isolated, so make sure to jump to JS thread.
    runtime.schedule(priority: .immediate) { [resolveFunction, rejectFunction, value = self.value] in
      // If the promise is already settled, do nothing.
      guard let rejecter = rejectFunction.take() else {
        return
      }
      // Convert the error to its JavaScript representation. This preserves an existing
      // `JavaScriptError`'s wrapped value and a `JavaScriptThrowable`'s structured `code`
      // (mirroring the synchronous throw path in `forwardingSwiftErrorsToJS`), so the `code`
      // is not lost on async rejection. See `JavaScriptError.from(_:in:)`.
      let errorValue = JavaScriptError.from(error, in: runtime).toValue()

      // Call the actual rejecter given in the Promise setup.
      // This will also call `deferredPromise.reject` in the `then` handler.
      _ = try! rejecter.getFunction().call(arguments: errorValue)

      // Release the resolver and the promise value on the JS thread so their
      // jsi::Value destructors (which call back into the runtime) run here.
      resolveFunction.release()
      // `value` is released when this closure drops at the end of the scheduled block.
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
    try value.getObject().callFunction(.cached(runtime, "then"), arguments: onFulfilled.asValue(), onRejected.asValue())
  }
}
