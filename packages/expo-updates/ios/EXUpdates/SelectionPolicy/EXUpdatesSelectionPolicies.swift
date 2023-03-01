//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

@objcMembers
public final class EXUpdatesSelectionPolicies: NSObject {
  public static func doesUpdate(_ update: EXUpdatesUpdate, matchFilters filters: [String: Any]?) -> Bool {
    guard let filters = filters else {
      return true
    }

    let metadata = update.manifest.rawManifestJSON()["metadata"]
    guard let metadata = metadata as? [String: AnyObject] else {
      return true
    }

    // create lowercase copy for case-insensitive search
    let metadataLCKeys = Dictionary(uniqueKeysWithValues: metadata.map({k, v in (k.lowercased(), v)
    }))

    var passes = true
    for (key, filter) in filters {
      if let filter = filter as? NSObject,
        let valueFromManifest = metadataLCKeys[key] as? NSObject {
        passes = filter.isEqual(valueFromManifest)
      }

      // once an update fails one filter, break early; we don't need to check the rest
      if !passes {
        break
      }
    }

    return passes
  }
}
