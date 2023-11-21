import ExpoModulesTestCore

@testable import ExpoModulesCore

class JavaScriptRuntimeSpec: ExpoSpec {
  override class func spec() {
    let runtime = JavaScriptRuntime()

    it("has global object accessible") {
      expect(runtime.global) !== nil
    }

    describe("eval") {
      it("returns undefined") {
        let undefined = try! runtime.eval("undefined")
        expect(undefined.isUndefined()) == true
        expect(undefined.kind) == .undefined
        expect(undefined.isNull()) == false
        expect(undefined.getRaw()).to(beNil())
      }

      it("returns null") {
        let null = try! runtime.eval("null")
        expect(null.isNull()) == true
        expect(null.kind) == .null
        expect(null.getRaw()).to(beNil())
      }

      it("returns bool") {
        let boolTrue = try! runtime.eval("true")
        let boolFalse = try! runtime.eval("false")
        expect(boolTrue.isBool()) == true
        expect(boolFalse.isBool()) == true
        expect(boolTrue.kind) == .bool
        expect(boolFalse.kind) == .bool
        expect(try! boolTrue.asBool()) == true
        expect(try! boolFalse.asBool()) == false
      }

      it("returns number") {
        let number = try! runtime.eval("1.23")
        expect(number.isNumber()) == true
        expect(number.kind) == .number
        expect(try! number.asInt()) == 1
        expect(try! number.asDouble()) == 1.23
      }

      it("returns string") {
        let string = try! runtime.eval("'foobar'")
        expect(string.isString()) == true
        expect(string.kind) == .string
        expect(try! string.asString()) == "foobar"
      }

      it("returns array") {
        let array = try! runtime.eval("(['foo', 'bar'])")
        expect(array.isObject()) == true
        expect(array.kind) == .object
        expect(try! array.asArray().map { try $0?.asString() }) == ["foo", "bar"]
      }

      it("returns dict") {
        let dict1 = try! runtime.eval("({ 'foo': 123 })")
        let dict2 = try! runtime.eval("({ 'foo': 'bar' })")
        expect(dict1.isObject()) == true
        expect(dict2.isObject()) == true
        expect(dict1.kind) == .object
        expect(dict2.kind) == .object
        expect(try! dict1.asDict() as? [String: Int]) == ["foo": 123]
        expect(try! dict2.asDict() as? [String: String]) == ["foo": "bar"]
      }

      it("returns function") {
        let function = try! runtime.eval("(function() {})")
        expect(function.isObject()) == true
        expect(function.isFunction()) == true
        expect(function.kind) == .function
      }

      it("returns symbol") {
        let symbol = try! runtime.eval("Symbol('foo')")
        expect(symbol.isSymbol()) == true
        expect(symbol.kind) == .symbol
      }

      it("throws evaluation exception") {
        expect({ try runtime.eval("foo") }).to(throwError { error in
          expect(error).to(beAKindOf(JavaScriptEvalException.self))
          #if canImport(reacthermes)
          expect((error as! JavaScriptEvalException).reason).to(contain("Property 'foo' doesn't exist"))
          #else
          expect((error as! JavaScriptEvalException).reason).to(contain("Can't find variable: foo"))
          #endif
        })
      }
    }
  }
}
