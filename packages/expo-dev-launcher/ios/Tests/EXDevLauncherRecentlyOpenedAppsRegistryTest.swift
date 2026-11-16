import Testing

@testable import EXDevLauncher

@Suite("EXDevLauncherRecentlyOpenedAppsRegistry")
struct EXDevLauncherRecentlyOpenedAppsRegistryTest {
  /// A registry that backdates every entry it writes past the removal window.
  class ThreeDaysAgoRegistry: EXDevLauncherRecentlyOpenedAppsRegistry {
    override func getCurrentTimestamp() -> Int64 {
      // 3 days and 1 second ago
      return Int64((Date().timeIntervalSince1970 - (60 * 60 * 24 * 3) - 1) * 1_000)
    }
  }

  // Tests run in parallel and the registry persists to `UserDefaults`, so each one gets its own
  // storage key. Sharing a key lets a sibling test drop the entries this one wrote.
  let storageKey = "expo.devlauncher.tests.\(UUID().uuidString)"
  let appsRegistry: EXDevLauncherRecentlyOpenedAppsRegistry

  init() {
    appsRegistry = EXDevLauncherRecentlyOpenedAppsRegistry(storageKey: storageKey)
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

  @Test
  func `app is added to the registry`() {
    let urlString = "http://localhost:8081"

    appsRegistry.appWasOpened(urlString, queryParams: [:], manifest: nil)

    let recentlyOpenedApps = appsRegistry.recentlyOpenedApps()
    #expect(recentlyOpenedApps[0]["url"] as? String == urlString)
  }

  @Test
  func `registry is persisted between instances`() {
    // instance of the registry class shouldn't matter
    // if this fails, `old app is removed from the registry` could have a false positive
    let urlString = "http://localhost:8081"

    let registry1 = EXDevLauncherRecentlyOpenedAppsRegistry(storageKey: storageKey)
    registry1.appWasOpened(urlString, queryParams: [:], manifest: nil)

    let registry2 = EXDevLauncherRecentlyOpenedAppsRegistry(storageKey: storageKey)
    let recentlyOpenedApps = registry2.recentlyOpenedApps()

    #expect(recentlyOpenedApps[0]["url"] as? String == urlString)
  }

  @Test
  func `old app is removed from the registry`() {
    let urlString = "http://localhost:8081"

    let registryOld = ThreeDaysAgoRegistry(storageKey: storageKey)
    registryOld.appWasOpened(urlString, queryParams: [:], manifest: nil)

    let registryNew = EXDevLauncherRecentlyOpenedAppsRegistry(storageKey: storageKey)
    #expect(registryNew.recentlyOpenedApps().count == 0)
  }
}
