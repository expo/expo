// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Per-scope-key interceptor prelude for published-project edits. The loader
/// prepends it to the bundle in memory at load, so edits never touch the
/// updates cache or write a bundle copy to disk.
@objc(EXPatchedBundleRegistry)
public final class PatchedBundleRegistry: NSObject {
  private static let lock = NSLock()
  private static var interceptorsByScopeKey: [String: Data] = [:]

  @objc public static func interceptor(forScopeKey scopeKey: String) -> Data? {
    lock.lock()
    defer { lock.unlock() }
    return interceptorsByScopeKey[scopeKey]
  }

  static func setInterceptor(_ interceptor: Data, forScopeKey scopeKey: String) {
    lock.lock()
    defer { lock.unlock() }
    interceptorsByScopeKey[scopeKey] = interceptor
  }

  static func clear() {
    lock.lock()
    defer { lock.unlock() }
    interceptorsByScopeKey.removeAll()
  }
}
