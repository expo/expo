// Copyright 2026-present 650 Industries. All rights reserved.

@_spi(Internal) import ExpoModulesJSI

/// The `expo.EventEmitter` class, the base class of modules and shared objects, and its methods: `addListener`,
/// `removeListener`, `removeAllListeners`, `emit`, `listenerCount` and `removeSubscription`. An
/// `EventEmitterNativeState` keeps the listeners. `addListener` attaches a plain one to an object without a native
/// state. The methods ignore an object with another native state: it has no listeners, and `listenerCount` returns 0.
internal enum EventEmitterMethods {
  /// Installs the class as `EventEmitter` on the core object, `global.expo`, and returns it.
  @JavaScriptActor
  static func installClass(
    on coreObject: borrowing JavaScriptObject,
    in runtime: JavaScriptRuntime
  ) throws -> JavaScriptFunction {
    let eventEmitterClass = try runtime.createClass(name: "EventEmitter") { [weak runtime] this, arguments in
      // The old event emitter wrapped the native module that its constructor got. A module is an event emitter now,
      // so the constructor returns an event emitter that it gets.
      if arguments.count > 0 && arguments[0].isObject() {
        guard let runtime else {
          throw Exceptions.RuntimeLost()
        }
        if try isInstance(arguments.unownedValue(at: 0), ofConstructorOf: this.asObject(), in: runtime) {
          return arguments[0]
        }
      }
      return this
    }
    try install(on: eventEmitterClass.asObject().getPropertyAsObject("prototype"), in: runtime)
    coreObject.setProperty("EventEmitter", value: eventEmitterClass.asValue())
    return eventEmitterClass
  }

