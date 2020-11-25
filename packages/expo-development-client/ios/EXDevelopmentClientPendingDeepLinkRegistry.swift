// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class EXDevelopmentClientPendingDeepLinkRegistry : NSObject {
  private var listeners: [EXDevelopmentClientPendingDeepLinkListener] = []
  
  @objc
  public var pendingDeepLink: URL? {
    didSet {
      if (pendingDeepLink != nil) {
        listeners.forEach { $0.onNewPendingDeepLink(pendingDeepLink!) }
      }
    }
  }
  
  @objc
  public func subscribe(_ listener: EXDevelopmentClientPendingDeepLinkListener) {
    self.listeners.append(listener)
  }
  
  @objc
  public func unsubscribe(_ listener: EXDevelopmentClientPendingDeepLinkListener) {
    self.listeners.removeAll { $0 === listener }
  }
  
  @objc
  public func consumePendingDeepLink() -> URL? {
    let result = pendingDeepLink
    pendingDeepLink = nil
    return result
  }
}
