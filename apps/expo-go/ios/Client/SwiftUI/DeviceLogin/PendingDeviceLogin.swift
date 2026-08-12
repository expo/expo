// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Not persisted: a device code lives ten minutes, so a stale pending sign in would only produce `expired_token`.
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
