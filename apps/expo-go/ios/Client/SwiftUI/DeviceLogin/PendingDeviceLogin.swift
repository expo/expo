// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Not persisted: a device code lives ten minutes. Keyed by project URL so a cancelled sign in cannot resurface on a different project.
@objc(EXPendingDeviceLogin)
public final class PendingDeviceLogin: NSObject {
  @objc public static let shared = PendingDeviceLogin()

  private let lock = NSLock()
  private var storedURI: URL?
  private var storedProjectURL: URL?
  private var hasOffered = false

  private override init() {
    super.init()
  }

  /// The URI while it is stored, offered or not. The mismatch error reads this after the sheet has
  /// already been declined.
  @objc(currentForProjectURL:)
  public func current(forProjectURL projectURL: URL) -> URL? {
    lock.lock()
    defer { lock.unlock() }
    return matches(projectURL) ? storedURI : nil
  }

  /// The URI the first time only. Returning it once is what stops the open loop from re-presenting.
  @objc(offerOnceForProjectURL:)
  public func offerOnce(forProjectURL projectURL: URL) -> URL? {
    lock.lock()
    defer { lock.unlock() }
    guard matches(projectURL), !hasOffered, let storedURI else {
      return nil
    }
    hasOffered = true
    return storedURI
  }

  @objc(setURI:forProjectURL:)
  public func set(_ uri: URL?, forProjectURL projectURL: URL) {
    guard let uri else {
      clear()
      return
    }
    lock.lock()
    defer { lock.unlock() }
    hasOffered = false
    storedURI = uri
    storedProjectURL = projectURL
  }

  @objc public func clear() {
    lock.lock()
    defer { lock.unlock() }
    storedURI = nil
    storedProjectURL = nil
    hasOffered = false
  }

  private func matches(_ projectURL: URL) -> Bool {
    storedProjectURL?.absoluteString == projectURL.absoluteString
  }
}
