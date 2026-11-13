// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc(EXSession)
@objcMembers
public final class Session: NSObject {
  public static let sharedInstance = Session()

  private override init() {
    super.init()
  }

  public func sessionSecret() -> String? {
    SessionStore.shared.activeLiveSession?.sessionSecret
  }
}
