//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

@objc public class EXManifestsManifestFactory : NSObject {
  @objc public static func manifest(forManifestJSON: Dictionary<String, Any>) -> EXManifestsManifest {
    if forManifestJSON["releaseId"] != nil {
      return EXManifestsLegacyManifest(rawManifestJSON: forManifestJSON)
    } else if forManifestJSON["metadata"] != nil {
      return EXManifestsNewManifest(rawManifestJSON: forManifestJSON)
    } else {
      return EXManifestsBareManifest(rawManifestJSON: forManifestJSON)
    }
  }
}
