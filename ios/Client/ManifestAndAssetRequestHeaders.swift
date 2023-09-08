// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXManifests

@objc(EXManifestAndAssetRequestHeaders)
@objcMembers
public final class ManifestAndAssetRequestHeaders: NSObject {
  public let manifest: Manifest
  public let assetRequestHeaders: [String: Any]

  public required init(manifest: Manifest, assetRequestHeaders: [String: Any]) {
    self.manifest = manifest
    self.assetRequestHeaders = assetRequestHeaders
  }
}
