//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import XCTest

@testable import EXManifests

class EXManifestsNewManifestTests : XCTestCase {
  func testSDKVersion_ValidCaseNumeric() {
    let runtimeVersion = "exposdk:39.0.0"
    let manifestJson = ["runtimeVersion": runtimeVersion]
    let manifest = EXManifestsNewManifest(rawManifestJSON: manifestJson)
    XCTAssertEqual(manifest.sdkVersion(), "39.0.0")
  }

  func testSDKVersion_ValidCaseUnversioned() {
    let runtimeVersion = "exposdk:UNVERSIONED"
    let manifestJson = ["runtimeVersion": runtimeVersion]
    let manifest = EXManifestsNewManifest(rawManifestJSON: manifestJson)
    XCTAssertEqual(manifest.sdkVersion(), "UNVERSIONED")
  }

  func testSDKVersion_NotSDKRuntimeVersionCases() {
    let runtimeVersions = [
      "exposdk:123",
      "exposdkd:39.0.0",
      "exposdk:hello",
      "bexposdk:39.0.0",
      "exposdk:39.0.0-beta.0",
      "exposdk:39.0.0-alpha.256"
    ]
    
    for runtimeVersion in runtimeVersions {
      let manifestJson = ["runtimeVersion": runtimeVersion]
      let manifest = EXManifestsNewManifest(rawManifestJSON: manifestJson)
      XCTAssertNil(manifest.sdkVersion())
    }
  }
}
