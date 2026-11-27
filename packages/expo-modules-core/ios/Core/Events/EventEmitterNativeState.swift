// Copyright 2026-present 650 Industries. All rights reserved.

@_spi(Internal) import ExpoModulesJSI

/// Native state of a JS object that emits events. It keeps the event listeners of its primary runtime, the runtime of
/// the JS object, in a field that only the thread of that runtime uses, so emitting there takes no lock.
///
/// A JS object of `expo.EventEmitter` gets one when JS adds its first listener. A module object gets a subclass when
/// it is built, and a shared object gets a subclass when it is paired. The JS objects of a shared object in all
/// runtimes share one native state. It has no primary runtime, and the subclass keeps the listeners of every runtime
/// (see `listeners(inOtherRuntime:creatingIfNeeded:)`).
///
/// `@unchecked Sendable`: the listeners of a runtime are used only on the thread of that runtime.
internal class EventEmitterNativeState: JavaScriptNativeState, @unchecked Sendable {
  /// The runtime whose listeners are in `primaryListeners`.
  private let primaryRuntimeId: JavaScriptRuntime.ID?

  /// The listeners of the primary runtime. Used only on the thread of that runtime.
  @exclusivity(unchecked)
  private var primaryListeners: EventListeners?

  /// Creates a native state with a plain C++ state, for a JS object in the given runtime.
  internal init(primaryRuntimeId: JavaScriptRuntime.ID?) {
    self.primaryRuntimeId = primaryRuntimeId
    super.init()
  }

  /// Returns the listeners of the given runtime, or `nil` when the runtime has no listeners. Call it on the thread of
  /// that runtime.
  @JavaScriptActor
  internal final func listeners(in runtime: JavaScriptRuntime) -> EventListeners? {
    if let primaryRuntimeId, runtime.id == primaryRuntimeId {
      return primaryListeners
    }
    return listeners(inOtherRuntime: runtime, creatingIfNeeded: false)
  }

