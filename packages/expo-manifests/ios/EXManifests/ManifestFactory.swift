//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

@objc(EXManifestsManifestFactory)
@objcMembers
public class ManifestFactory: NSObject {
  public static func manifest(forManifestJSON: [String: Any]) -> Manifest {
    if forManifestJSON["metadata"] != nil {
      return ExpoUpdatesManifest(rawManifestJSON: forManifestJSON)
    }

    return EmbeddedManifest(rawManifestJSON: forManifestJSON)
  }
}
