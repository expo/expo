// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A JavaScript function passed to a native function as an argument. Native code can call it any
 number of times from any thread. Each call is scheduled onto the JavaScript thread. Calls made
 after the runtime is gone are dropped.
 */
public final class Callback: AnyArgument, Sendable {
  /**
   Owns the JavaScript function and releases it on the JavaScript thread, like the long-lived state
   of `JavaScriptPromise`.
   */
  @JavaScriptActor
  private final class LongLivedState: LongLivedObject {
    // A ref because `JavaScriptFunction` is non-copyable and `withValue` borrows it.
    let function = JavaScriptRef<JavaScriptFunction>()

    func allowRelease() {
      function.release()
    }
  }

  private let longLivedState: LongLivedState
  private weak let runtime: JavaScriptRuntime?
  private weak let appContext: AppContext?

  @JavaScriptActor
  private init(function: consuming JavaScriptFunction, runtime: JavaScriptRuntime, appContext: AppContext) {
    let longLivedState = LongLivedState()
    longLivedState.function.reset(function)
    runtime.longLivedObjects.add(longLivedState)

    self.longLivedState = longLivedState
    self.runtime = runtime
    self.appContext = appContext
  }

  @JavaScriptActor
  internal static func from(_ value: borrowing JavaScriptValue, runtime: JavaScriptRuntime, appContext: AppContext) throws -> Callback {
    guard value.kind == .function else {
      throw Conversions.CastingJSValueException<Callback>(value.kind)
    }
    return Callback(function: value.getFunction(), runtime: runtime, appContext: appContext)
  }

  deinit {
    guard let runtime else {
      return
    }
    // `longLivedObjects` is isolated to the JavaScript actor, so read it in the scheduled job.
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
    let unsafePairs = NonisolatedUnsafeVar(pairs)

    runtime?.schedule(priority: .immediate) { [weak runtime, weak appContext, longLivedState] in
      guard let runtime, let appContext else {
        return
      }
      do {
        let values = try unsafePairs.value.map { pair in
          try appContext.converter.toJS(pair.value, pair.dynamicType, in: runtime)
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
    return DynamicCallbackType.shared
  }
}

// MARK: - JavaScriptDecodable

extension Callback: JavaScriptDecodable {
  @JavaScriptActor
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Callback {
    guard let appContext = AppContext.from(runtime: runtime) else {
      throw Exceptions.AppContextNotFound()
    }
    return try Callback.from(value, runtime: copy runtime, appContext: appContext)
  }
}
