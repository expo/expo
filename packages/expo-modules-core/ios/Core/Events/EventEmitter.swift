// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A protocol for native objects that have an associated JavaScript object capable of receiving events.
 Conformers only need to provide the JavaScript object to send events to - the `emit` overloads that
 schedule onto the runtime, convert payloads and dispatch to JS are provided by the extension below.
 */
public protocol EventEmitter: AnyObject {
  /**
   An app context for which the emitter was created.
   */
  var appContext: AppContext? { get }

  /**
   Lends the JavaScript object the events should be emitted to for the duration of `body`. Called on
   the JS thread right before dispatching, so it reflects the object's current association with the JS
   runtime. Returns `nil` without invoking `body` when the emitter is not associated with a JS object -
   the object is non-copyable, so it can only be borrowed, never handed out.
   */
  @JavaScriptActor
  func withEventTarget<R>(_ body: (borrowing JavaScriptObject) throws -> R) rethrows -> R?
}

public extension EventEmitter {
  /**
   Schedules an event with the given name to be emitted to the associated JavaScript object.
   */
  func emit(event: String) {
    emit(event: event, payload: JavaScriptValue.undefined)
  }

  /**
   Schedules an event with the given name and a pre-converted JavaScript payload to be emitted
   to the associated JavaScript object. This is the lowest-level emit overload - use it when the
   value is already a `JavaScriptValue` to skip the native-to-JS conversion step.
   */
  func emit(event: String, payload: JavaScriptValue) {
    guard let appContext, let runtime = try? appContext.runtime else {
      log.warn("Trying to send event '\(event)' to \(type(of: self)), but the JS runtime has been lost")
      return
    }
    // The emitter is not necessarily `Sendable` - some modules hold non-sendable state — so we can't let
    // the compiler send `self` into the `@JavaScriptActor` region. Wrapping it in a weak, `@unchecked
    // Sendable` box is safe here because the scheduled closure only calls `withEventTarget`, which touches
    // `@JavaScriptActor`-isolated or `Sendable` state (the JS object, the registry, `appContext`) and the
    // emitter's identity - never the module's own mutable state.
    let emitter = NonisolatedUnsafeWeakVar(self)

    runtime.schedule {
      guard let emitter = emitter.value else {
        return
      }
      let dispatched = emitter.withEventTarget { target in
        dispatchEvent(event: event, payload: payload, to: target, in: runtime)
        return true
      }
      if dispatched == nil {
        log.warn("Trying to send event '\(event)' to JS, but the JS object is no longer associated with the native instance")
      }
    }
  }

  /**
   Schedules an event with the given name and payload to be emitted to the associated JavaScript object.
   */
  func emit<P: AnyArgument>(event: String, payload: sending P) {
    guard let appContext, let runtime = try? appContext.runtime else {
      log.warn("Trying to send event '\(event)' to \(type(of: self)), but the JS runtime has been lost")
      return
    }
    // See the note in `emit(event:payload:)` above - the emitter is captured in a weak, `@unchecked
    // Sendable` box because it isn't necessarily `Sendable`, and the scheduled closure only reaches
    // `@JavaScriptActor`-isolated or `Sendable` state through it.
    let emitter = NonisolatedUnsafeWeakVar(self)

    runtime.schedule { [weak appContext] in
      guard let emitter = emitter.value, let appContext else {
        return
      }
      let jsPayload: JavaScriptValue
      do {
        jsPayload = try (~P.self).castToJS(payload, appContext: appContext, in: runtime)
      } catch {
        log.warn("Failed to convert payload for event '\(event)' on \(P.self); the event will not be emitted: \(error)")
        return
      }
      let dispatched = emitter.withEventTarget { target in
        dispatchEvent(event: event, payload: jsPayload, to: target, in: runtime)
        return true
      }
      if dispatched == nil {
        log.warn("Trying to send event '\(event)' to JS, but the JS object is no longer associated with the native instance")
      }
    }
  }
}

/**
 Sends a pre-converted event payload to the given JavaScript object via the JSI emitter helper.
 Must run on the JS thread; the public `emit` overloads schedule onto the runtime before calling in.
 */
@JavaScriptActor
internal func dispatchEvent(event: String, payload: JavaScriptValue, to target: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) {
  runtime.withUnsafePointee { runtimePtr in
    target.withUnsafePointee { objectPtr in
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
