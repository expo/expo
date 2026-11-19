// Copyright 2026-present 650 Industries. All rights reserved.

@_spi(Internal) import ExpoModulesJSI

/// The `expo.EventEmitter` class, the base class of modules and shared objects, and its methods: `addListener`,
/// `removeListener`, `removeAllListeners`, `emit`, `listenerCount` and `removeSubscription`. An
/// `EventEmitterNativeState` keeps the listeners. `addListener` attaches a plain one to an object without a native
/// state. The methods ignore an object with another native state: it has no listeners, and `listenerCount` returns 0.
internal enum EventEmitterMethods {
  /// Installs the class as `EventEmitter` on the core object, `global.expo`.
  @JavaScriptActor
  static func installClass(on coreObject: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {
    let eventEmitterClass = try runtime.createClass(name: "EventEmitter") { this, arguments in
      // The old event emitter wrapped the native module that its constructor got. A module is an event emitter now,
      // so the constructor returns an event emitter that it gets.
      if arguments.count > 0 && arguments[0].isObject() {
        let constructor = try this.asObject().getProperty("constructor")
        if constructor.isFunction() && arguments[0].getObject().instanceOf(constructor) {
          return arguments[0]
        }
      }
      return this
    }
    try install(on: eventEmitterClass.asObject().getPropertyAsObject("prototype"), in: runtime)
    coreObject.setProperty("EventEmitter", value: eventEmitterClass.asValue())
  }

  /// Defines the methods on the prototype.
  @JavaScriptActor
  private static func install(on prototype: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {
    prototype.setProperty("addListener", value: try createAddListener(in: runtime))
    prototype.setProperty("removeListener", value: runtime.createFunction("removeListener", removeListener).asValue())
    prototype.setProperty(
      "removeAllListeners",
      value: runtime.createFunction("removeAllListeners", removeAllListeners).asValue()
    )
    prototype.setProperty("emit", value: runtime.createFunction("emit", emit).asValue())
    prototype.setProperty("listenerCount", value: runtime.createFunction("listenerCount", listenerCount).asValue())
    prototype.setProperty(
      "removeSubscription",
      value: runtime.createFunction("removeSubscription", removeSubscription).asValue()
    )
  }

  /// Creates `addListener`. It is a JS function, so the subscription that it returns keeps the emitter and the
  /// listener in a JS closure, which the garbage collector can collect even when the listener references the
  /// subscription. Values that a host function captures are roots that the garbage collector can't collect. `remove()`
  /// clears them before it removes the listener, so a second call does nothing, also when an observing function throws.
  @JavaScriptActor
  private static func createAddListener(in runtime: JavaScriptRuntime) throws -> JavaScriptValue {
    let source = """
      (function (nativeAddListener, nativeRemoveListener) {
        return {
          addListener(eventName, listener) {
            nativeAddListener(this, eventName, listener);
            let emitter = this;
            return {
              remove() {
                if (emitter === undefined) {
                  return;
                }
                const removedEmitter = emitter;
                const removedListener = listener;
                emitter = undefined;
                listener = undefined;
                nativeRemoveListener(removedEmitter, eventName, removedListener);
              },
            };
          },
        }.addListener;
      })
      """
    let label = "expo-modules-core/event-emitter-add-listener.js"
    let makeAddListener = try runtime.eval(label: label, source).asFunction()
    let arguments = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 2)
    arguments.emplace(runtime.createFunction("addListener", nativeAddListener).asValue(), at: 0)
    arguments.emplace(runtime.createFunction("removeListener", nativeRemoveListener).asValue(), at: 1)
    return try makeAddListener.call(arguments: arguments)
  }

  // MARK: - Host functions

  /// `nativeAddListener(emitter, eventName, listener)`, which `addListener` calls.
  @JavaScriptActor
  private static func nativeAddListener(
    this _: borrowing JavaScriptUnownedValue,
    arguments: consuming JavaScriptValuesBuffer,
    result _: borrowing JavaScriptValue.Slot,
    runtime: borrowing JavaScriptRuntime
  ) throws {
    let emitter = try arguments.unownedValue(at: 0).asObject(in: runtime)
    let event = try arguments.unownedValue(at: 1).asString()
    let listener = arguments[2]
    guard listener.isFunction() else {
      throw InvalidListenerException(event)
    }
    guard
      let nativeState = nativeStateCreatingIfNeeded(of: emitter, in: runtime),
      let listeners = nativeState.listenersCreatingIfNeeded(in: runtime)
    else {
      return
    }
    let hadListeners = !listeners.isEmpty
    let count = listeners.add(listener, to: event)
    if !hadListeners {
      nativeState.listenersDidChange(in: runtime, hasListeners: true)
    }
    if count == 1 {
      try nativeState.listeningDidChange(emitter, event: event, isListening: true, in: runtime)
    }
  }

  /// Returns the native state of the emitter. Attaches a plain one when the emitter has no native state, for example
  /// an object of `expo.EventEmitter` or a module object in a runtime other than the main runtime. Returns `nil` when
  /// the emitter has another native state.
  @JavaScriptActor
  private static func nativeStateCreatingIfNeeded(
    of emitter: borrowing JavaScriptObject,
    in runtime: JavaScriptRuntime
  ) -> EventEmitterNativeState? {
    if let nativeState = emitter.getNativeState(as: EventEmitterNativeState.self) {
      return nativeState
    }
    guard !emitter.hasNativeState() else {
      return nil
    }
    let nativeState = EventEmitterNativeState(primaryRuntimeId: runtime.id)
    emitter.setNativeState(nativeState)
    return nativeState
  }

  /// `nativeRemoveListener(emitter, eventName, listener)`, which the `remove()` method of a subscription calls.
  @JavaScriptActor
  private static func nativeRemoveListener(
    this _: borrowing JavaScriptUnownedValue,
    arguments: consuming JavaScriptValuesBuffer,
    result _: borrowing JavaScriptValue.Slot,
    runtime: borrowing JavaScriptRuntime
  ) throws {
    let emitter = try arguments.unownedValue(at: 0).asObject(in: runtime)
    let event = try arguments.unownedValue(at: 1).asString()
    try removeListener(arguments[2], event: event, from: emitter, in: runtime)
  }

  /// `emitter.removeListener(eventName, listener)`.
  @JavaScriptActor
  private static func removeListener(
    this: borrowing JavaScriptUnownedValue,
    arguments: consuming JavaScriptValuesBuffer,
    result _: borrowing JavaScriptValue.Slot,
    runtime: borrowing JavaScriptRuntime
  ) throws {
    try requireArguments(2, of: "removeListener", in: arguments)
    let emitter = try this.asObject(in: runtime)
    let event = try arguments.unownedValue(at: 0).asString()
    try removeListener(arguments[1], event: event, from: emitter, in: runtime)
  }

  /// `emitter.removeAllListeners(eventName)`.
  @JavaScriptActor
  private static func removeAllListeners(
    this: borrowing JavaScriptUnownedValue,
    arguments: consuming JavaScriptValuesBuffer,
    result _: borrowing JavaScriptValue.Slot,
    runtime: borrowing JavaScriptRuntime
  ) throws {
    try requireArguments(1, of: "removeAllListeners", in: arguments)
    let emitter = try this.asObject(in: runtime)
    let event = try arguments.unownedValue(at: 0).asString()

    guard
      let nativeState = emitter.getNativeState(as: EventEmitterNativeState.self),
      let listeners = nativeState.listeners(in: runtime)
    else {
      return
    }
    if listeners.removeAll(from: event) > 0 {
      if listeners.isEmpty {
        nativeState.listenersDidChange(in: runtime, hasListeners: false)
      }
      try nativeState.listeningDidChange(emitter, event: event, isListening: false, in: runtime)
    }
  }

  /// `emitter.emit(eventName, ...args)`.
  @JavaScriptActor
  private static func emit(
    this: borrowing JavaScriptUnownedValue,
    arguments: consuming JavaScriptValuesBuffer,
    result _: borrowing JavaScriptValue.Slot,
    runtime: borrowing JavaScriptRuntime
  ) throws {
    try requireArguments(1, of: "emit", in: arguments)
    let emitter = try this.asObject(in: runtime)
    let event = try arguments.unownedValue(at: 0).asString()

    guard let listeners = emitter.getNativeState(as: EventEmitterNativeState.self)?.listeners(in: runtime) else {
      return
    }
    let payloadArguments = arguments.slice(1...)
    listeners.call(
      event,
      this: emitter,
      argumentsPointer: payloadArguments.rawBaseAddress,
      argumentCount: payloadArguments.count,
      in: runtime
    )
  }

  /// `emitter.listenerCount(eventName)`.
  @JavaScriptActor
  private static func listenerCount(
    this: borrowing JavaScriptUnownedValue,
    arguments: consuming JavaScriptValuesBuffer,
    result: borrowing JavaScriptValue.Slot,
    runtime: borrowing JavaScriptRuntime
  ) throws {
    try requireArguments(1, of: "listenerCount", in: arguments)
    let emitter = try this.asObject(in: runtime)
    let event = try arguments.unownedValue(at: 0).asString()

    let listeners = emitter.getNativeState(as: EventEmitterNativeState.self)?.listeners(in: runtime)
    result.emplace(number: Double(listeners?.count(of: event) ?? 0))
  }

  /// `emitter.removeSubscription(subscription)`, from the API of the old event emitter. Calls `subscription.remove()`.
  @JavaScriptActor
  private static func removeSubscription(
    this _: borrowing JavaScriptUnownedValue,
    arguments: consuming JavaScriptValuesBuffer,
    result _: borrowing JavaScriptValue.Slot,
    runtime: borrowing JavaScriptRuntime
  ) throws {
    try requireArguments(1, of: "removeSubscription", in: arguments)
    let subscription = try arguments.unownedValue(at: 0).asObject(in: runtime)
    try subscription.getProperty("remove").asFunction().call(this: subscription)
  }

  // MARK: - Helpers

  @JavaScriptActor
  private static func removeListener(
    _ listener: consuming JavaScriptValue,
    event: String,
    from emitter: borrowing JavaScriptObject,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    guard
      let nativeState = emitter.getNativeState(as: EventEmitterNativeState.self),
      let listeners = nativeState.listeners(in: runtime)
    else {
      return
    }
    let count = listeners.remove(listener, from: event)
    if count.before > 0 && count.after == 0 {
      if listeners.isEmpty {
        nativeState.listenersDidChange(in: runtime, hasListeners: false)
      }
      try nativeState.listeningDidChange(emitter, event: event, isListening: false, in: runtime)
    }
  }

  private static func requireArguments(
    _ count: Int,
    of method: String,
    in arguments: borrowing JavaScriptValuesBuffer
  ) throws {
    if arguments.count < count {
      throw MissingArgumentsException((method: method, count: count))
    }
  }
}

internal final class InvalidListenerException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "The listener of the '\(param)' event isn't a function. Pass a function to `addListener`"
  }
}

internal final class MissingArgumentsException: GenericException<(method: String, count: Int)>, @unchecked Sendable {
  override var reason: String {
    "The event emitter method `\(param.method)` takes \(param.count) arguments, but it received fewer"
  }
}
