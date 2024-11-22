import ExpoModulesTestCore

@testable import ExpoModulesCore

final class EventEmitterSpec: ExpoSpec {
  override class func spec() {
    let appContext = AppContext.create()
    let runtime = try! appContext.runtime

    describe("JS class") {
      it("exists") {
        let eventEmitterClass = try runtime.eval("expo.EventEmitter")
        expect(eventEmitterClass.kind) == .function
      }

      it("has functions in prototype") {
        let prototype = try runtime.eval("expo.EventEmitter.prototype").asObject()
        let addListener = prototype.getProperty("addListener")
        let removeListener = prototype.getProperty("removeListener")
        let removeAllListeners = prototype.getProperty("removeAllListeners")
        let emit = prototype.getProperty("emit")

        expect(addListener.kind) == .function
        expect(removeListener.kind) == .function
        expect(removeAllListeners.kind) == .function
        expect(emit.kind) == .function
      }

      it("creates an instance") {
        let eventEmitter = try runtime.eval("new expo.EventEmitter()")
        expect(eventEmitter.kind) == .object
      }

      it("calls a listener") {
        let result = try runtime.eval([
          "emitter = new expo.EventEmitter()",
          "result = null",
          "emitter.addListener('test', payload => { result = payload })",
          "emitter.emit('test', 'it\\'s a payload')",
          "result"
        ])
        expect(result.kind) == .string
        expect(try result.asString()) == "it's a payload"
      }

      it("removes a listener") {
        let result = try runtime.eval([
          "emitter = new expo.EventEmitter()",
          "result = null",
          "listener = () => { result = 1 }",
          "emitter.addListener('test', listener)",
          "emitter.removeListener('test', listener)",
          "emitter.emit('test')",
          "result"
        ])
        expect(result.kind) == .null
      }

      it("removes all listeners") {
        let result = try runtime.eval([
          "emitter = new expo.EventEmitter()",
          "result = null",
          "emitter.addListener('test', () => { result = 1 })",
          "emitter.addListener('test', () => { result = 2 })",
          "emitter.removeAllListeners('test')",
          "emitter.emit('test')",
          "result"
        ])
        expect(result.kind) == .null
      }

      it("emits with multiple arguments") {
        let args = try runtime
          .eval([
            "emitter = new expo.EventEmitter()",
            "result = null",
            "emitter.addListener('test', (a, b, c) => { result = [a, b, c] })",
            "emitter.emit('test', 14, 2, 24)",
            "result"
          ])
          .asArray()
          .compactMap({ try $0?.asInt() })

        expect(args.count) == 3
        expect(args[0]) == 14
        expect(args[1]) == 2
        expect(args[2]) == 24
      }

      it("returns listener count with listeners added") {
        let listenerCount = try runtime.eval([
          "emitter = new expo.EventEmitter()",
          "emitter.addListener('test', () => {})",
          "emitter.addListener('test', () => {})",
          "emitter.listenerCount('test')"
        ])
        expect(listenerCount.kind) == .number
        expect(try listenerCount.asInt()) == 2
      }

      it("returns listener count without any listeners") {
        let listenerCount = try runtime.eval([
          "emitter = new expo.EventEmitter()",
          "emitter.listenerCount('test')"
        ])
        expect(listenerCount.kind) == .number
        expect(try listenerCount.asInt()) == 0
      }

      it("returns listener count for the proper event") {
        let listenerCount = try runtime.eval([
          "emitter = new expo.EventEmitter()",
          "emitter.addListener('test1', () => {})",
          "emitter.addListener('test1', () => {})",
          "emitter.addListener('test2', () => {})",
          "emitter.listenerCount('test2')"
        ])
        expect(listenerCount.kind) == .number
        expect(try listenerCount.asInt()) == 1
      }

      it("calls startObserving on addListener") {
        var calls: Int = 0
        let eventName = "testEvent"
        let listenerA = runtime.createSyncFunction("listenerA") { _, _ in .undefined }
        let listenerB = runtime.createSyncFunction("listenerB") { _, _ in .undefined }
        let observer = try setupEventObserver(runtime: runtime, functionName: "startObserving") { arguments in
          expect(try arguments.first?.asString()) == eventName
          calls = calls + 1
        }

        observer.addListener.call(withArguments: [eventName, listenerA], thisObject: observer.emitter, asConstructor: false)
        observer.addListener.call(withArguments: [eventName, listenerB], thisObject: observer.emitter, asConstructor: false)

        expect(calls) == 1
      }

      it("calls stopObserving on removeListener") {
        var calls: Int = 0
        let eventName = "testEvent"
        let listener = runtime.createSyncFunction("listener") { _, _ in .undefined }
        let observer = try setupEventObserver(runtime: runtime, functionName: "stopObserving") { arguments in
          expect(try arguments.first?.asString()) == eventName
          calls = calls + 1
        }

        observer.addListener.call(withArguments: [eventName, listener], thisObject: observer.emitter, asConstructor: false)
        observer.removeListener.call(withArguments: [eventName, listener], thisObject: observer.emitter, asConstructor: false)
        observer.removeListener.call(withArguments: [eventName, listener], thisObject: observer.emitter, asConstructor: false)

        expect(calls) == 1
      }

      it("calls stopObserving on removeAllListeners") {
        var calls: Int = 0
        let eventName = "testEvent"
        let listener = runtime.createSyncFunction("listener") { _, _ in .undefined }
        let observer = try setupEventObserver(runtime: runtime, functionName: "stopObserving") { arguments in
          expect(try arguments.first?.asString()) == eventName
          calls = calls + 1
        }

        observer.addListener.call(withArguments: [eventName, listener], thisObject: observer.emitter, asConstructor: false)
        observer.removeAllListeners.call(withArguments: [eventName], thisObject: observer.emitter, asConstructor: false)
        observer.removeAllListeners.call(withArguments: [eventName], thisObject: observer.emitter, asConstructor: false)

        expect(calls) == 1
      }

      it("returns a subscription") {
        let subscription = try runtime.eval([
          "emitter = new expo.EventEmitter()",
          "subscription = emitter.addListener('test', () => {})"
        ])

        expect(try subscription.asObject().getPropertyNames()).to(contain("remove"))
        expect(try subscription.asObject().getProperty("remove").kind) == .function
      }

      it("removes a listener from subscription") {
        let wasCalled = try runtime.eval([
          "wasCalled = false",
          "emitter = new expo.EventEmitter()",
          "subscription = emitter.addListener('test', () => { wasCalled = true })",
          "subscription.remove()",
          "emitter.emit('test')",
          "wasCalled"
        ])

        expect(try wasCalled.asBool()) == false
      }

      it("removes only related listener") {
        let counter = try runtime.eval([
          "counter = 0",
          "emitter = new expo.EventEmitter()",
          "subscription1 = emitter.addListener('test', () => { counter |= 1 })",
          "subscription2 = emitter.addListener('test', () => { counter |= 2 })",
          "subscription1.remove()",
          "emitter.emit('test')",
          "counter"
        ])

        expect(try counter.asInt()) == 2
      }

      it("provides backwards compatibility for the legacy wrapper") {
        let emittersAreEqual = try runtime.eval([
          "emitterA = new expo.EventEmitter()",
          "emitterB = new expo.EventEmitter(emitterA)",
          "emitterA === emitterB"
        ])
        expect(try emittersAreEqual.asBool()) == true
      }

      it("calls all listeners even if removed by a listener") {
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
        expect(try result.asInt()) == 3
      }

      it("calls only existing listeners even if a listener adds more") {
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
        expect(try result.asInt()) == 5
      }
    }
  }
}

private typealias EventObserver = (
  emitter: JavaScriptObject,
  addListener: RawJavaScriptFunction,
  removeListener: RawJavaScriptFunction,
  removeAllListeners: RawJavaScriptFunction
)

private func setupEventObserver(
  runtime: ExpoRuntime,
  functionName: String,
  callback: @escaping (_ arguments: [JavaScriptValue]) throws -> Void
) throws -> EventObserver {
  let emitter = try! runtime.eval("new expo.EventEmitter()").asObject()
  let observingFunction = runtime.createSyncFunction(functionName) { [callback] this, arguments in
    try callback(arguments)
    return .undefined
  }

  emitter.setProperty(functionName, value: observingFunction)

  return (
    emitter,
    addListener: try emitter.getProperty("addListener").asFunction(),
    removeListener: try emitter.getProperty("removeListener").asFunction(),
    removeAllListeners: try emitter.getProperty("removeAllListeners").asFunction()
  )
}
