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

  @Test
  func `is only safe when it is a plain filename`() {
    let unsafe = [
      "",
      ".",
      "..",
      "../pwned.png",
      "../../Library/Preferences/pwned.plist",
      "nested/asset.png",
      "nested\\asset.png",
      "/etc/passwd",
      "asset\0.png",
      // "/" followed by a combining mark is a single Character that does not equal "/", so a
      // grapheme-level check passes this even though the separator byte reaches the filesystem.
      "..\u{2F}\u{0338}pwned.png"
    ]
    for filename in unsafe {
      #expect(!UpdatesUtils.isSafeFilename(filename), "expected \"\(filename)\" to be rejected")
    }

    let safe = [
      "696a70cf7035664c20ea86f67dae822b.bundle",
      "asset-1699999999-12345.png",
      "..hidden.png",
      "a..b.png"
    ]
    for filename in safe {
      #expect(UpdatesUtils.isSafeFilename(filename), "expected \"\(filename)\" to be accepted")
    }
  }

  @Test
  func `escapes the updates directory when the key traverses`() {
    let updatesDirectory = URL(fileURLWithPath: "/Documents/.expo-internal")
    let asset = UpdateAsset(key: "../../Library/Preferences/pwned", type: "plist")

    #expect(!UpdatesUtils.isSafeFilename(asset.filename))
    #expect(
      !updatesDirectory.appendingPathComponent(asset.filename).standardizedFileURL.path
        .hasPrefix(updatesDirectory.path + "/")
    )
  }
}
