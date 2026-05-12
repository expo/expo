// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("EventEmitter JS class")
@JavaScriptActor
struct EventEmitterTests {
  let appContext = AppContext.create()
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  @Test
  func `exists`() throws {
    let eventEmitterClass = try runtime.eval("expo.EventEmitter")
    #expect(eventEmitterClass.kind == .function)
  }

  @Test
  func `has functions in prototype`() throws {
    let prototype = try runtime.eval("expo.EventEmitter.prototype").asObject()
    let addListener = prototype.getProperty("addListener")
    let removeListener = prototype.getProperty("removeListener")
    let removeAllListeners = prototype.getProperty("removeAllListeners")
    let emit = prototype.getProperty("emit")

    #expect(addListener.kind == .function)
    #expect(removeListener.kind == .function)
    #expect(removeAllListeners.kind == .function)
    #expect(emit.kind == .function)
  }

  @Test
  func `creates an instance`() throws {
    let eventEmitter = try runtime.eval("new expo.EventEmitter()")
    #expect(eventEmitter.kind == .object)
  }

  @Test
  func `calls a listener`() throws {
    let result = try runtime.eval([
      "emitter = new expo.EventEmitter()",
      "result = null",
      "emitter.addListener('test', payload => { result = payload })",
      "emitter.emit('test', 'it\\'s a payload')",
      "result"
    ])
    #expect(result.kind == .string)
    #expect(try result.asString() == "it's a payload")
  }

  @Test
  func `removes a listener`() throws {
    let result = try runtime.eval([
      "emitter = new expo.EventEmitter()",
      "result = null",
      "listener = () => { result = 1 }",
      "emitter.addListener('test', listener)",
      "emitter.removeListener('test', listener)",
      "emitter.emit('test')",
      "result"
    ])
    #expect(result.kind == .null)
  }

  @Test
  func `removes all listeners`() throws {
    let result = try runtime.eval([
      "emitter = new expo.EventEmitter()",
      "result = null",
      "emitter.addListener('test', () => { result = 1 })",
      "emitter.addListener('test', () => { result = 2 })",
      "emitter.removeAllListeners('test')",
      "emitter.emit('test')",
      "result"
    ])
    #expect(result.kind == .null)
  }

  @Test
  func `emits with multiple arguments`() throws {
    let args = try runtime
      .eval([
        "emitter = new expo.EventEmitter()",
        "result = null",
        "emitter.addListener('test', (a, b, c) => { result = [a, b, c] })",
        "emitter.emit('test', 14, 2, 24)",
        "result"
      ])
      .asArray()
      .map({ try $0.asInt() })

    #expect(args.count == 3)
    #expect(args[0] == 14)
    #expect(args[1] == 2)
    #expect(args[2] == 24)
  }

  @Test
  func `returns listener count with listeners added`() throws {
    let listenerCount = try runtime.eval([
      "emitter = new expo.EventEmitter()",
      "emitter.addListener('test', () => {})",
      "emitter.addListener('test', () => {})",
      "emitter.listenerCount('test')"
    ])
    #expect(listenerCount.kind == .number)
    #expect(try listenerCount.asInt() == 2)
  }

  @Test
  func `returns listener count without any listeners`() throws {
    let listenerCount = try runtime.eval([
      "emitter = new expo.EventEmitter()",
      "emitter.listenerCount('test')"
    ])
    #expect(listenerCount.kind == .number)
    #expect(try listenerCount.asInt() == 0)
  }

  @Test
  func `returns listener count for the proper event`() throws {
    let listenerCount = try runtime.eval([
      "emitter = new expo.EventEmitter()",
      "emitter.addListener('test1', () => {})",
      "emitter.addListener('test1', () => {})",
      "emitter.addListener('test2', () => {})",
      "emitter.listenerCount('test2')"
    ])
    #expect(listenerCount.kind == .number)
    #expect(try listenerCount.asInt() == 1)
  }

  @Test
  func `calls startObserving on addListener`() throws {
    var calls: Int = 0
    var receivedEventName: String?
    let eventName = "testEvent"
    let eventNameValue = JavaScriptValue(try runtime, eventName)
    let listenerA = try runtime.createFunction("listenerA") { _, _ in .undefined }
    let listenerB = try runtime.createFunction("listenerB") { _, _ in .undefined }
    let observer = try setupEventObserver(runtime: runtime, functionName: "startObserving") { arguments in
      receivedEventName = try arguments[0].asString()
      calls = calls + 1
    }

    try observer.addListener.call(this: observer.emitter, arguments: eventName, listenerA.asValue())
    try observer.addListener.call(this: observer.emitter, arguments: eventName, listenerB.asValue())

    #expect(calls == 1)
    #expect(receivedEventName == eventName)
  }

