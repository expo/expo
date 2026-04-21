import ExpoModulesTestCore

@testable import UMAppLoader

class UMAppLoaderProviderSpec: ExpoSpec {
  override class func spec() {
    describe("UMAppLoaderProvider") {
      it("exposes a shared singleton") {
        expect(UMAppLoaderProvider.sharedInstance()).notTo(beNil())
      }
    }
  }
}
