// Copyright 2015-present 650 Industries. All rights reserved.

import Network

/// The fields the Expo CLI advertises in a dev server's Bonjour TXT record.
/// Source of truth: `packages/@expo/cli/src/start/server/Bonjour.ts`.
struct DevServerMetadata {
  let name: String?
  let slug: String?
  let bundleIdentifier: String?
  let username: String?

  static let empty = DevServerMetadata(
    name: nil,
    slug: nil,
    bundleIdentifier: nil,
    username: nil
  )

  init(name: String?, slug: String?, bundleIdentifier: String?, username: String?) {
    self.name = name
    self.slug = slug
    self.bundleIdentifier = bundleIdentifier
    self.username = username
  }

  init(txtRecord: NWTXTRecord) {
    self.init(
      name: Self.string(txtRecord, forKey: "name"),
      slug: Self.string(txtRecord, forKey: "slug"),
      bundleIdentifier: Self.string(txtRecord, forKey: "iosBundleIdentifier"),
      username: Self.string(txtRecord, forKey: "username")
    )
  }

  init(result: NWBrowser.Result) {
    guard case .bonjour(let txtRecord) = result.metadata else {
      self = .empty
      return
    }
    self.init(txtRecord: txtRecord)
  }

  /// An entry that is absent, non-string, or empty all mean the same thing to a filter:
  /// nothing to compare against.
  private static func string(_ txtRecord: NWTXTRecord, forKey key: String) -> String? {
    guard case .string(let value)? = txtRecord.getEntry(for: key), !value.isEmpty else {
      return nil
    }
    return value
  }
}
