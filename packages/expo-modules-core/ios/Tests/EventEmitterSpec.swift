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

      it("calls startObserving on addListener") {
        var calls: Int = 0
        let eventName = "testEvent"
        let listenerA = runtime.createSyncFunction("listenerA") { _, _ in }
        let listenerB = runtime.createSyncFunction("listenerB") { _, _ in }
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
        let listener = runtime.createSyncFunction("listener") { _, _ in }
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
        let listener = runtime.createSyncFunction("listener") { _, _ in }
        let observer = try setupEventObserver(runtime: runtime, functionName: "stopObserving") { arguments in
          expect(try arguments.first?.asString()) == eventName
          calls = calls + 1
        }

        observer.addListener.call(withArguments: [eventName, listener], thisObject: observer.emitter, asConstructor: false)
        observer.removeAllListeners.call(withArguments: [eventName], thisObject: observer.emitter, asConstructor: false)
        observer.removeAllListeners.call(withArguments: [eventName], thisObject: observer.emitter, asConstructor: false)

        expect(calls) == 1
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
    return Optional<Any>.none as Any
  }

  emitter.setProperty(functionName, value: observingFunction)

  return (
    emitter,
    addListener: try emitter.getProperty("addListener").asFunction(),
    removeListener: try emitter.getProperty("removeListener").asFunction(),
    removeAllListeners: try emitter.getProperty("removeAllListeners").asFunction()
  )
}
