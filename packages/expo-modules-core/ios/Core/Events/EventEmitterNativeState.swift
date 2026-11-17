// Copyright 2026-present 650 Industries. All rights reserved.

@_spi(Internal) import ExpoModulesJSI
import os

/// Native state of a JS object that emits events. It keeps the event listeners of each runtime that has a JS object
/// with this native state: the JS objects of a shared object in all runtimes share one native state.
///
/// The listeners of the primary runtime, which is the main runtime for a shared object, are kept in a field that only
/// the thread of that runtime uses, so emitting there takes no lock. The listeners of the other runtimes are in a map
/// behind a lock, because the threads of all runtimes use it.
///
/// `@unchecked Sendable`: the listeners of a runtime are used only on the thread of that runtime, and the map of the
/// other runtimes is behind a lock.
internal class EventEmitterNativeState: JavaScriptNativeState, @unchecked Sendable {
  /// The runtime whose listeners are in `primaryListeners`.
  private let primaryRuntimeId: JavaScriptRuntime.ID?

  /// The listeners of the primary runtime. Used only on the thread of that runtime.
  @exclusivity(unchecked)
  private var primaryListeners: EventListeners?

  /// The listeners of the runtimes other than the primary runtime, by runtime ID.
  private let otherListeners = OSAllocatedUnfairLock<[JavaScriptRuntime.ID: EventListeners]>(uncheckedState: [:])

  /// Creates a native state with a plain `expo::NativeState`, for example for a JS object that isn't a shared object.
  internal init(primaryRuntimeId: JavaScriptRuntime.ID?) {
    self.primaryRuntimeId = primaryRuntimeId
    super.init()
  }

  /// Creates a native state whose C++ state `factory` makes. See `JavaScriptNativeState.init(factory:)`.
  internal init(primaryRuntimeId: JavaScriptRuntime.ID?, factory: @escaping Factory) {
    self.primaryRuntimeId = primaryRuntimeId
    super.init(factory: factory)
  }

  /// Returns the listeners of the given runtime, or `nil` when the runtime has no listeners. Call it on the thread of
  /// that runtime.
  internal func listeners(in runtime: borrowing JavaScriptRuntime) -> EventListeners? {
    let runtimeId = runtime.id
    if runtimeId == primaryRuntimeId {
      return primaryListeners
    }
    return otherListeners.withLockUnchecked { listeners in
      return listeners[runtimeId]
    }
  }

  /// Returns the listeners of the given runtime, and creates them when the runtime has none. Call it on the thread of
  /// that runtime.
  internal func listenersCreatingIfNeeded(in runtime: borrowing JavaScriptRuntime) -> EventListeners {
    let runtimeId = runtime.id
    if runtimeId == primaryRuntimeId {
      if let primaryListeners {
        return primaryListeners
      }
      let created = EventListeners()
      primaryListeners = created
      return created
    }
    return otherListeners.withLockUnchecked { listeners in
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
    if runtimeId == primaryRuntimeId {
      primaryListeners = nil
      return
    }
    // The removed listeners are released after the lock is unlocked.
    _ = otherListeners.withLockUnchecked { listeners in
      return listeners.removeValue(forKey: runtimeId)
    }
  }
}

/// The event listeners of one runtime. Used only on the thread of that runtime.
internal final class EventListeners {
  /// The listeners of each event that has any. An emitter usually has listeners of a few events, so a linear search
  /// is faster than hashing the event name.
  @exclusivity(unchecked)
  private var events = ContiguousArray<EventEntry>()

  private struct EventEntry {
    let name: String
    var listeners: ContiguousArray<JavaScriptEventListener>
  }

  private func index(of event: String) -> Int? {
    for index in events.indices where events[index].name == event {
      return index
    }
    return nil
  }

  /// Returns the number of listeners of the event.
  internal func count(of event: String) -> Int {
    guard let index = index(of: event) else {
      return 0
    }
    return events[index].listeners.count
  }

  /// Adds a listener of the event and returns the number of listeners of the event.
  internal func add(_ function: consuming JavaScriptValue, to event: String) -> Int {
    let listener = JavaScriptEventListener(function)
    guard let index = index(of: event) else {
      events.append(EventEntry(name: event, listeners: [listener]))
      return 1
    }
    events[index].listeners.append(listener)
    return events[index].listeners.count
  }

  /// Removes every copy of the listener of the event. Returns the number of listeners of the event before and after.
  internal func remove(_ function: borrowing JavaScriptValue, from event: String) -> (before: Int, after: Int) {
    guard let index = index(of: event) else {
      return (0, 0)
    }
    let before = events[index].listeners.count
    events[index].listeners.removeAll { listener in
      return listener.function == function
    }
    let after = events[index].listeners.count
    if after == 0 {
      events.remove(at: index)
    }
    return (before, after)
  }

  /// Removes all listeners of the event and returns how many it had.
  internal func removeAll(from event: String) -> Int {
    guard let index = index(of: event) else {
      return 0
    }
    return events.remove(at: index).listeners.count
  }

  /// Calls the listeners of the event with `this` and one argument, the payload.
  internal func call(
    _ event: String,
    this: borrowing JavaScriptObject,
    payload: borrowing JavaScriptValue,
    in runtime: JavaScriptRuntime
  ) {
    guard let index = index(of: event) else {
      return
    }
    let listeners = events[index].listeners
    payload.withUnsafePointee { payloadPointer in
      Self.call(listeners, this: this, argumentsPointer: payloadPointer, argumentCount: 1, in: runtime)
    }
  }

  /// Calls the listeners of the event with `this` and the arguments, `argumentCount` values of `facebook::jsi::Value`
  /// that `argumentsPointer` points to.
  internal func call(
    _ event: String,
    this: borrowing JavaScriptObject,
    argumentsPointer: UnsafeRawPointer?,
    argumentCount: Int,
    in runtime: JavaScriptRuntime
  ) {
    guard let index = index(of: event) else {
      return
    }
    Self.call(
      events[index].listeners,
      this: this,
      argumentsPointer: argumentsPointer,
      argumentCount: argumentCount,
      in: runtime
    )
  }

  /// Calls the listeners. `listeners` is a copy, so the listeners that the calls add or remove don't change it: a
  /// listener added during the emit isn't called, and a removed one is called one last time, as in Node.js. A listener
  /// that throws doesn't stop the others, and its error goes to the React Native error handler.
  private static func call(
    _ listeners: ContiguousArray<JavaScriptEventListener>,
    this: borrowing JavaScriptObject,
    argumentsPointer: UnsafeRawPointer?,
    argumentCount: Int,
    in runtime: JavaScriptRuntime
  ) {
    for listener in listeners {
      runtime.withUnsafePointees(
        object: this,
        value: listener.function
      ) { runtimePointer, thisPointer, functionPointer in
        callJSEventListener(
          runtimePointer: runtimePointer,
          listenerPointer: functionPointer,
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
