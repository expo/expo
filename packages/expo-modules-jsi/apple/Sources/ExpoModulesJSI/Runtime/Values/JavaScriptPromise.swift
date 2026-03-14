internal import jsi
internal import ExpoModulesJSI_Cxx

/**
 A Swift representation of a JavaScript Promise.

 `JavaScriptPromise` bridges JavaScript promises with Swift's async/await, allowing you to create
 deferred promises that can be resolved or rejected from Swift, or wrap existing JavaScript promises
 to await their results. It provides type-safe access to promise resolution and rejection, integrating
 JavaScript's asynchronous patterns with Swift's concurrency model.
 */
public struct JavaScriptPromise: JavaScriptType, ~Copyable {
  private typealias PromiseContinuation = CheckedContinuation<JavaScriptValue.Ref, any Error>

  private weak var runtime: JavaScriptRuntime?
  private let object: JavaScriptObject
  private let deferredPromise = DeferredPromise()

  // Create refs for resolve and reject functions.
  // They will be set in the Promise setup function.
  private let resolveFunction = JavaScriptValue.Ref()
  private let rejectFunction = JavaScriptValue.Ref()

  /**
   Initializes a promise from the existing object. The promise may already be settled.
   It cannot be resolved/rejected from the outside, i.e. `resolve` and `reject` functions are no-op.
   */
  @JavaScriptActor
  public init(_ runtime: JavaScriptRuntime, _ object: consuming JavaScriptObject) {
    self.runtime = runtime
    self.object = object
    try! setUpCallbacks()
  }

  /**
   Creates a new promise whose resolver or rejecter must be called from the outside (also known as a deferred promise).
   */
  @JavaScriptActor
  public init(_ runtime: JavaScriptRuntime) {
    self.runtime = runtime

    // Create function that is the promise setup. It is called immediately on `callAsConstructor`.
    let setup = runtime.createFunction { [resolveFunction, rejectFunction] this, arguments in
      resolveFunction.reset(arguments[0])
      rejectFunction.reset(arguments[1])
      return .undefined()
    }

    self.object = try! runtime
      .global()
      .getPropertyAsFunction(.cached(runtime, "Promise"))
      .callAsConstructor(setup.asValue())
      .getObject()

    try! setUpCallbacks()
  }

  @JavaScriptActor
  internal init(_ runtime: JavaScriptRuntime, _ object: consuming facebook.jsi.Object) {
    self.init(runtime, JavaScriptObject(runtime, object))
  }

  public var isDeferred: Bool {
    // TODO: This may not be correct when the promise is already settled
    return resolveFunction.isEmpty && rejectFunction.isEmpty
  }

  @JavaScriptActor
  public func `await`() async throws -> JavaScriptValue {
    return try await deferredPromise.getValue()
  }

  public func asValue() -> JavaScriptValue {
    return object.asValue()
  }

  public func resolve<V: JavaScriptRepresentable>(_ value: V) {
    guard let runtime else {
      return
    }
    guard !resolveFunction.isEmpty else {
      preconditionFailure("Cannot settle a promise more than once")
    }

    // `resolve` is not isolated, so make sure to jump to JS thread.
    runtime.schedule(priority: .immediate) { [resolveFunction, rejectFunction] in
      // Call the actual resolver given in the Promise setup.
      // This will also call `deferredPromise.resolve` in the `then` handler.
      _ = try! resolveFunction.take().getFunction().call(arguments: value)

      // Release the rejecter, we cannot call it anymore.
      rejectFunction.release()
    }
  }

  public func reject(_ error: any Error) {
    guard let runtime else {
      return
    }
    guard !rejectFunction.isEmpty else {
      preconditionFailure("Cannot settle a promise more than once")
    }

    // `reject` is not isolated, so make sure to jump to JS thread.
    runtime.schedule(priority: .immediate) { [resolveFunction, rejectFunction] in
      // Create a JS error from any (native) error.
      let errorValue = JavaScriptError(runtime, message: error.localizedDescription).asValue()

      // Call the actual rejecter given in the Promise setup.
      // This will also call `deferredPromise.reject` in the `then` handler.
      _ = try! rejectFunction.take().getFunction().call(arguments: errorValue)

      // Release the resolver, we cannot call it anymore.
      resolveFunction.release()
    }
  }

  @JavaScriptActor
  private func setUpCallbacks() throws {
    guard let runtime else {
      return
    }
    let onFulfilled = runtime.createFunction { [deferredPromise] this, arguments in
      let value = arguments[0]
      Task.immediate_polyfill {
        await deferredPromise.resolve(value)
      }
      return .undefined()
    }
    let onRejected = runtime.createFunction { [deferredPromise] this, arguments in
      let error = arguments[0]
      Task.immediate_polyfill {
        await deferredPromise.reject(error)
      }
      return .undefined()
    }
    try object.callFunction(.cached(runtime, "then"), arguments: onFulfilled.asValue(), onRejected.asValue())
  }
}
