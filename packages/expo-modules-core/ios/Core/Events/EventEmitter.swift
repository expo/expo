// Copyright 2024-present 650 Industries. All rights reserved.

@_spi(Internal) import ExpoModulesJSI

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
  @inlinable
  func emit(event: String) {
    emit(event: event, payload: JavaScriptUndefined())
  }

  /**
   Schedules an event with the given name and a pre-converted JavaScript payload to be emitted
   to the associated JavaScript object. This is the lowest-level emit overload - use it when the
   value is already a `JavaScriptValue` to skip the native-to-JS conversion step.
   */
  func emit(event: String, payload: consuming JavaScriptValue) {
    guard let appContext, let runtime = try? appContext.runtime else {
      log.warn("Trying to send event '\(event)' to \(type(of: self)), but the JS runtime has been lost")
      return
    }
    // The payload is moved into a `JavaScriptRef` so the scheduled closure can capture it.
    let payload = payload.ref()
    // The emitter is not necessarily `Sendable` - some modules hold non-sendable state — so we can't let
    // the compiler send `self` into the `@JavaScriptActor` region. Wrapping it in a weak, `@unchecked
    // Sendable` reference is safe here because the scheduled closure only calls `withEventTarget`, which touches
    // `@JavaScriptActor`-isolated or `Sendable` state (the JS object, the registry, `appContext`) and the
    // emitter's identity - never the module's own mutable state.
    let emitter = WeakEventEmitterReference(value: self)

    runtime.schedule {
      guard let emitter = emitter.value else {
        return
      }
      // The event is dispatched once, so the payload can be moved out of the ref.
      guard let payload = payload.take() else {
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
  @inlinable
  func emit<P: JavaScriptEncodable>(event: String, payload: sending P) {
    // Inlinable, so `P` and the scheduled closure specialize in the caller's module. Unspecialized, the
    // payload is boxed and `P.encode` goes through the witness table on every event. The non-generic
    // parts are calls into this module.
    guard let runtime = eventRuntime(forEvent: event) else {
      return
    }
    // See the note in `emit(event:payload:)` above - the emitter is captured in a weak, `@unchecked
    // Sendable` reference because it isn't necessarily `Sendable`, and the scheduled closure only reaches
    // `@JavaScriptActor`-isolated or `Sendable` state through it.
    let emitter = WeakEventEmitterReference(value: self)

    runtime.schedule {
      guard let emitter = emitter.value else {
        return
      }
      let jsPayload: JavaScriptValue
      do {
        jsPayload = try P.encode(payload, in: runtime)
      } catch {
        warnPayloadNotEncoded(event: event, payloadType: P.self, error: error)
        return
      }
      dispatchEvent(event: event, payload: jsPayload, from: emitter, in: runtime)
    }
  }

  /// Schedules an event with the given name and payload to be emitted to the associated JavaScript object,
  /// converting the payload with `encode`, which writes it into a slot like
  /// `JavaScriptEncodable.encode(_:into:in:)`. The `@Event` macro uses it for payload types that can't
  /// conform to `JavaScriptEncodable`, such as tuples.
  @inlinable
  func emit<P>(
    event: String,
    payload: sending P,
    encode: @escaping @JavaScriptActor @Sendable (P, borrowing JavaScriptValue.Slot, borrowing JavaScriptRuntime) throws
      -> Void
  ) {
    guard let runtime = eventRuntime(forEvent: event) else {
      return
    }
    // See the note in `emit(event:payload:)` above.
    let emitter = WeakEventEmitterReference(value: self)

    runtime.schedule {
      guard let emitter = emitter.value else {
        return
      }
      let jsPayload: JavaScriptValue
      do {
        jsPayload = try JavaScriptValue.encoding(in: runtime) { slot in
          try encode(payload, slot, runtime)
        }
      } catch {
        warnPayloadNotEncoded(event: event, payloadType: P.self, error: error)
        return
      }
      dispatchEvent(event: event, payload: jsPayload, from: emitter, in: runtime)
    }
  }

  /**
   Schedules an event with the given name and payload to be emitted to the associated JavaScript object.
   Payloads that are `JavaScriptEncodable` use the `emit(event:payload:)` overload for them, which converts
   them statically.
   */
  @_disfavoredOverload
  func emit<P: AnyArgument>(event: String, payload: sending P) {
    guard let appContext, let runtime = try? appContext.runtime else {
      log.warn("Trying to send event '\(event)' to \(type(of: self)), but the JS runtime has been lost")
      return
    }
    // See the note in `emit(event:payload:)` above - the emitter is captured in a weak, `@unchecked
    // Sendable` reference because it isn't necessarily `Sendable`, and the scheduled closure only reaches
    // `@JavaScriptActor`-isolated or `Sendable` state through it.
    let emitter = WeakEventEmitterReference(value: self)

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

/// A weak reference to an event emitter that the scheduled `emit` closures capture by value, so it is stored
/// in the closure context without an allocation of its own. Frozen, because with library evolution the
/// inlinable initializer can't assign the stored property of a struct whose layout isn't fixed.
@frozen
@usableFromInline
internal struct WeakEventEmitterReference: @unchecked Sendable {
  @usableFromInline
  weak var value: (any EventEmitter)?

  @inlinable
  init(value: any EventEmitter) {
    self.value = value
  }
}

extension EventEmitter {
  /// The runtime to schedule an event on, or `nil` after logging a warning when it has been lost.
  @usableFromInline
  internal func eventRuntime(forEvent event: String) -> JavaScriptRuntime? {
    guard let appContext, let runtime = try? appContext.runtime else {
      log.warn("Trying to send event '\(event)' to \(type(of: self)), but the JS runtime has been lost")
      return nil
    }
    return runtime
  }
}

/// Logs that the payload of an event couldn't be converted, so the event is not emitted.
@usableFromInline
internal func warnPayloadNotEncoded(event: String, payloadType: Any.Type, error: any Error) {
  log.warn(
    "Failed to convert payload for event '\(event)' on \(payloadType); the event will not be emitted: \(error)"
  )
}

/// Sends a pre-converted event payload to the JavaScript object of the given emitter. Logs a warning
/// when the emitter is no longer associated with a JavaScript object.
@JavaScriptActor
@usableFromInline
internal func dispatchEvent(
  event: String,
  payload: borrowing JavaScriptValue,
  from emitter: any EventEmitter,
  in runtime: JavaScriptRuntime
) {
  let dispatched = emitter.withEventTarget { target in
    dispatchEvent(event: event, payload: payload, to: target, in: runtime)
    return true
  }
  if dispatched == nil {
    log.warn("Trying to send event '\(event)' to JS, but the JS object is no longer associated with the native instance")
  }
}

/**
 Sends a pre-converted event payload to the given JavaScript object via the JSI emitter helper.
 Must run on the JS thread; the public `emit` overloads schedule onto the runtime before calling in.
 */
@JavaScriptActor
internal func dispatchEvent(event: String, payload: borrowing JavaScriptValue, to target: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) {
  runtime.withUnsafePointees(object: target, value: payload) { runtimePtr, objectPtr, payloadPtr in
    event.withCString { eventName in
      emitJSEvent(
        utf8Name: eventName,
        runtimePointer: runtimePtr,
        objectPointer: objectPtr,
        argumentsPointer: payloadPtr,
        argumentCount: 1
      )
    }
  }
}
