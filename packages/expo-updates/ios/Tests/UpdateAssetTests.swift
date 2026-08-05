//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

@Suite("UpdateAsset filename")
struct UpdateAssetTests {
  @Test
  func `is overridable`() {
    let asset1 = UpdateAsset(key: nil, type: "bundle")
    let asset2 = UpdateAsset(key: nil, type: "bundle")
    #expect(asset1 != asset2)

    let assetSetFilename = UpdateAsset(key: nil, type: "bundle")
    let filenameFromDatabase = "filename.png"
    assetSetFilename.filename = filenameFromDatabase
    #expect(assetSetFilename.filename == filenameFromDatabase)
  }

  @Test
  func `works with extension`() {
    let assetWithDotPrefix = UpdateAsset(key: "cat", type: ".jpeg")
    #expect(assetWithDotPrefix.filename == "cat.jpeg")

    let assetWithoutDotPrefix = UpdateAsset(key: "cat", type: "jpeg")
    #expect(assetWithoutDotPrefix.filename == "cat.jpeg")

    let assetWithoutKey = UpdateAsset(key: nil, type: "jpeg")
    #expect(assetWithoutKey.filename.hasSuffix(".jpeg"))
  }

  @Test
  func `works without extension`() {
    let assetWithDotPrefix = UpdateAsset(key: "cat", type: nil)
    #expect(assetWithDotPrefix.filename == "cat")
  }
}
