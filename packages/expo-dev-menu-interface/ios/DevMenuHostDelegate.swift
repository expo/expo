// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public protocol DevMenuHostDelegate: NSObjectProtocol {
  /**
   Optional function to navigate the host application to its home screen.
   */
  @objc optional func devMenuNavigateHome()

  /**
   Optional function to reload the current application.
   If not implemented, falls back to ExpoModulesCore's reloadAppAsync.
   */
  @objc optional func devMenuReload()

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
}
