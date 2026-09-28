import Testing

@testable import EXDevLauncher

@Suite("EXDevLauncherPendingDeepLinkRegistry")
struct EXDevLauncherPendingDeepLinkRegistryTest {
  class Listener: NSObject, EXDevLauncherPendingDeepLinkListener {
    var lastDeepLink: URL?

    func onNewPendingDeepLink(_ deepLink: URL) {
      lastDeepLink = deepLink
    }
  }

  @Test
  func `registry should inform all subscribers about new value`() {
    let listener = Listener()
    let registry = EXDevLauncherPendingDeepLinkRegistry()

    registry.subscribe(listener)
    registry.pendingDeepLink = URL.init(string: "http://localhost:1234")

    #expect(listener.lastDeepLink?.absoluteString == "http://localhost:1234")
  }

  @Test
  func `unsubscribe should work`() {
    let listener = Listener()
    let registry = EXDevLauncherPendingDeepLinkRegistry()

    registry.subscribe(listener)
    registry.unsubscribe(listener)
    registry.pendingDeepLink = URL.init(string: "http://localhost:1234")

    #expect(listener.lastDeepLink == nil)
  }

  @Test
  func `consumePendingDeepLink should reset the inner value`() {
    let listener = Listener()
    let registry = EXDevLauncherPendingDeepLinkRegistry()

    registry.subscribe(listener)
    registry.pendingDeepLink = URL.init(string: "http://localhost:1234")
    let consumedURL = registry.consumePendingDeepLink()

    #expect(registry.pendingDeepLink == nil)
    #expect(listener.lastDeepLink?.absoluteString == "http://localhost:1234")
    #expect((listener.lastDeepLink! as NSURL) === (consumedURL! as NSURL))
  }
}
