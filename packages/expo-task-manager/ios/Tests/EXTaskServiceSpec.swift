import ExpoModulesTestCore

@testable import ExpoTaskManager

class EXTaskServiceSpec: ExpoSpec {
  override class func spec() {
    describe("EXTaskService") {
      it("exposes a shared singleton") {
        expect(EXTaskService.shared).notTo(beNil())
      }
    }
  }
}
