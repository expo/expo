//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

@objcMembers
public class EXManifestsBareManifest: EXManifestBaseLegacyManifest {
  public func rawId() -> String {
    return rawManifestJSON().requiredValue(forKey: "id")
  }

  public func commitTimeNumber() -> Int {
    return rawManifestJSON().requiredValue(forKey: "commitTime")
  }

  public func metadata() -> [String: Any]? {
    return rawManifestJSON().optionalValue(forKey: "metadata")
  }
}