  /// Returns the listeners of the given runtime, and creates them when the runtime has none. Returns `nil` when the
  /// runtime can't have listeners. Call it on the thread of that runtime.
  @JavaScriptActor
  internal final func listenersCreatingIfNeeded(in runtime: JavaScriptRuntime) -> EventListeners? {
    if let primaryRuntimeId, runtime.id == primaryRuntimeId {
      if let primaryListeners {
        return primaryListeners
      }
      let created = EventListeners(in: runtime)
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

  /// Called after `emitter`, a JS object in `runtime`, got the first listener of the event (`isListening` is `true`),
  /// or lost the last one. `eventValue` is the event name as a JS string. It calls the observing functions of the JS
  /// object, when it has them. A getter or an observing function can throw, so they run in C++, which catches the
  /// error, and this method rethrows it.
  @JavaScriptActor
  internal func listeningDidChange(
    _ emitter: borrowing JavaScriptObject,
    event: String,
    eventValue: borrowing JavaScriptUnownedValue,
    isListening: Bool,
    in runtime: JavaScriptRuntime
  ) throws {
    let names = EventEmitterPropNames.of(runtime)
    let listeningName = isListening ? names.startListening : names.stopListening
    let observingName = isListening ? names.startObserving : names.stopObserving
    let errorPointer = runtime.withUnsafePointee { runtimePointer in
      return emitter.withUnsafePointee { objectPointer in
        return listeningName.withUnsafePointee { listeningNamePointer in
          return observingName.withUnsafePointee { observingNamePointer in
            return eventValue.withUnsafePointee { eventPointer in
              return callObservingFunctions(
                runtimePointer: runtimePointer,
                objectPointer: objectPointer,
                firstNamePointer: listeningNamePointer,
                secondNamePointer: observingNamePointer,
                eventPointer: eventPointer
              )
            }
          }
        }
      }
    }
    try throwJSError(caughtAt: errorPointer, in: runtime)
  }

  /// Removes all listeners of the primary runtime, without calling the observing functions. Call it on the thread of
  /// that runtime, or while the runtime is destroyed, because it releases the listener functions.
  internal func removePrimaryListeners() {
    primaryListeners = nil
  }
}

/// The property names that the event emitter reads, made once for each runtime.
internal final class EventEmitterPropNames {
  let startListening: JavaScriptPropNameID
  let stopListening: JavaScriptPropNameID
  let startObserving: JavaScriptPropNameID
  let stopObserving: JavaScriptPropNameID
  let constructor: JavaScriptPropNameID

  private init(_ runtime: borrowing JavaScriptRuntime) {
    startListening = JavaScriptPropNameID(runtime, string: "__expo_onStartListeningToEvent")
    stopListening = JavaScriptPropNameID(runtime, string: "__expo_onStopListeningToEvent")
    startObserving = JavaScriptPropNameID(runtime, string: "startObserving")
    stopObserving = JavaScriptPropNameID(runtime, string: "stopObserving")
    constructor = JavaScriptPropNameID(runtime, string: "constructor")
  }

  private static let cacheKey = JavaScriptRuntime.Cache.Key<EventEmitterPropNames>()

  /// Returns the names of the runtime, and makes them on the first call.
  @JavaScriptActor
  static func of(_ runtime: JavaScriptRuntime) -> EventEmitterPropNames {
    return runtime.cached(cacheKey) {
      return EventEmitterPropNames(runtime)
    }
  }
}

/// Throws the value that an `EXJSUtils` function caught, as a `JavaScriptError` that rethrows the value unchanged to
/// JS, and destroys the value. Does nothing when the pointer is `nil`.
@JavaScriptActor
internal func throwJSError(caughtAt errorPointer: UnsafeMutableRawPointer?, in runtime: JavaScriptRuntime) throws {
  guard let errorPointer else {
    return
  }
  defer {
    destroyJSValue(errorPointer)
  }
  let value = JavaScriptUnownedValue(runtime, unsafeValuePointer: UnsafeRawPointer(errorPointer)).copied(in: runtime)
  throw JavaScriptError(runtime, value: value)
}

/// The event listeners of one runtime. Used only on the thread of that runtime.
internal final class EventListeners {
  /// The `facebook::jsi::Runtime` of the listeners. The listeners are used only while their runtime exists.
  private let runtimePointer: UnsafeMutableRawPointer

  /// The listeners of each event that has any. An emitter usually has listeners of a few events, so a linear search
  /// is faster than hashing the event name.
  @exclusivity(unchecked)
  private var events = ContiguousArray<EventEntry>()

  internal init(in runtime: JavaScriptRuntime) {
    runtimePointer = runtime.withUnsafePointee { $0 }
  }

  /// An event that has listeners. A class, because the JS name isn't copyable.
  private final class EventEntry {
    let name: String

    /// The name as a JS string of the runtime of the listeners, from the `addListener` call that added the event. The
    /// JS methods find the event by it, so they don't decode the name that they get.
    let jsName: JavaScriptValue

    @exclusivity(unchecked)
    var listeners: ContiguousArray<JavaScriptEventListener>

    init(name: String, jsName: consuming JavaScriptValue, listener: JavaScriptEventListener) {
      self.name = name
      self.jsName = jsName
      self.listeners = [listener]
    }
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

  /// Finds the entry of the event whose JS name is strictly equal to `event`, a JS string of the runtime of the
  /// listeners. The engine compares the strings, usually by pointer, because it interns string literals.
  private func index(of event: borrowing JavaScriptUnownedValue) -> Int? {
    return events.withUnsafeBufferPointer { entries in
      for index in entries.indices where event.isEqual(to: entries[index].jsName) {
        return index
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

  /// Returns the number of listeners of the event, a JS string.
  internal func count(of event: borrowing JavaScriptUnownedValue) -> Int {
    guard let index = index(of: event) else {
      return 0
    }
    return events[index].listeners.count
  }

  /// Adds a listener of the event, a JS string. `functionPointer` points to the `facebook::jsi::Value` of the listener
  /// function. Returns the name of the event when it is its first listener.
  internal func add(
    functionAt functionPointer: UnsafeRawPointer,
    to event: borrowing JavaScriptUnownedValue,
    in runtime: JavaScriptRuntime
  ) throws -> String? {
    let listener = JavaScriptEventListener(functionAt: functionPointer, runtimePointer: runtimePointer)
    guard let index = index(of: event) else {
      let name = try event.asString()
      events.append(EventEntry(name: name, jsName: event.copied(in: runtime), listener: listener))
      return name
    }
    events[index].listeners.append(listener)
    return nil
  }

  /// Removes every copy of the listener of the event, a JS string. `functionPointer` points to the
  /// `facebook::jsi::Value` of the listener function. Returns the name of the event when it removed its last listener.
  internal func remove(functionAt functionPointer: UnsafeRawPointer, from event: borrowing JavaScriptUnownedValue)
    -> String?
  {
    guard let index = index(of: event) else {
      return nil
    }
    let entry = events[index]
    entry.listeners.removeAll { listener in
      return isJSEventListenerFunction(
        runtimePointer: runtimePointer,
        listenerPointer: listener.pointer,
        valuePointer: functionPointer
      )
    }
    guard entry.listeners.isEmpty else {
      return nil
    }
    events.remove(at: index)
    return entry.name
  }

  /// Removes all listeners of the event, a JS string. Returns the name of the event when it had listeners.
  internal func removeAll(from event: borrowing JavaScriptUnownedValue) -> String? {
    guard let index = index(of: event) else {
      return nil
    }
    return events.remove(at: index).name
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

  /// Calls the listeners of the event, a JS string, with `this` and the arguments, `argumentCount` values of
  /// `facebook::jsi::Value` that `argumentsPointer` points to. `thisValuePointer` points to the `facebook::jsi::Value`
  /// of `this`. Like `call(_:this:payload:in:)`, it calls the listeners that the event has before the first call.
  internal func call(
    _ event: borrowing JavaScriptUnownedValue,
    thisValuePointer: UnsafeRawPointer,
    argumentsPointer: UnsafeRawPointer?,
    argumentCount: Int
  ) {
    guard let index = index(of: event) else {
      return
    }
    for listener in events[index].listeners {
      callJSEventListener(
        runtimePointer: runtimePointer,
        listenerPointer: listener.pointer,
        thisValuePointer: thisValuePointer,
        argumentsPointer: argumentsPointer,
        argumentCount: argumentCount
      )
    }
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
    runtime.withUnsafePointee { runtimePointer in
      this.withUnsafePointee { thisPointer in
        for listener in listeners {
          callJSEventListener(
            runtimePointer: runtimePointer,
            listenerPointer: listener.pointer,
            thisPointer: thisPointer,
            argumentsPointer: argumentsPointer,
            argumentCount: argumentCount
          )
        }
      }
    }
  }
}

/// A listener function, kept as a `facebook::jsi::Function` that the C++ helpers call without a copy. A class, so
/// arrays of listeners can be copied.
internal final class JavaScriptEventListener {
  /// The `facebook::jsi::Function` of the listener.
  internal let pointer: UnsafeMutableRawPointer

  /// Creates a listener of the function that `functionPointer`, a pointer to a `facebook::jsi::Value`, points to.
  internal init(functionAt functionPointer: UnsafeRawPointer, runtimePointer: UnsafeMutableRawPointer) {
    pointer = createJSEventListener(runtimePointer: runtimePointer, functionPointer: functionPointer)
  }

  // Like a `JavaScriptValue`, a listener must be released while its runtime exists.
  deinit {
    destroyJSEventListener(pointer)
  }
}
