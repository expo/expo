import Quick
import Nimble

@testable import EXDevLauncher

class EXDevLauncherRecentlyOpenedAppsRegistryTest: QuickSpec {
  override func spec() {
    let appsRegistry = EXDevLauncherRecentlyOpenedAppsRegistry()

    beforeEach {
      appsRegistry.resetStorage()
    }

    it("registry should be empty on start") {
      expect(appsRegistry.recentlyOpenedApps().count).to(equal(0))
    }

    it("registry should update when apps are opened") {
      appsRegistry.appWasOpened("http://localhost:1234", name: "app1")
      appsRegistry.appWasOpened("http://localhost:9876", name: "app2")

      let openedApps = appsRegistry.recentlyOpenedApps()

      expect(openedApps.count).to(equal(2))
      expect(openedApps["http://localhost:1234"] as? String).to(equal("app1"))
      expect(openedApps["http://localhost:9876"] as? String).to(equal("app2"))
    }

    it("registry timestamp should be correct") {
      let registerTimestamp = appsRegistry.getCurrentTimestamp()
      let now = Int64(Date().timeIntervalSince1970 * 1_000)

      expect(registerTimestamp).to(beLessThanOrEqualTo(now))
      expect(registerTimestamp).to(beGreaterThan(now - 1_000))
    }
  }
}
