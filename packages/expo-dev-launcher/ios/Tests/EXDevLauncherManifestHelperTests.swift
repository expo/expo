// Copyright 2021-present 650 Industries. All rights reserved.

import XCTest

@testable import EXDevLauncher

class EXDevLauncherManifestHelperTests: XCTestCase {
  func testExportManifestOrientation() {
    XCTAssertEqual(UIInterfaceOrientation.portrait, EXDevLauncherManifestHelper.exportManifestOrientation("portrait"))
    XCTAssertEqual(UIInterfaceOrientation.landscapeLeft, EXDevLauncherManifestHelper.exportManifestOrientation("landscape"))
    XCTAssertEqual(UIInterfaceOrientation.unknown, EXDevLauncherManifestHelper.exportManifestOrientation("default"))
    XCTAssertEqual(UIInterfaceOrientation.unknown, EXDevLauncherManifestHelper.exportManifestOrientation("unsupported-value"))
  }

  func testExportManifestUserInterfaceStyle() {
    XCTAssertEqual(UIUserInterfaceStyle.light, EXDevLauncherManifestHelper.exportManifestUserInterfaceStyle("light"))
    XCTAssertEqual(UIUserInterfaceStyle.dark, EXDevLauncherManifestHelper.exportManifestUserInterfaceStyle("dark"))
    XCTAssertEqual(UIUserInterfaceStyle.unspecified, EXDevLauncherManifestHelper.exportManifestUserInterfaceStyle("automatic"))
    XCTAssertEqual(UIUserInterfaceStyle.unspecified, EXDevLauncherManifestHelper.exportManifestUserInterfaceStyle("unsupported-value"))
  }

  func testHexStringToColor() {
    XCTAssertEqual(UIColor.init(red: 192.0/255.0, green: 1.0, blue: 51.0/255.0, alpha: 1.0), EXDevLauncherManifestHelper.hexStringToColor("#c0ff33"))
    XCTAssertEqual(UIColor.init(red: 0.0, green: 0.0, blue: 0.0, alpha: 1.0), EXDevLauncherManifestHelper.hexStringToColor("#000000"))
    XCTAssertNil(EXDevLauncherManifestHelper.hexStringToColor("#000000FF")) // alpha values are not supported
    XCTAssertNil(EXDevLauncherManifestHelper.hexStringToColor("000000"))
  }
}
