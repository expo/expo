import Testing

@testable import EXDevLauncher

@Suite("EXDevLauncherRecentlyOpenedAppsRegistry")
struct EXDevLauncherRecentlyOpenedAppsRegistryTest {
  let appsRegistry: EXDevLauncherRecentlyOpenedAppsRegistry

  init() {
    appsRegistry = EXDevLauncherRecentlyOpenedAppsRegistry()
    appsRegistry.resetStorage()
  }

  @Test
  func `registry should be empty on start`() {
    #expect(appsRegistry.recentlyOpenedApps().count == 0)
  }

  @Test
  func `registry should update when apps are opened`() {
    let url1 = "http://localhost:1234"
    let url2 = "http://localhost:9876"

    appsRegistry.appWasOpened(url1, queryParams: [:], manifest: nil)
    appsRegistry.appWasOpened(url2, queryParams: [:], manifest: nil)

    let openedApps = appsRegistry.recentlyOpenedApps()

    #expect(openedApps.count == 2)

    #expect(openedApps.filter { appEntry in
      appEntry["url"] as! String == url1
    }.count == 1)

    #expect(openedApps.filter { appEntry in
      appEntry["url"] as! String == url2
    }.count == 1)
  }

  @Test
  func `registry timestamp should be correct`() {
    let registerTimestamp = appsRegistry.getCurrentTimestamp()
    let now = Int64(Date().timeIntervalSince1970 * 1_000)

    #expect(registerTimestamp <= now)
    #expect(registerTimestamp > now - 1_000)
  }
}
