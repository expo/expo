// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public protocol DevMenuHostDelegate: NSObjectProtocol {
  /**
   Optional function to navigate the host application to its home screen.
   */
  @objc optional func devMenuNavigateHome()

  /**
   Optional function to toggle the performance monitor.
   */
  @objc optional func devMenuTogglePerformanceMonitor()

  /**
   Optional function to toggle the element inspector.
   */
  @objc optional func devMenuToggleElementInspector()

  /**
   Optional function to control whether the "Open React Native dev menu" option is shown.
   Defaults to `true` if not implemented.
   */
  @objc optional func devMenuShouldShowReactNativeDevMenu() -> Bool

  /**
   Optional function to swap the active React component for the one registered
   under `moduleName` in `AppRegistry`.
   Returning `true` indicates the swap was handled; returning `false` (or not implementing this)
   makes the dev menu fall back to its own best-effort swap.
   */
  @objc optional func devMenuSwitchToComponent(_ moduleName: String) -> Bool

  /**
   Optional function returning the `moduleName` of the React component the host
   is currently rendering. Used by the dev menu to mark the active entry in its
   Components list.
   */
  @objc optional func devMenuCurrentComponentName() -> String?
}
