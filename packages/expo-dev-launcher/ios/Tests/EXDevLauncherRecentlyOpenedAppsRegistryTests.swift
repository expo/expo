// Copyright 2021-present 650 Industries. All rights reserved.

import XCTest

@testable import EXDevLauncher

class EXDevLauncherRecentlyOpenedAppsRegistry3DaysAgo: EXDevLauncherRecentlyOpenedAppsRegistry {
  override func getCurrentTimestamp() -> Int64 {
    return Int64((Date().timeIntervalSince1970 - (60 * 60 * 24 * 3) - 1) * 1_000) // 3 days and 1 second ago
  }
}

class EXDevLauncherRecentlyOpenedAppsRegistryTests: XCTestCase {
  func testAddAppToRegistry() {
    let urlString = "http://localhost:8081"
    let registry = EXDevLauncherRecentlyOpenedAppsRegistry()
    registry.appWasOpened(urlString, queryParams: [:], manifest: nil)
    let recentlyOpenedApps = registry.recentlyOpenedApps()
    XCTAssertNotNil(recentlyOpenedApps[0])
    XCTAssertEqual(recentlyOpenedApps[0]["url"] as! String, urlString)
  }

  func testRegistryPersistence() {
    // instance of the registry class shouldn't matter
    // if this fails, testRemoveOldAppFromRegistry could have a false positive
    let urlString = "http://localhost:8081"

    let registry1 = EXDevLauncherRecentlyOpenedAppsRegistry()
    registry1.appWasOpened(urlString, queryParams: [:], manifest: nil)

    let registry2 = EXDevLauncherRecentlyOpenedAppsRegistry()
    let recentlyOpenedApps = registry2.recentlyOpenedApps()

    XCTAssertNotNil(recentlyOpenedApps[0])
    XCTAssertEqual(recentlyOpenedApps[0]["url"] as! String, urlString)
  }

  func testRemoveOldAppFromRegistry() {
    let urlString = "http://localhost:8081"

    let registryOld = EXDevLauncherRecentlyOpenedAppsRegistry3DaysAgo()
    registryOld.appWasOpened(urlString, queryParams: [:], manifest: nil)

    let registryNew = EXDevLauncherRecentlyOpenedAppsRegistry()
    let recentlyOpenedApps = registryNew.recentlyOpenedApps()

    XCTAssertTrue(recentlyOpenedApps.count == 0)
  }
}
