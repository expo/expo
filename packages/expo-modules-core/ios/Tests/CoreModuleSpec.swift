import ExpoModulesTestCore

@testable import ExpoModulesCore

final class CoreModuleSpec: ExpoSpec {
  override class func spec() {
    let appContext = AppContext.create()
    let runtime = try! appContext.runtime

    describe("core module") {
      it("is initialized") {
        expect(appContext.coreModule).notTo(beNil())
      }
    }

    describe("core object") {
      it("is initialized") {
        expect(runtime.coreObject).notTo(beNil())
      }

      it("is installed to global scope") {
        let coreObjectValue = try runtime.eval("expo")
        expect(coreObjectValue.kind) == .object
      }
    }
  }
}
