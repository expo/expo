// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Carries the verification URI from `EXKernelLinkingManager.openUrl:`, which reads it, to
/// `ExpoGoHomeBridge` and `EXAppLoaderExpoUpdates`, which act on it.
///
/// Deliberately not persisted. A device code lives ten minutes, so a pending sign in that survived a
/// relaunch would only produce a confusing `expired_token`.
@objc(EXPendingDeviceLogin)
public final class PendingDeviceLogin: NSObject {
  @objc public static let shared = PendingDeviceLogin()

  private let lock = NSLock()
  private var storedURI: URL?

  private override init() {
    super.init()
  }

  @objc public var current: URL? {
    lock.lock()
    defer { lock.unlock() }
    return storedURI
  }

  @objc public func set(_ uri: URL?) {
    lock.lock()
    defer { lock.unlock() }
    storedURI = uri
  }

  @objc public func clear() {
    set(nil)
  }
}
