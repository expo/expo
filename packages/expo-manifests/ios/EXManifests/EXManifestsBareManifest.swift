//  Copyright © 2021 650 Industries. All rights reserved.

import Foundation

@objc public class EXManifestsBareManifest : EXManifestBaseLegacyManifest {
  @objc public func rawId() -> String {
    return self.rawManifestJSON().requiredValue(forKey: "id")
  }

  @objc public func commitTimeNumber() -> NSNumber {
    return NSNumber.init(integerLiteral: self.rawManifestJSON().requiredValue(forKey: "commitTime"))
  }

  @objc public func metadata() -> Dictionary<String, Any>? {
    return self.rawManifestJSON().optionalValue(forKey: "metadata")
  }
}
