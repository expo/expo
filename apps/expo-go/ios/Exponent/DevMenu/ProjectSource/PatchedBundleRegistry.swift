// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Session-scoped override: when the source explorer has spliced an edit
/// into a published project's bundle, the app loader launches the patched
/// copy instead of re-reading the cache. The cache itself is never
/// modified. Read from EXAppLoaderExpoUpdates on load, written from
/// the applier; cleared when the project's source session ends.
@objc(EXPatchedBundleRegistry)
public final class PatchedBundleRegistry: NSObject {
  private static let lock = NSLock()
  private static var patchedBundleURLsByScopeKey: [String: URL] = [:]

  @objc public static func patchedBundleURL(forScopeKey scopeKey: String) -> URL? {
    lock.lock()
    defer { lock.unlock() }
    return patchedBundleURLsByScopeKey[scopeKey]
  }

  /// Reads while holding the registry lock so a concurrent replacement can't
  /// delete the file between URL lookup and the loader's disk read.
  @objc public static func patchedBundleData(forScopeKey scopeKey: String) -> Data? {
    lock.lock()
    defer { lock.unlock() }
    guard let url = patchedBundleURLsByScopeKey[scopeKey] else { return nil }
    return try? Data(contentsOf: url)
  }

  static func setPatchedBundleURL(_ url: URL, forScopeKey scopeKey: String) {
    lock.lock()
    let previous = patchedBundleURLsByScopeKey[scopeKey]
    patchedBundleURLsByScopeKey[scopeKey] = url
    lock.unlock()
    if let previous, previous != url {
      try? FileManager.default.removeItem(at: previous)
    }
  }

  static func clear() {
    lock.lock()
    let urls = patchedBundleURLsByScopeKey.values
    patchedBundleURLsByScopeKey.removeAll()
    lock.unlock()
    for url in urls {
      try? FileManager.default.removeItem(at: url)
    }
  }
}
