// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

struct DevServerFilterSettings {
  let filterByBundleIdentifier: Bool
  let filterByUsername: Bool
  let slug: String

  static let disabled = DevServerFilterSettings(
    filterByBundleIdentifier: false,
    filterByUsername: false,
    slug: ""
  )
}

struct DevServerFilter {
  /// Narrows discovered servers to the ones this developer cares about.
  ///
  /// A filter with nothing to compare against is skipped rather than applied, so an app with no
  /// bundle identifier and a logged-out user both keep seeing the full list instead of an
  /// unexplained empty one.
  static func apply(
    _ servers: [DevServer],
    settings: DevServerFilterSettings,
    bundleIdentifier: String?,
    username: String?
  ) -> [DevServer] {
    var filtered = servers

    if settings.filterByBundleIdentifier, let bundleIdentifier {
      filtered = filtered.filter { $0.bundleIdentifier == bundleIdentifier }
    }

    if settings.filterByUsername, let username {
      filtered = filtered.filter { $0.username == username }
    }

    let slug = settings.slug.trimmingCharacters(in: .whitespacesAndNewlines)
    if !slug.isEmpty {
      filtered = filtered.filter { $0.slug == slug }
    }

    return filtered
  }
}
