// Copyright 2015-present 650 Industries. All rights reserved.

import EXDevMenuInterface
import Foundation

/**
 Routes component-switching requests from the dev menu's Components section to `DevMenuHostDelegate`

 The actual remount logic lives in expo-dev-launcher`. Without a host
 delegate that implements `devMenuSwitchToComponent`, the swap is a no-op.
 */
@objc
public class DevMenuComponentSwitcher: NSObject {
  @objc public static let shared = DevMenuComponentSwitcher()

  private static let switchSelector = #selector(DevMenuHostDelegate.devMenuSwitchToComponent(_:))
  private static let currentSelector = #selector(DevMenuHostDelegate.devMenuCurrentComponentName)

  /**
   Returns the `moduleName` of the currently mounted React component, if the
   host delegate reports one.
   */
  @objc public func currentModuleName() -> String? {
    guard let delegate = DevMenuManager.shared.hostDelegate,
          delegate.responds(to: Self.currentSelector) else {
      return nil
    }
    return delegate.devMenuCurrentComponentName?()
  }

  /**
   Asks the host delegate to swap the active React component. Returns `true`
   if the delegate handled the swap; `false` if no delegate is registered or
   it declined.
   */
  @objc @discardableResult
  public func switchToComponent(_ moduleName: String) -> Bool {
    guard let delegate = DevMenuManager.shared.hostDelegate,
          delegate.responds(to: Self.switchSelector) else {
      NSLog(
        "[ExpoDevMenu] No DevMenuHostDelegate implements devMenuSwitchToComponent(_:). "
        + "Install one (e.g. via expo-dev-launcher) to enable component switching."
      )
      return false
    }
    if delegate.devMenuSwitchToComponent?(moduleName) == true {
      return true
    }
    NSLog("[ExpoDevMenu] DevMenuHostDelegate declined to switch to '%@'.", moduleName)
    return false
  }
}
