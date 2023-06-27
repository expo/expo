//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

@objc(EXUpdatesSelectionPolicies)
@objcMembers
public final class SelectionPolicies: NSObject {
  public static func doesUpdate(_ update: Update, matchFilters filters: [String: Any]?) -> Bool {
    guard let filters = filters else {
      return true
    }

    guard let manifest = update.manifest,
      let metadata = manifest.rawManifestJSON()["metadata"] as? [String: AnyObject] else {
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
