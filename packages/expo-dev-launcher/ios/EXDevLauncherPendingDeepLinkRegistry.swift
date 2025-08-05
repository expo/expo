// Copyright 2015-present 650 Industries. All rights reserved.

// swiftlint:disable force_unwrapping
import Foundation

@objc
public class EXDevLauncherPendingDeepLinkRegistry: NSObject {
  private var listeners: [EXDevLauncherPendingDeepLinkListener] = []

  @objc
  public var pendingDeepLink: URL? {
    didSet {
      if pendingDeepLink != nil {
        listeners.forEach { $0.onNewPendingDeepLink(pendingDeepLink!) }
      }
    }
  }

  public func subscribe(_ listener: EXDevLauncherPendingDeepLinkListener) {
    self.listeners.append(listener)
  }

  public func unsubscribe(_ listener: EXDevLauncherPendingDeepLinkListener) {
    self.listeners.removeAll { $0 === listener }
  }

  @objc
  public func consumePendingDeepLink() -> URL? {
    let result = pendingDeepLink
    pendingDeepLink = nil
    return result
  }
}
// swiftlint:enable force_unwrapping
