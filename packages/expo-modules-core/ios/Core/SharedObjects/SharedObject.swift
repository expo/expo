// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

public protocol AnySharedObject: AnyArgument, AnyObject {
  var sharedObjectId: SharedObjectId { get }
}

extension AnySharedObject {
  public static func getDynamicType() -> AnyDynamicType {
    return DynamicSharedObjectType(innerType: Self.self)
  }
}

open class SharedObject: AnySharedObject, @unchecked Sendable {
  /**
   An identifier of the native shared object that maps to the JavaScript object.
   When the object is not linked with any JavaScript object, its value is 0.
   */
  public internal(set) var sharedObjectId: SharedObjectId = 0

  /**
   An app context for which the shared object was created.
   */
  public internal(set) weak var appContext: AppContext?

  /**
   The default public initializer of the shared object.
   */
  public init() {}

  /**
   A function that will be called before the object is removed from the registry.
   */
  open func sharedObjectWillRelease() {}

  /**
   A function that will be called after the object is removed from the registry.
   */
  open func sharedObjectDidRelease() {}

  /**
   Override this function to inform the JavaScript runtime that there is additional
   memory associated with a given JavaScript object that is not visible to the GC.
   This can be used if an object is known to exclusively retain some native memory,
   and may be used to guide decisions about when to run garbage collection.
   */
  open func getAdditionalMemoryPressure() -> Int {
    // The memory pressure is `0` by default. We can potentially use `class_getInstanceSize`,
    // but it only returns a size of the type which is usually relatively small
    // as it does not include virtual allocations such as binary data and images.
    // Thus, it makes more sense to just skip setting the pressure and make it opt-in.
    return 0
  }

  /**
   Returns the JavaScript value associated with the native shared object.
   */
  public func getJavaScriptValue() -> JavaScriptValue? {
    return appContext?.sharedObjectRegistry.toJavaScriptValue(self)
  }

  /**
   Returns the JavaScript shared object associated with the native shared object.
   */
  public func getJavaScriptObject() -> JavaScriptObject? {
    return appContext?.sharedObjectRegistry.toJavaScriptObject(self)
  }

  /**
   Schedules an event with the given name and a pre-converted JavaScript payload to be emitted
   to the associated JavaScript object. This is the lowest-level emit overload — use it when the
   value is already a `JavaScriptValue` to skip the native-to-JS conversion step.
   */
  public func emit(event: String, payload: JavaScriptValue) {
    guard let appContext, let runtime = try? appContext.runtime else {
      log.warn("Trying to send event '\(event)' to \(type(of: self)), but the JS runtime has been lost")
      return
    }
    guard let jsValue = getJavaScriptValue() else {
      log.warn("Trying to send event '\(event)' to JS, but the JS object is no longer associated with the native instance")
      return
    }
    runtime.schedule {
      dispatch(event: event, payload: payload, to: jsValue, in: runtime)
    }
  }

  /**
   Schedules an event with the given name to be emitted to the associated JavaScript object.
   */
  public func emit(event: String) {
    emit(event: event, payload: .undefined)
  }

  /**
   Schedules an event with the given name and payload to be emitted to the associated JavaScript object.
   */
  public func emit<P: AnyArgument>(event: String, payload: sending P) {
    guard let appContext, let runtime = try? appContext.runtime else {
      log.warn("Trying to send event '\(event)' to \(type(of: self)), but the JS runtime has been lost")
      return
    }
    guard let jsValue = getJavaScriptValue() else {
      log.warn("Trying to send event '\(event)' to JS, but the JS object is no longer associated with the native instance")
      return
    }
    runtime.schedule { [weak appContext] in
      guard let appContext else {
        return
      }
      do {
        let jsPayload = try (~P.self).castToJS(payload, appContext: appContext, in: runtime)
        dispatch(event: event, payload: jsPayload, to: jsValue, in: runtime)
      } catch {
        log.warn("Failed to convert payload for event '\(event)' on \(P.self); the event will not be emitted: \(error)")
        return
      }
    }
  }

  /**
   Backwards-compatible overload that forwards to `emit(event:payload:)`. Existing single-argument
   call sites keep working unchanged; the parameter has been renamed to `payload` to make the
   single-payload semantics explicit, so callers should migrate the label.
   */
  @available(*, deprecated, renamed: "emit(event:payload:)", message: "Use `emit(event:payload:)` and pass a single value (typically a dictionary). Multi-argument event emission is no longer supported.")
  public func emit<P: AnyArgument>(event: String, arguments: sending P) {
    emit(event: event, payload: arguments)
  }
}

/**
 Sends a pre-converted event payload to the given JavaScript object via the JSI emitter helper.
 Must run on the JS thread; the public `emit` overloads schedule onto the runtime before calling in.
 */
@JavaScriptActor
private func dispatch(event: String, payload: JavaScriptValue, to value: JavaScriptValue, in runtime: JavaScriptRuntime) {
  runtime.withUnsafePointee { runtimePtr in
    value.withUnsafePointee { objectPtr in
      payload.withUnsafePointee { payloadPtr in
        JSUtils.emitEvent(
          event,
          runtimePointer: runtimePtr,
          objectPointer: objectPtr,
          argumentsPointer: payloadPtr,
          argumentCount: 1
        )
      }
    }
  }
}
