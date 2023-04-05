//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

@objc(EXManifestsManifestFactory)
@objcMembers
public class ManifestFactory: NSObject {
  public static func manifest(forManifestJSON: [String: Any]) -> Manifest {
    if forManifestJSON["releaseId"] != nil {
      return LegacyManifest(rawManifestJSON: forManifestJSON)
    } else if forManifestJSON["metadata"] != nil {
      return NewManifest(rawManifestJSON: forManifestJSON)
    } else {
      return BareManifest(rawManifestJSON: forManifestJSON)
    }
  }
}
