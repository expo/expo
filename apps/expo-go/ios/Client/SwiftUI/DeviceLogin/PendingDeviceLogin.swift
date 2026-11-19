// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Not persisted: a device code lives ten minutes. Keyed by project URL so a cancelled sign in cannot resurface on a different project.
@objc(EXPendingDeviceLogin)
public final class PendingDeviceLogin: NSObject {
  @objc public static let shared = PendingDeviceLogin()

  private let lock = NSLock()
  private var pendingProjectURL: URL?
  private var storedURI: URL?
  private var hasOffered = false

  private override init() {
    super.init()
  }

  @objc(hasPendingForProjectURL:)
  public func hasPending(forProjectURL projectURL: URL) -> Bool {
    lock.lock()
    defer { lock.unlock() }
    return matches(projectURL)
  }

  /// Nil either when nothing is pending for this project or when the prompt came without an override.
  @objc(verificationURIForProjectURL:)
  public func verificationURI(forProjectURL projectURL: URL) -> URL? {
    lock.lock()
    defer { lock.unlock() }
    return matches(projectURL) ? storedURI : nil
  }

  /// True the first time only. Answering once is what stops the open loop from re-presenting.
  @objc(offerOnceForProjectURL:)
  public func offerOnce(forProjectURL projectURL: URL) -> Bool {
    lock.lock()
    defer { lock.unlock() }
    guard matches(projectURL), !hasOffered else {
      return false
    }
    hasOffered = true
    return true
  }

  @objc(setPending:verificationURI:forProjectURL:)
  public func setPending(_ pending: Bool, verificationURI uri: URL?, forProjectURL projectURL: URL) {
    lock.lock()
    defer { lock.unlock() }
    hasOffered = false
    pendingProjectURL = pending ? projectURL : nil
    storedURI = pending ? uri : nil
  }

  @objc public func clear() {
    lock.lock()
    defer { lock.unlock() }
    pendingProjectURL = nil
    storedURI = nil
    hasOffered = false
  }

  private func matches(_ projectURL: URL) -> Bool {
    pendingProjectURL?.absoluteString == projectURL.absoluteString
  }
}
