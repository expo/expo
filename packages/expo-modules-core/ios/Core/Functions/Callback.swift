// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A JavaScript function passed to a native function as an argument. Native code can call it any
 number of times from any thread. Each call is scheduled onto the JavaScript thread. Calls made
 after the runtime is gone are dropped.
 */
public final class Callback: AnyArgument, @unchecked Sendable {
  /**
   Owns the JavaScript function. Registered with the runtime's `LongLivedObjectCollection` so the
   function is released on the JavaScript thread while the runtime is still alive, rather than
   against a freed runtime when a module keeps the callback past a runtime teardown.

   There are two release paths, both on the JavaScript thread:
   - When the `Callback` is dropped, its `deinit` deregisters this state and releases the function,
     so a stream of callbacks does not pin its functions until teardown.
   - If the `Callback` outlives the runtime, the teardown sweep (`allowRelease()`) releases whatever
     is still registered before the runtime is destroyed.
   */
  @JavaScriptActor
  private final class LongLivedState: LongLivedObject {
    // A ref rather than the bare function: `JavaScriptFunction` is non-copyable, and `withValue`
    // borrows it so `invoke` can call it repeatedly without consuming it.
    let function = JavaScriptRef<JavaScriptFunction>()

    func allowRelease() {
      function.release()
    }
  }

  private let longLivedState: LongLivedState

  /// The runtime the function came from. Only written in `init`.
  private weak var runtime: ExpoRuntime?

  /// Only written in `init`.
  private weak var appContext: AppContext?

  @JavaScriptActor
  internal init(function: consuming JavaScriptFunction, appContext: AppContext) {
    let longLivedState = LongLivedState()
    longLivedState.function.reset(function)

    self.longLivedState = longLivedState
    self.appContext = appContext
    self.runtime = try? appContext.runtime
    self.runtime?.longLivedObjects.add(longLivedState)
  }

  /**
   Dropping the `Callback` means no native code can call the function anymore, so release its
   long-lived state. The function can only be touched on the JavaScript thread while the runtime is
   alive, so schedule the work there. If the runtime is already gone, the teardown sweep has
   released everything and there is nothing to do.
   */
  deinit {
    guard let runtime else {
      return
    }
    // Capture the runtime weakly so this `deinit` cannot prolong its lifetime. If it is gone by the
    // time the job runs, the teardown sweep has already released the state.
    runtime.schedule { [weak runtime, longLivedState] in
      guard let runtime else {
        return
      }
      runtime.longLivedObjects.remove(longLivedState)
      longLivedState.allowRelease()
    }
  }

  /**
   Calls the JavaScript function with the given arguments. Each argument is converted to a
   JavaScript value on the JavaScript thread using its dynamic type, like `Promise.resolve`.
   Because the conversion happens later, on the JavaScript thread, do not mutate a passed
   reference-type value after the call.
   */
  public func callAsFunction<each A: AnyArgument>(_ arguments: repeat each A) {
    var pairs: [(value: Any, dynamicType: AnyDynamicType)] = []
    repeat pairs.append((each arguments, (each A).getDynamicType()))
    invoke(NonisolatedUnsafeVar(pairs))
  }

  private func invoke(_ pairs: NonisolatedUnsafeVar<[(value: Any, dynamicType: AnyDynamicType)]>) {
    // The runtime must still be the one this callback was decoded in. A replaced runtime on the same
    // app context would otherwise reach `JavaScriptFunction.call`, which traps when its runtime is gone.
    guard let appContext,
      let heldRuntime = runtime,
      let currentRuntime = try? appContext.runtime,
      currentRuntime === heldRuntime else {
      return
    }

    // Re-capture weakly: a call queued just before teardown is dropped, per the Callback contract.
    currentRuntime.schedule(priority: .immediate) { [weak appContext, weak heldRuntime, longLivedState] in
      guard let appContext,
        let expectedRuntime = heldRuntime,
        let runtime = try? appContext.runtime,
        runtime === expectedRuntime else {
        return
      }
      do {
        let values = try pairs.value.map { pair in
          try appContext.converter.toJS(pair.value, pair.dynamicType)
        }
        _ = try longLivedState.function.withValue { fn in
          let buffer = JavaScriptValuesBuffer.copying(in: runtime, values: values)
          return try fn?.call(arguments: buffer)
        }
      } catch {
        log.error("Callback invocation failed: \(error)")
      }
    }
  }

  public static func getDynamicType() -> AnyDynamicType {
    return DynamicCallbackType()
  }
}

// MARK: - JavaScriptDecodable

extension Callback: JavaScriptDecodable {
  @JavaScriptActor
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Callback {
    guard value.kind == .function else {
      throw Conversions.CastingJSValueException<Callback>(value.kind)
    }
    guard let appContext = AppContext.from(runtime: runtime) else {
      throw Exceptions.AppContextNotFound()
    }
    return Callback(function: value.getFunction(), appContext: appContext)
  }
}
