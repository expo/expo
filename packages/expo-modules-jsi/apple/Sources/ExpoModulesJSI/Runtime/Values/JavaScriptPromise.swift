internal import ExpoModulesJSI_Cxx
import Foundation
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

  // All JSI-owning members live behind `state`, whose deinit releases them on the JS thread.
  // Promises get captured by arbitrary native closures (URLSession completion handlers, dispatch
  // queues) whose last release can happen on any thread — and, after `reloadAsync()`, after the
  // runtime is gone. Destroying `jsi::Object`s there crashes in `jsi::Pointer::~Pointer`.
  private let state: State

  /// Initializes a promise from the existing object. The promise may already be settled.
  /// It cannot be resolved/rejected from the outside, i.e. `resolve` and `reject` functions are no-op.
  @JavaScriptActor
  public init(_ runtime: JavaScriptRuntime, _ object: consuming JavaScriptObject) throws {
    self.runtime = runtime
    self.state = State(runtime: runtime)
    state.object.reset(object)
    try setUpCallbacks()
  }

  /// Creates a new promise whose resolver or rejecter must be called from the outside (also known as a deferred promise).
  @JavaScriptActor
  public init(_ runtime: JavaScriptRuntime) throws {
    self.runtime = runtime
    self.state = State(runtime: runtime)

    // Create function that is the promise setup. It is called immediately on `callAsConstructor`.
    let setup = runtime.createFunction { [weak state] this, arguments in
      state?.resolveFunction.reset(arguments[0])
      state?.rejectFunction.reset(arguments[1])
      return .undefined
    }

    let object =
      try runtime
      .global()
      .getPropertyAsFunction(.cached(runtime, "Promise"))
      .callAsConstructor(setup.asValue())
      .getObject()

    state.object.reset(object)
    try setUpCallbacks()
  }

  @JavaScriptActor
  internal init(_ runtime: JavaScriptRuntime, _ object: consuming facebook.jsi.Object) throws {
    try self.init(runtime, JavaScriptObject(runtime, object))
  }

  public var isDeferred: Bool {
    return !state.resolveFunction.isEmpty && !state.rejectFunction.isEmpty
  }

  @JavaScriptActor
  public func `await`() async throws -> JavaScriptValue {
    return try await state.deferredPromise.getValue()
  }

  public func asValue() -> JavaScriptValue {
    let value = state.object.withValue { object -> JavaScriptValue? in
      switch object {
      case .none:
        return nil
      case .some(let object):
        return object.asValue()
      }
    }
    guard let value else {
      // Both initializers populate the object ref for the promise's lifetime.
      preconditionFailure("JavaScriptPromise's object reference is unexpectedly empty")
    }
    return value
  }

  public func resolve<V: JavaScriptRepresentable>(_ value: V) {
    guard let runtime else {
      return
    }

    // `resolve` is not isolated, so make sure to jump to JS thread.
    runtime.schedule(priority: .immediate) { [state] in
      // If the promise is already settled, do nothing.
      guard let resolver = state.resolveFunction.take() else {
        return
      }
      // Call the actual resolver given in the Promise setup.
      // This will also call `deferredPromise.resolve` in the `then` handler.
      _ = try! resolver.getFunction().call(arguments: value)

      // Release the rejecter, we cannot call it anymore.
      state.rejectFunction.release()
    }
  }

  public func reject(_ error: any Error) {
    guard let runtime else {
      return
    }

    // `reject` is not isolated, so make sure to jump to JS thread.
    runtime.schedule(priority: .immediate) { [state] in
      // If the promise is already settled, do nothing.
      guard let rejecter = state.rejectFunction.take() else {
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

      // Release the resolver, we cannot call it anymore.
      state.resolveFunction.release()
    }
  }

  @JavaScriptActor
  private func setUpCallbacks() throws {
    guard let runtime else {
      return
    }
    let deferredPromise = state.deferredPromise
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
    let attached = try state.object.withValue { object -> Bool? in
      switch object {
      case .none:
        return nil
      case .some(let object):
        _ = try object.callFunction(.cached(runtime, "then"), arguments: onFulfilled.asValue(), onRejected.asValue())
        return true
      }
    }
    guard attached != nil else {
      // Both initializers populate the object ref before setting up callbacks.
      preconditionFailure("JavaScriptPromise's object reference is unexpectedly empty")
    }
  }
}

extension JavaScriptPromise {
  /// Reference-counted home for the promise's JSI-owning members. Its deinit is the
  /// single place that decides on which thread they get destroyed.
  private final class State: @unchecked Sendable {
    private weak var runtime: JavaScriptRuntime?
    let object = JavaScriptRef<JavaScriptObject>()
    let resolveFunction = JavaScriptValue.Ref()
    let rejectFunction = JavaScriptValue.Ref()
    // Kept here (not on the struct) because a settled promise stores its JSI
    // result value inside the actor — it needs the same safe release.
    let deferredPromise = DeferredPromise()

    init(runtime: JavaScriptRuntime?) {
      self.runtime = runtime
    }

    deinit {
      guard let runtime else {
        // The runtime is gone — the heap behind these wrappers is freed or being
        // freed, so destroying them would crash. Park them forever instead.
        JSIReleasePool.park(runtime: nil) { [object, resolveFunction, rejectFunction, deferredPromise] in
          _ = (object, resolveFunction, rejectFunction, deferredPromise)
        }
        return
      }
      if runtime.isOnJavaScriptThread() || !runtime.supportsAsyncScheduling {
        // Members release inline right after this deinit — safe on the JS thread.
        // Without async scheduling, `schedule` would run inline here anyway.
        return
      }
      // Off the JS thread with a live runtime: park everything and let the JS
      // thread run the release. The scheduled block itself captures no JSI
      // values, so the scheduler dropping it un-run at teardown is harmless —
      // the entries just stay parked.
      JSIReleasePool.park(runtime: runtime) { [object, resolveFunction, rejectFunction, deferredPromise] in
        object.release()
        resolveFunction.release()
        rejectFunction.release()
        _ = deferredPromise
      }
      runtime.schedule { [weak runtime] in
        guard let runtime else { return }
        JSIReleasePool.drain(on: runtime)
      }
    }
  }
}

/// Parking lot for release work that must run on a runtime's JS thread.
/// Entries whose runtime dies before a drain stay parked for the rest of the
/// process — running or discarding them would touch freed runtime memory.
/// Costs a few hundred bytes per abandoned promise, on the teardown path only.
internal enum JSIReleasePool {
  private struct Entry {
    weak var runtime: JavaScriptRuntime?
    let release: () -> Void
  }

  private static let lock = NSLock()
  nonisolated(unsafe) private static var parked: [Entry] = []

  /// Parks `release` until `drain(on:)` runs it on the runtime's JS thread.
  /// Pass a `nil` runtime when it is already gone — the entry then stays parked forever.
  internal static func park(runtime: JavaScriptRuntime?, _ release: @escaping () -> Void) {
    lock.lock()
    defer { lock.unlock() }
    parked.append(Entry(runtime: runtime, release: release))
  }

  /// Runs the pending releases that belong to `runtime`. Must be called on its JS thread.
  /// Matching by weak identity (never by address) makes runtime address reuse harmless.
  internal static func drain(on runtime: JavaScriptRuntime) {
    lock.lock()
    var releases: [() -> Void] = []
    parked.removeAll { entry in
      guard let entryRuntime = entry.runtime, entryRuntime === runtime else {
        return false
      }
      releases.append(entry.release)
      return true
    }
    lock.unlock()
    for release in releases {
      release()
    }
  }
}
