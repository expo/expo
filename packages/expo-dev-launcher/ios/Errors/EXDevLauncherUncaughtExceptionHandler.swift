// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class EXDevLauncherUncaughtExceptionHandler: NSObject {
  static private var defaultHandler: (@convention(c) (NSException) -> Swift.Void)?

  @objc
  public static var isInstalled: Bool = false {
    willSet {
      if isInstalled != newValue {
        if newValue {
          installHandler()
        } else {
          uninstallHandler()
        }
      }
    }
  }

  static func installHandler() {
    defaultHandler = NSGetUncaughtExceptionHandler()

    NSSetUncaughtExceptionHandler { exception in
      NSLog("DevLauncher tries to handle uncaught exception: %@", exception)
      NSLog("Stack Trace: %@", exception.callStackSymbols)
      EXDevLauncherUncaughtExceptionHandler.defaultHandler?(exception)
    }
  }

  static func uninstallHandler() {
    NSSetUncaughtExceptionHandler(defaultHandler)
  }
}
