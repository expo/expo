import ExpoModulesTestCore

@testable import ExpoModulesCore

class JavaScriptRuntimeSpec: ExpoSpec {
  override func spec() {
    let runtime = JavaScriptRuntime()

    it("has global object accessible") {
      expect(runtime.global) !== nil
    }

    describe("evaluateScript") {
      it("returns primitive types") {
        expect(runtime.evaluateScript("null")).to(beNil())
        expect(runtime.evaluateScript("undefined")).to(beNil())
        expect(runtime.evaluateScript("true") as? Bool) == true
        expect(runtime.evaluateScript("false") as? Bool) == false
        expect(runtime.evaluateScript("123") as? Int) == 123
        expect(runtime.evaluateScript("1.23") as? Double) == 1.23
        expect(runtime.evaluateScript("'foobar'") as? String) == "foobar"
      }

      it("returns arrays") {
        expect(runtime.evaluateScript("['foo', 'bar']") as? [String]) == ["foo", "bar"]
      }

      it("returns dicts") {
        expect(runtime.evaluateScript("{ 'foo': 123 }") as? [String: Int]) == ["foo": 123]
        expect(runtime.evaluateScript("{ 'foo': 'bar' }") as? [String: String]) == ["foo": "bar"]
      }
    }
  }
}
