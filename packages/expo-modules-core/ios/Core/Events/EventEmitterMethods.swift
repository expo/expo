// Copyright 2026-present 650 Industries. All rights reserved.

@_spi(Internal) import ExpoModulesJSI

/// The JS methods of an event emitter whose listeners an `EventEmitterNativeState` keeps: `addListener`,
/// `removeListener`, `removeAllListeners`, `emit`, `listenerCount` and `removeSubscription`. They shadow the methods of
/// `expo.EventEmitter.prototype`, and call them only for an object with a native state of another kind, whose
/// listeners the C++ emitter keeps.
internal enum EventEmitterMethods {
  /// Defines the methods on the prototype.
  @JavaScriptActor
  static func install(on prototype: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {
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
    let makeAddListener = try runtime.eval(label: "expo-modules-core/event-emitter-add-listener.js", source).asFunction()
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
    let nativeState: EventEmitterNativeState
    switch EmitterNativeState(of: emitter) {
    case .found(let found):
      nativeState = found
    case .missing:
      // A shared object that was released has no native state. Like the C++ emitter, give it one.
      nativeState = EventEmitterNativeState(primaryRuntimeId: runtime.id)
      emitter.setNativeState(nativeState)
    case .foreign:
      let methodArguments = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 2)
      methodArguments.emplace(arguments[1], at: 0)
      methodArguments.emplace(listener, at: 1)
      try callEventEmitterMethod("addListener", this: emitter, arguments: methodArguments, in: runtime)
      return
    }
    if nativeState.listenersCreatingIfNeeded(in: runtime).add(listener, to: event) == 1 {
      try notifyListening(emitter, event: event, isListening: true, in: runtime)
    }
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

    switch EmitterNativeState(of: emitter) {
    case .found(let nativeState):
      if let listeners = nativeState.listeners(in: runtime), listeners.removeAll(from: event) > 0 {
        try notifyListening(emitter, event: event, isListening: false, in: runtime)
      }
    case .missing:
      return
    case .foreign:
      try callEventEmitterMethod("removeAllListeners", this: emitter, arguments: arguments, in: runtime)
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

    switch EmitterNativeState(of: emitter) {
    case .found(let nativeState):
      let payloadArguments = arguments.slice(1...)
      nativeState.listeners(in: runtime)?.call(
        event,
        this: emitter,
        argumentsPointer: payloadArguments.rawBaseAddress,
        argumentCount: payloadArguments.count,
        in: runtime
      )
    case .missing:
      return
    case .foreign:
      try callEventEmitterMethod("emit", this: emitter, arguments: arguments, in: runtime)
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
    let event = try arguments.unownedValue(at: 0).asString()

    switch EmitterNativeState(of: emitter) {
    case .found(let nativeState):
      result.emplace(number: Double(nativeState.listeners(in: runtime)?.count(of: event) ?? 0))
    case .missing:
      result.emplace(number: 0)
    case .foreign:
      result.emplace(try callEventEmitterMethod("listenerCount", this: emitter, arguments: arguments, in: runtime))
    }
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

  /// The native state of an emitter object.
  private enum EmitterNativeState {
    /// The object has an `EventEmitterNativeState`.
    case found(EventEmitterNativeState)
    /// The object has no native state.
    case missing
    /// The object has a native state of another kind, for example the C++ state of a module object.
    case foreign

    @JavaScriptActor
    init(of emitter: borrowing JavaScriptObject) {
      if let nativeState = emitter.getNativeState(as: EventEmitterNativeState.self) {
        self = .found(nativeState)
      } else {
        self = emitter.hasNativeState() ? .foreign : .missing
      }
    }
  }

  @JavaScriptActor
  private static func removeListener(
    _ listener: consuming JavaScriptValue,
    event: String,
    from emitter: borrowing JavaScriptObject,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    switch EmitterNativeState(of: emitter) {
    case .found(let nativeState):
      guard let listeners = nativeState.listeners(in: runtime) else {
        return
      }
      let count = listeners.remove(listener, from: event)
      if count.before > 0 && count.after == 0 {
        try notifyListening(emitter, event: event, isListening: false, in: runtime)
      }
    case .missing:
      return
    case .foreign:
      let methodArguments = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 2)
      methodArguments.emplace(JavaScriptValue(runtime, event), at: 0)
      methodArguments.emplace(listener, at: 1)
      try callEventEmitterMethod("removeListener", this: emitter, arguments: methodArguments, in: runtime)
    }
  }

  /// Calls the observing functions of the emitter, when it has them, after the first listener of the event is added
  /// (`isListening` is `true`) or the last one is removed.
  @JavaScriptActor
  private static func notifyListening(
    _ emitter: borrowing JavaScriptObject,
    event: String,
    isListening: Bool,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    let names = runtime.cached(observingFunctionNamesKey) {
      return ObservingFunctionNames(runtime)
    }
    try callObservingFunction(isListening ? names.startListening : names.stopListening, of: emitter, event: event)
    try callObservingFunction(isListening ? names.startObserving : names.stopObserving, of: emitter, event: event)
  }

  @JavaScriptActor
  private static func callObservingFunction(
    _ name: JavaScriptPropNameID,
    of emitter: borrowing JavaScriptObject,
    event: String
  ) throws {
    let function = emitter.getProperty(name)
    guard function.isObject() else {
      return
    }
    try function.asFunction().call(this: emitter, arguments: event)
  }

  /// The names of the observing functions, made once for each runtime.
  private final class ObservingFunctionNames {
    let startListening: JavaScriptPropNameID
    let stopListening: JavaScriptPropNameID
    let startObserving: JavaScriptPropNameID
    let stopObserving: JavaScriptPropNameID

    init(_ runtime: borrowing JavaScriptRuntime) {
      startListening = JavaScriptPropNameID(runtime, string: "__expo_onStartListeningToEvent")
      stopListening = JavaScriptPropNameID(runtime, string: "__expo_onStopListeningToEvent")
      startObserving = JavaScriptPropNameID(runtime, string: "startObserving")
      stopObserving = JavaScriptPropNameID(runtime, string: "stopObserving")
    }
  }

  private static let observingFunctionNamesKey = JavaScriptRuntime.Cache.Key<ObservingFunctionNames>()

  /// Calls a method of `expo.EventEmitter.prototype`, the C++ emitter.
  @JavaScriptActor
  @discardableResult
  private static func callEventEmitterMethod(
    _ name: String,
    this emitter: borrowing JavaScriptObject,
    arguments: consuming JavaScriptValuesBuffer,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> JavaScriptValue {
    return try runtime.global()
      .getPropertyAsObject(globalCoreObjectPropertyName)
      .getPropertyAsObject("EventEmitter")
      .getPropertyAsObject("prototype")
      .getPropertyAsFunction(name)
      .call(this: emitter, arguments: arguments)
  }

  private static func requireArguments(
    _ count: Int,
    of method: String,
    in arguments: borrowing JavaScriptValuesBuffer
  ) throws {
    if arguments.count < count {
      throw MissingArgumentsException((method: method, expected: count, received: arguments.count))
    }
  }
}

internal final class InvalidListenerException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "The listener of the '\(param)' event isn't a function. Pass a function to `addListener`"
  }
}

internal final class MissingArgumentsException: GenericException<(method: String, expected: Int, received: Int)>,
  @unchecked Sendable
{
  override var reason: String {
    "The event emitter method `\(param.method)` takes \(param.expected) arguments, but it received \(param.received)"
  }
}
