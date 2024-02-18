import ExpoModulesTestCore

@testable import ExpoModulesCore

final class JSEventEmitterSpec: ExpoSpec {
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
    }
  }
}
