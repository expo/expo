//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

@objcMembers
public class EXManifestsManifestFactory: NSObject {
  public static func manifest(forManifestJSON: [String: Any]) -> EXManifestsManifest {
    if forManifestJSON["releaseId"] != nil {
      return EXManifestsLegacyManifest(rawManifestJSON: forManifestJSON)
    } else if forManifestJSON["metadata"] != nil {
      return EXManifestsNewManifest(rawManifestJSON: forManifestJSON)
    } else {
      return EXManifestsBareManifest(rawManifestJSON: forManifestJSON)
    }
  }
}
