// Copyright 2026-present 650 Industries. All rights reserved.

@_spi(Internal) import ExpoModulesJSI
import os

/// Native state of a JS object that emits events. It keeps the event listeners of each runtime that has a JS object
/// with this native state: the JS objects of a shared object in all runtimes share one native state.
///
/// `@unchecked Sendable`: the map of runtimes is behind a lock, because the threads of all runtimes use it. The
/// listeners of a runtime are used only on the thread of that runtime.
internal class EventEmitterNativeState: JavaScriptNativeState, @unchecked Sendable {
  private let runtimeListeners = OSAllocatedUnfairLock<[JavaScriptRuntime.ID: EventListeners]>(uncheckedState: [:])

  /// Returns the listeners of the given runtime, or `nil` when the runtime has no listeners.
  @JavaScriptActor
  internal func listeners(in runtime: borrowing JavaScriptRuntime) -> EventListeners? {
    let runtimeId = runtime.id
    return runtimeListeners.withLockUnchecked { listeners in
      return listeners[runtimeId]
    }
  }

  /// Returns the listeners of the given runtime, and creates them when the runtime has none.
  @JavaScriptActor
  internal func listenersCreatingIfNeeded(in runtime: borrowing JavaScriptRuntime) -> EventListeners {
    let runtimeId = runtime.id
    return runtimeListeners.withLockUnchecked { listeners in
      if let existing = listeners[runtimeId] {
        return existing
      }
      let created = EventListeners()
      listeners[runtimeId] = created
      return created
    }
  }

  /// Removes all listeners of the runtime with the given ID, without calling the observing functions. Call it on the
  /// thread of that runtime, or while the runtime is destroyed, because it releases the listener functions.
  internal func removeListeners(inRuntime runtimeId: JavaScriptRuntime.ID) {
    // The removed listeners are released after the lock is unlocked.
    _ = runtimeListeners.withLockUnchecked { listeners in
      return listeners.removeValue(forKey: runtimeId)
    }
  }
}

/// The event listeners of one runtime, by event name. Used only on the thread of that runtime.
internal final class EventListeners {
  private var listenersByEvent = [String: ContiguousArray<JavaScriptEventListener>]()

  /// Returns the number of listeners of the event.
  internal func count(of event: String) -> Int {
    return listenersByEvent[event]?.count ?? 0
  }

  /// Adds a listener of the event and returns the number of listeners of the event.
  internal func add(_ function: consuming JavaScriptValue, to event: String) -> Int {
    let listener = JavaScriptEventListener(function)
    return Self.append(listener, to: &listenersByEvent[event, default: []])
  }

  private static func append(
    _ listener: JavaScriptEventListener,
    to listeners: inout ContiguousArray<JavaScriptEventListener>
  ) -> Int {
    listeners.append(listener)
    return listeners.count
  }

  /// Removes every copy of the listener of the event. Returns the number of listeners of the event before and after.
  internal func remove(_ function: borrowing JavaScriptValue, from event: String) -> (before: Int, after: Int) {
    guard let before = listenersByEvent[event]?.count else {
      return (0, 0)
    }
    listenersByEvent[event]?.removeAll { listener in
      return listener.function == function
    }
    let after = listenersByEvent[event]?.count ?? 0
    if after == 0 {
      listenersByEvent[event] = nil
    }
    return (before, after)
  }

  /// Removes all listeners of the event and returns how many it had.
  internal func removeAll(from event: String) -> Int {
    return listenersByEvent.removeValue(forKey: event)?.count ?? 0
  }

  /// Calls the listeners of the event with `this` and one argument, the payload.
  @JavaScriptActor
  internal func call(
    _ event: String,
    this: borrowing JavaScriptObject,
    payload: borrowing JavaScriptValue,
    in runtime: JavaScriptRuntime
  ) {
    guard let listeners = listenersByEvent[event] else {
      return
    }
    payload.withUnsafePointee { payloadPointer in
      Self.call(listeners, this: this, argumentsPointer: payloadPointer, argumentCount: 1, in: runtime)
    }
  }

  /// Calls the listeners of the event with `this` and the arguments, `argumentCount` values of `facebook::jsi::Value`
  /// that `argumentsPointer` points to.
  @JavaScriptActor
  internal func call(
    _ event: String,
    this: borrowing JavaScriptObject,
    argumentsPointer: UnsafeRawPointer?,
    argumentCount: Int,
    in runtime: JavaScriptRuntime
  ) {
    guard let listeners = listenersByEvent[event] else {
      return
    }
    Self.call(listeners, this: this, argumentsPointer: argumentsPointer, argumentCount: argumentCount, in: runtime)
  }

  /// Calls the listeners. `listeners` is a copy, so the listeners that the calls add or remove don't change it: a
  /// listener added during the emit isn't called, and a removed one is called one last time, as in Node.js. A listener
  /// that throws doesn't stop the others, and its error goes to the React Native error handler.
  @JavaScriptActor
  private static func call(
    _ listeners: ContiguousArray<JavaScriptEventListener>,
    this: borrowing JavaScriptObject,
    argumentsPointer: UnsafeRawPointer?,
    argumentCount: Int,
    in runtime: JavaScriptRuntime
  ) {
    for listener in listeners {
      runtime.withUnsafePointees(object: this, value: listener.function) { runtimePointer, thisPointer, listenerPointer in
        callJSEventListener(
          runtimePointer: runtimePointer,
          listenerPointer: listenerPointer,
          thisPointer: thisPointer,
          argumentsPointer: argumentsPointer,
          argumentCount: argumentCount
        )
      }
    }
  }
}

/// A listener function. A class, so arrays of listeners can be copied.
internal final class JavaScriptEventListener {
  internal let function: JavaScriptValue

  internal init(_ function: consuming JavaScriptValue) {
    self.function = function
  }
}