  @Test
  func `calls stopObserving on removeListener`() throws {
    var calls: Int = 0
    var receivedEventName: String?
    let eventName = "testEvent"
    let eventNameValue = JavaScriptValue(try runtime, eventName)
    let listener = try runtime.createFunction("listener") { _, _ in .undefined }
    let observer = try setupEventObserver(runtime: runtime, functionName: "stopObserving") { arguments in
      receivedEventName = try arguments[0].asString()
      calls = calls + 1
    }

    try observer.addListener.call(this: observer.emitter, arguments: eventNameValue, listener.asValue())
    try observer.removeListener.call(this: observer.emitter, arguments: eventNameValue, listener.asValue())
    try observer.removeListener.call(this: observer.emitter, arguments: eventNameValue, listener.asValue())

    #expect(calls == 1)
    #expect(receivedEventName == eventName)
  }

  @Test
  func `calls stopObserving on removeAllListeners`() throws {
    var calls: Int = 0
    var receivedEventName: String?
    let eventName = "testEvent"
    let eventNameValue = JavaScriptValue(try runtime, eventName)
    let listener = try runtime.createFunction("listener") { _, _ in .undefined }
    let observer = try setupEventObserver(runtime: runtime, functionName: "stopObserving") { arguments in
      receivedEventName = try arguments[0].asString()
      calls = calls + 1
    }

    try observer.addListener.call(this: observer.emitter, arguments: eventNameValue, listener.asValue())
    try observer.removeAllListeners.call(this: observer.emitter, arguments: eventNameValue)
    try observer.removeAllListeners.call(this: observer.emitter, arguments: eventNameValue)

    #expect(calls == 1)
    #expect(receivedEventName == eventName)
  }

  @Test
  func `returns a subscription`() throws {
    let subscription = try runtime.eval([
      "emitter = new expo.EventEmitter()",
      "subscription = emitter.addListener('test', () => {})"
    ])

    #expect(try subscription.asObject().getPropertyNames().contains("remove"))
    #expect(try subscription.asObject().getProperty("remove").kind == .function)
  }

  @Test
  func `removes a listener from subscription`() throws {
    let wasCalled = try runtime.eval([
      "wasCalled = false",
      "emitter = new expo.EventEmitter()",
      "subscription = emitter.addListener('test', () => { wasCalled = true })",
      "subscription.remove()",
      "emitter.emit('test')",
      "wasCalled"
    ])

    #expect(try wasCalled.asBool() == false)
  }

  @Test
  func `removes only related listener`() throws {
    let counter = try runtime.eval([
      "counter = 0",
      "emitter = new expo.EventEmitter()",
      "subscription1 = emitter.addListener('test', () => { counter |= 1 })",
      "subscription2 = emitter.addListener('test', () => { counter |= 2 })",
      "subscription1.remove()",
      "emitter.emit('test')",
      "counter"
    ])

    #expect(try counter.asInt() == 2)
  }

  @Test
  func `provides backwards compatibility for the legacy wrapper`() throws {
    let emittersAreEqual = try runtime.eval([
      "emitterA = new expo.EventEmitter()",
      "emitterB = new expo.EventEmitter(emitterA)",
      "emitterA === emitterB"
    ])
    #expect(try emittersAreEqual.asBool() == true)
  }

  @Test
  func `calls all listeners even if removed by a listener`() throws {
    // The third listener should be called even though it was already removed by the second listener.
    let result = try runtime.eval([
      "emitter = new expo.EventEmitter()",
      "result = 0",
      "listener = () => emitter.removeAllListeners('test')",
      "emitter.addListener('test', () => result |= 1)",
      "emitter.addListener('test', listener)",
      "emitter.addListener('test', () => result |= 2)",
      "emitter.emit('test')",
      "result"
    ])
    #expect(try result.asInt() == 3)
  }

  @Test
  func `calls only existing listeners even if a listener adds more`() throws {
    // The listener added in the second listener shouldn't be called.
    let result = try runtime.eval([
      "emitter = new expo.EventEmitter()",
      "result = 0",
      "emitter.addListener('test', () => result |= 1)",
      "emitter.addListener('test', () => emitter.addListener('test', () => result |= 2))",
      "emitter.addListener('test', () => result |= 4)",
      "emitter.emit('test')",
      "result"
    ])
    #expect(try result.asInt() == 5)
  }
}

// MARK: - Helpers

private struct EventObserver: ~Copyable {
  let emitter: JavaScriptObject
  let addListener: JavaScriptFunction
  let removeListener: JavaScriptFunction
  let removeAllListeners: JavaScriptFunction

  init(emitter: consuming JavaScriptObject) {
    self.addListener = emitter.getPropertyAsFunction("addListener")
    self.removeListener = emitter.getPropertyAsFunction("removeListener")
    self.removeAllListeners = emitter.getPropertyAsFunction("removeAllListeners")
    self.emitter = emitter
  }
}

@JavaScriptActor
private func setupEventObserver(
  runtime: ExpoRuntime,
  functionName: String,
  callback: @escaping (_ arguments: consuming JavaScriptValuesBuffer) throws -> Void
) throws -> EventObserver {
  let emitter = try runtime.eval("new expo.EventEmitter()").asObject()
  let observingFunction = runtime.createFunction(functionName) { [callback] this, arguments in
    try callback(arguments)
    return .undefined
  }

  emitter.setProperty(functionName, value: observingFunction)

  return EventObserver(emitter: emitter)
}
