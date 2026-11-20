// Copyright 2026-present 650 Industries. All rights reserved.

@_spi(Internal) import ExpoModulesJSI

/// Native state of a JS object that emits events. It keeps the event listeners of its primary runtime, the runtime of
/// the JS object, in a field that only the thread of that runtime uses, so emitting there takes no lock.
///
/// The JS objects of a shared object in all runtimes share one native state. Its primary runtime is the main runtime,
/// and a subclass keeps the listeners of the other runtimes (see `listeners(inOtherRuntime:creatingIfNeeded:)`).
///
/// `@unchecked Sendable`: the listeners of a runtime are used only on the thread of that runtime.
internal class EventEmitterNativeState: JavaScriptNativeState, @unchecked Sendable {
  /// The runtime whose listeners are in `primaryListeners`.
  private let primaryRuntimeId: JavaScriptRuntime.ID?

  /// The listeners of the primary runtime. Used only on the thread of that runtime.
  @exclusivity(unchecked)
  private var primaryListeners: EventListeners?

  /// Creates a native state whose C++ state `factory` makes. See `JavaScriptNativeState.init(factory:)`.
  internal init(primaryRuntimeId: JavaScriptRuntime.ID?, factory: @escaping Factory) {
    self.primaryRuntimeId = primaryRuntimeId
    super.init(factory: factory)
  }

  /// Returns the listeners of the given runtime, or `nil` when the runtime has no listeners. Call it on the thread of
  /// that runtime.
  @JavaScriptActor
  internal final func listeners(in runtime: JavaScriptRuntime) -> EventListeners? {
    if runtime.id == primaryRuntimeId {
      return primaryListeners
    }
    return listeners(inOtherRuntime: runtime, creatingIfNeeded: false)
  }

  /// Returns the listeners of the given runtime, and creates them when the runtime has none. Returns `nil` when the
  /// runtime can't have listeners. Call it on the thread of that runtime.
  @JavaScriptActor
  internal final func listenersCreatingIfNeeded(in runtime: JavaScriptRuntime) -> EventListeners? {
    if runtime.id == primaryRuntimeId {
      if let primaryListeners {
        return primaryListeners
      }
      let created = EventListeners()
      primaryListeners = created
      return created
    }
    return listeners(inOtherRuntime: runtime, creatingIfNeeded: true)
  }

  /// Returns the listeners of a runtime other than the primary runtime. This class keeps no listeners of other runtimes,
  /// so it returns `nil`.
  @JavaScriptActor
  internal func listeners(inOtherRuntime runtime: JavaScriptRuntime, creatingIfNeeded: Bool) -> EventListeners? {
    return nil
  }

  /// Called after the runtime got its first listener of any event (`hasListeners` is `true`), or lost its last one.
  @JavaScriptActor
  internal func listenersDidChange(in runtime: JavaScriptRuntime, hasListeners: Bool) {}

  /// Removes all listeners of the primary runtime, without calling the observing functions. Call it on the thread of
  /// that runtime, or while the runtime is destroyed, because it releases the listener functions.
  internal func removePrimaryListeners() {
    primaryListeners = nil
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

  /// Finds the entry of the event. It compares the UTF-8 bytes of the names, like JavaScript compares strings. Swift
  /// `==` treats canonically equivalent strings as equal, so it would merge `"\u{E9}"` and `"e\u{301}"` into one event.
  private func index(of event: String) -> Int? {
    var event = event
    return event.withUTF8 { eventBytes in
      for index in events.indices {
        // A copy of a short string, which Swift stores inline, takes no reference counting.
        var name = events[index].name
        let isEqual = name.withUTF8 { nameBytes in
          return nameBytes.elementsEqual(eventBytes)
        }
        if isEqual {
          return index
        }
      }
      return nil
    }
  }

  /// Returns the listeners of the event, or `nil` when it has none. The array is a copy, so the listeners that calls
  /// add or remove don't change it.
  internal func listeners(of event: String) -> ContiguousArray<JavaScriptEventListener>? {
    guard let index = index(of: event) else {
      return nil
    }
    return events[index].listeners
  }

  /// Whether there are no listeners of any event. An event without listeners has no entry.
  internal var isEmpty: Bool {
    return events.isEmpty
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

  /// Calls the listeners, which `listeners(of:)` returned, with `this` and one argument, the payload.
  internal static func call(
    _ listeners: ContiguousArray<JavaScriptEventListener>,
    this: borrowing JavaScriptObject,
    payload: borrowing JavaScriptValue,
    in runtime: JavaScriptRuntime
  ) {
    payload.withUnsafePointee { payloadPointer in
      call(listeners, this: this, argumentsPointer: payloadPointer, argumentCount: 1, in: runtime)
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
