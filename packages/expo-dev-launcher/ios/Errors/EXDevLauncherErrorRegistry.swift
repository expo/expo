// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class EXDevLauncherErrorInstance: NSObject {
  @objc
  public let timestamp: Int64
  @objc
  public let message: String
  @objc
  public let stack: String

  init(timestamp: Int64, message: String, stack: String) {
    self.timestamp = timestamp
    self.message = message
    self.stack = stack
  }

  @objc
  public func toDict() -> [String: Any] {
    return [
      "timestamp": timestamp,
      "message": message,
      "stack": stack
    ]
  }
}

@objc
public class EXDevLauncherErrorRegistry: NSObject {
  private static let Key = "expo.modules.devlauncher.errorregistry.SavedError"

  @objc
  public func storeException(_ exception: NSException) {
    let defaults = UserDefaults.standard
    defaults.set([
      "timestamp": getCurrentTimestamp(),
      "message": exception.description,
      "stack": exception.callStackSymbols.joined(separator: "\n")
    ], forKey: EXDevLauncherErrorRegistry.Key)
  }

  @objc
  public func consumeException() -> EXDevLauncherErrorInstance? {
    let defaults = UserDefaults.standard
    guard let savedException = defaults.dictionary(forKey: EXDevLauncherErrorRegistry.Key) else {
      return nil
    }

    defaults.removeObject(forKey: EXDevLauncherErrorRegistry.Key)

    guard let timestamp = savedException["timestamp"] as? Int64 else {
      return nil
    }

    guard let message = savedException["message"] as? String else {
      return nil
    }

    guard let stack = savedException["stack"] as? String else {
      return nil
    }

    return EXDevLauncherErrorInstance(timestamp: timestamp, message: message, stack: stack)
  }

  private func getCurrentTimestamp() -> Int64 {
    return Int64(Date().timeIntervalSince1970 * 1000)
  }
}
