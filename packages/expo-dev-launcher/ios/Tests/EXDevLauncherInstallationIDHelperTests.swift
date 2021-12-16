// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest

@testable import EXDevLauncher

class EXDevLauncherInstallationIDHelperTests: XCTestCase {
  func testGetOrCreateInstallationID_PersistedInMemory() {
    let installationIDHelper = EXDevLauncherInstallationIDHelper()
    let installationID1 = installationIDHelper.getOrCreateInstallationID()
    let installationID2 = installationIDHelper.getOrCreateInstallationID()
    XCTAssertEqual(installationID1, installationID2)

    // format should be a valid UUID
    XCTAssertNotNil(UUID(uuidString: installationID1))
  }

  func testGetOrCreateInstallationID_PersistedInStorage() {
    // two different instances of the same class should return the same ID
    // since it's persisted to and read from disk
    let installationIDHelper1 = EXDevLauncherInstallationIDHelper()
    let installationID1 = installationIDHelper1.getOrCreateInstallationID()

    let installationIDHelper2 = EXDevLauncherInstallationIDHelper()
    let installationID2 = installationIDHelper2.getOrCreateInstallationID()

    XCTAssertEqual(installationID1, installationID2)
  }
}
