// Copyright 2015-present 650 Industries. All rights reserved.

import Network
import XCTest

@testable import EXDevLauncher

class DevServerMetadataTests: XCTestCase {
  func testParsesEveryAdvertisedField() {
    let record = NWTXTRecord([
      "name": "My App",
      "slug": "my-app",
      "iosBundleIdentifier": "dev.expo.myapp",
      "username": "alanjhughes"
    ])

    let metadata = DevServerMetadata(txtRecord: record)

    XCTAssertEqual(metadata.name, "My App")
    XCTAssertEqual(metadata.slug, "my-app")
    XCTAssertEqual(metadata.bundleIdentifier, "dev.expo.myapp")
    XCTAssertEqual(metadata.username, "alanjhughes")
  }

  func testMissingEntriesAreNil() {
    let record = NWTXTRecord(["name": "My App"])

    let metadata = DevServerMetadata(txtRecord: record)

    XCTAssertEqual(metadata.name, "My App")
    XCTAssertNil(metadata.slug)
    XCTAssertNil(metadata.bundleIdentifier)
    XCTAssertNil(metadata.username)
  }

  func testEmptyEntryIsTreatedAsMissing() {
    let record = NWTXTRecord(["name": "My App", "username": ""])

    let metadata = DevServerMetadata(txtRecord: record)

    XCTAssertNil(metadata.username)
  }

  func testEmptyRecordYieldsNoFields() {
    let metadata = DevServerMetadata(txtRecord: NWTXTRecord([:]))

    XCTAssertNil(metadata.name)
    XCTAssertNil(metadata.slug)
    XCTAssertNil(metadata.bundleIdentifier)
    XCTAssertNil(metadata.username)
  }
}
