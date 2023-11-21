import Quick
import Nimble

@testable import EXDevLauncher

class EXDevLauncherRecentlyOpenedAppsRegistryTest: QuickSpec {
  override class func spec() {
    let appsRegistry = EXDevLauncherRecentlyOpenedAppsRegistry()

    beforeEach {
      appsRegistry.resetStorage()
    }

    it("registry should be empty on start") {
      expect(appsRegistry.recentlyOpenedApps().count).to(equal(0))
    }

    it("registry should update when apps are opened") {
      let url1 = "http://localhost:1234"
      let url2 = "http://localhost:9876"

      appsRegistry.appWasOpened(url1, queryParams: [:], manifest: nil)
      appsRegistry.appWasOpened(url2, queryParams: [:], manifest: nil)

      let openedApps = appsRegistry.recentlyOpenedApps()

      expect(openedApps.count).to(equal(2))

      expect(openedApps.filter { appEntry in
        appEntry["url"] as! String == url1
      }.count).to(equal(1))

      expect(openedApps.filter { appEntry in
        appEntry["url"] as! String == url2
      }.count).to(equal(1))
    }

    it("registry timestamp should be correct") {
      let registerTimestamp = appsRegistry.getCurrentTimestamp()
      let now = Int64(Date().timeIntervalSince1970 * 1_000)

      expect(registerTimestamp).to(beLessThanOrEqualTo(now))
      expect(registerTimestamp).to(beGreaterThan(now - 1_000))
    }
  }
}
