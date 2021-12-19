import Quick
import Nimble

@testable import EXDevLauncher

class EXDevLauncherPendingDeepLinkRegistryTest: QuickSpec {
  class Listener: NSObject, EXDevLauncherPendingDeepLinkListener {
    var lastDeepLink: URL?

    func onNewPendingDeepLink(_ deepLink: URL!) {
      lastDeepLink = deepLink
    }
  }

  override func spec() {
    it("registry should inform all subscribers about new value") {
      let listener = Listener()
      let registry = EXDevLauncherPendingDeepLinkRegistry()

      registry.subscribe(listener)
      registry.pendingDeepLink = URL.init(string: "http://localhost:1234")

      expect(listener.lastDeepLink?.absoluteString).to(equal("http://localhost:1234"))
    }

    it("unsubscribe should work") {
      let listener = Listener()
      let registry = EXDevLauncherPendingDeepLinkRegistry()

      registry.subscribe(listener)
      registry.unsubscribe(listener)
      registry.pendingDeepLink = URL.init(string: "http://localhost:1234")

      expect(listener.lastDeepLink).to(beNil())
    }

    it("consumePendingDeepLink should reset the inner value") {
      let listener = Listener()
      let registry = EXDevLauncherPendingDeepLinkRegistry()

      registry.subscribe(listener)
      registry.pendingDeepLink = URL.init(string: "http://localhost:1234")
      let consumedURL = registry.consumePendingDeepLink()

      expect(registry.pendingDeepLink).to(beNil())
      expect(listener.lastDeepLink?.absoluteString).to(equal("http://localhost:1234"))
      expect(listener.lastDeepLink).to(be(consumedURL))
    }
  }
}
