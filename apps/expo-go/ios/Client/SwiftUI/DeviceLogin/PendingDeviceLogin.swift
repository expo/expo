// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Not persisted: a device code lives ten minutes. Keyed by project URL so a cancelled sign in cannot resurface on a different project.
@objc(EXPendingDeviceLogin)
public final class PendingDeviceLogin: NSObject {
  @objc public static let shared = PendingDeviceLogin()

  private let lock = NSLock()
  private var storedURI: URL?
  private var storedProjectURL: URL?

  private override init() {
    super.init()
  }

  @objc(currentForProjectURL:)
  public func current(forProjectURL projectURL: URL) -> URL? {
    lock.lock()
    defer { lock.unlock() }
    guard storedProjectURL?.absoluteString == projectURL.absoluteString else {
      return nil
    }
    return storedURI
  }

  @objc(setURI:forProjectURL:)
  public func set(_ uri: URL?, forProjectURL projectURL: URL) {
    lock.lock()
    defer { lock.unlock() }
    guard let uri else {
      storedURI = nil
      storedProjectURL = nil
      return
    }
    storedURI = uri
    storedProjectURL = projectURL
  }

  @objc public func clear() {
    lock.lock()
    defer { lock.unlock() }
    storedURI = nil
    storedProjectURL = nil
  }
}