  /// Defines the methods on the prototype.
  @JavaScriptActor
  private static func install(on prototype: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {
    let jsMethods = try createJSMethods(in: runtime)
    prototype.setProperty("addListener", value: jsMethods.getProperty("addListener"))
    prototype.setProperty("removeSubscription", value: jsMethods.getProperty("removeSubscription"))
    prototype.setProperty("removeListener", value: runtime.createFunction("removeListener", removeListener).asValue())
    prototype.setProperty(
      "removeAllListeners",
      value: runtime.createFunction("removeAllListeners", removeAllListeners).asValue()
    )
    prototype.setProperty("emit", value: runtime.createFunction("emit", emit).asValue())
    prototype.setProperty("listenerCount", value: runtime.createFunction("listenerCount", listenerCount).asValue())
  }

  /// Creates the methods that are JS functions:
  /// - `addListener`. The subscription that it returns keeps the emitter and the listener in a JS closure, which the
  ///   garbage collector can collect even when the listener references the subscription. Values that a host function
  ///   captures are roots that the garbage collector can't collect. `remove()` clears them before it removes the
  ///   listener, so a second call does nothing, also when an observing function throws.
  /// - `removeSubscription(subscription)`, from the API of the old event emitter. It calls `subscription.remove()`, and
  ///   a getter of `remove` can throw.
  @JavaScriptActor
  private static func createJSMethods(in runtime: JavaScriptRuntime) throws -> JavaScriptObject {
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
          removeSubscription(subscription) {
            subscription.remove();
          },
        };
      })
      """
    let label = "expo-modules-core/event-emitter-methods.js"
    let makeMethods = try runtime.eval(label: label, source).asFunction()
    let arguments = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 2)
    arguments.emplace(runtime.createFunction("addListener", nativeAddListener).asValue(), at: 0)
    arguments.emplace(runtime.createFunction("removeListener", nativeRemoveListener).asValue(), at: 1)
    return try makeMethods.call(arguments: arguments).asObject()
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
    let event = arguments.unownedValue(at: 1)
    try requireString(event)
    guard arguments.unownedValue(at: 2).isFunction() else {
      throw InvalidListenerException(try event.asString())
    }
    guard
      let nativeState = try nativeStateCreatingIfNeeded(of: emitter, in: runtime),
      let listeners = nativeState.listenersCreatingIfNeeded(in: runtime)
    else {
      return
    }
    let hadListeners = !listeners.isEmpty
    let functionPointer = argumentPointer(at: 2, in: arguments)
    let firstListenerEvent = try listeners.add(functionAt: functionPointer, to: event, in: runtime)
    if !hadListeners {
      nativeState.listenersDidChange(in: runtime, hasListeners: true)
    }
    if let firstListenerEvent {
      try nativeState.listeningDidChange(
        emitter,
        event: firstListenerEvent,
        eventValue: event,
        isListening: true,
        in: runtime
      )
    }
  }

  /// Returns the native state of the emitter. Attaches a plain one when the emitter has no native state, for example
  /// an object of `expo.EventEmitter` or a module object in a runtime other than the main runtime. Returns `nil` when
  /// the emitter has another native state. Throws when the engine doesn't allow a native state on the emitter.
  @JavaScriptActor
  private static func nativeStateCreatingIfNeeded(
    of emitter: borrowing JavaScriptObject,
    in runtime: JavaScriptRuntime
  ) throws -> EventEmitterNativeState? {
    if let nativeState = emitter.getNativeState(as: EventEmitterNativeState.self) {
      return nativeState
    }
    guard !emitter.hasNativeState() else {
      return nil
    }
    let nativeState = EventEmitterNativeState(primaryRuntimeId: runtime.id)
    guard emitter.trySetNativeState(nativeState) else {
      throw EventListenersNotSupportedException()
    }
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
    let event = arguments.unownedValue(at: 1)
    try requireString(event)
    try removeListener(functionAt: argumentPointer(at: 2, in: arguments), event: event, from: emitter, in: runtime)
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
    let event = arguments.unownedValue(at: 0)
    try requireString(event)
    try removeListener(functionAt: argumentPointer(at: 1, in: arguments), event: event, from: emitter, in: runtime)
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
    let event = arguments.unownedValue(at: 0)
    try requireString(event)

    guard
      let nativeState = emitter.getNativeState(as: EventEmitterNativeState.self),
      let listeners = nativeState.listeners(in: runtime)
    else {
      return
    }
    if let removedEvent = listeners.removeAll(from: event) {
      if listeners.isEmpty {
        nativeState.listenersDidChange(in: runtime, hasListeners: false)
      }
      try nativeState.listeningDidChange(
        emitter,
        event: removedEvent,
        eventValue: event,
        isListening: false,
        in: runtime
      )
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
    let event = arguments.unownedValue(at: 0)
    try requireString(event)

    guard let listeners = emitter.getNativeState(as: EventEmitterNativeState.self)?.listeners(in: runtime) else {
      return
    }
    // The arguments after the event name are the payload.
    let argumentsPointer = argumentPointer(at: 1, in: arguments)
    let argumentCount = arguments.count - 1
    this.withUnsafePointee { thisValuePointer in
      listeners.call(
        event,
        thisValuePointer: thisValuePointer,
        argumentsPointer: argumentsPointer,
        argumentCount: argumentCount
      )
    }
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
    let event = arguments.unownedValue(at: 0)
    try requireString(event)

    let listeners = emitter.getNativeState(as: EventEmitterNativeState.self)?.listeners(in: runtime)
    result.emplace(number: Double(listeners?.count(of: event) ?? 0))
  }

  // MARK: - Helpers

  /// Returns whether the value is an instance of the constructor of the object, `value instanceof object.constructor`.
  /// A getter of `constructor` or a Proxy trap can throw, so the check runs in C++, which catches the error, and this
  /// function rethrows it.
  @JavaScriptActor
  private static func isInstance(
    _ value: borrowing JavaScriptUnownedValue,
    ofConstructorOf object: borrowing JavaScriptObject,
    in runtime: JavaScriptRuntime
  ) throws -> Bool {
    let constructorName = EventEmitterPropNames.of(runtime).constructor
    var isInstance = false
    let errorPointer = runtime.withUnsafePointee { runtimePointer in
      return object.withUnsafePointee { objectPointer in
        return value.withUnsafePointee { valuePointer in
          return constructorName.withUnsafePointee { constructorNamePointer in
            return isInstanceOfConstructor(
              runtimePointer: runtimePointer,
              objectPointer: objectPointer,
              valuePointer: valuePointer,
              constructorNamePointer: constructorNamePointer,
              isInstance: &isInstance
            )
          }
        }
      }
    }
    try throwJSError(caughtAt: errorPointer, in: runtime)
    return isInstance
  }

  @JavaScriptActor
  private static func removeListener(
    functionAt functionPointer: UnsafeRawPointer,
    event: borrowing JavaScriptUnownedValue,
    from emitter: borrowing JavaScriptObject,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    guard
      let nativeState = emitter.getNativeState(as: EventEmitterNativeState.self),
      let listeners = nativeState.listeners(in: runtime)
    else {
      return
    }
    if let removedEvent = listeners.remove(functionAt: functionPointer, from: event) {
      if listeners.isEmpty {
        nativeState.listenersDidChange(in: runtime, hasListeners: false)
      }
      try nativeState.listeningDidChange(
        emitter,
        event: removedEvent,
        eventValue: event,
        isListening: false,
        in: runtime
      )
    }
  }

  /// Returns a pointer to the `facebook::jsi::Value` of the argument at the given index. An index equal to the number
  /// of arguments gives the end of the arguments.
  private static func argumentPointer(
    at index: Int,
    in arguments: borrowing JavaScriptValuesBuffer
  ) -> UnsafeRawPointer {
    return jsValuePointer(in: arguments.rawBaseAddress!, at: index)
  }

  /// Throws the error of `asString()` when the event name isn't a string, without decoding a string.
  private static func requireString(_ event: borrowing JavaScriptUnownedValue) throws {
    if !event.isString() {
      _ = try event.asString()
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

internal final class EventListenersNotSupportedException: Exception, @unchecked Sendable {
  override var reason: String {
    """
    The object can't keep event listeners, so the listener wasn't added. The JS engine doesn't allow them on a Proxy, \
    a host object, or an object that can't get new properties, for example a frozen one. Call `addListener` on the \
    event emitter itself, and add the first listener before you freeze the emitter
    """
  }
}
