// Copyright 2021-present 650 Industries. All rights reserved.

import XCTest

@testable import EXDevLauncher

class EXDevLauncherRecentlyOpenedAppsRegistry3DaysAgo: EXDevLauncherRecentlyOpenedAppsRegistry {
  override func getCurrentTimestamp() -> Int64 {
    return Int64((Date().timeIntervalSince1970 - (60 * 60 * 24 * 3) - 1) * 1_000); // 3 days and 1 second ago
  }
}

class EXDevLauncherRecentlyOpenedAppsRegistryTests: XCTestCase {
  func testAddAppToRegistry() {
    let urlString = "http://localhost:8081"
    let name = "test-app"
    let registry = EXDevLauncherRecentlyOpenedAppsRegistry()
    registry.appWasOpened(urlString, name: name)
    let recentlyOpenedApps = registry.recentlyOpenedApps()
    XCTAssertEqual(name, recentlyOpenedApps[urlString] as! String)
  }

  func testRegistryPersistence() {
    // instance of the registry class shouldn't matter
    // if this fails, testRemoveOldAppFromRegistry could have a false positive
    let urlString = "http://localhost:8081"
    let name = "test-app"

    let registry1 = EXDevLauncherRecentlyOpenedAppsRegistry()
    registry1.appWasOpened(urlString, name: name)

    let registry2 = EXDevLauncherRecentlyOpenedAppsRegistry()
    let recentlyOpenedApps = registry2.recentlyOpenedApps()
    XCTAssertEqual(name, recentlyOpenedApps[urlString] as! String)
  }

  func testRemoveOldAppFromRegistry() {
    let urlString = "http://localhost:8081"
    let name = "test-app"

    let registryOld = EXDevLauncherRecentlyOpenedAppsRegistry3DaysAgo()
    registryOld.appWasOpened(urlString, name: name)

    let registryNew = EXDevLauncherRecentlyOpenedAppsRegistry()
    let recentlyOpenedApps = registryNew.recentlyOpenedApps()
    XCTAssertNil(recentlyOpenedApps[urlString])
  }
}
