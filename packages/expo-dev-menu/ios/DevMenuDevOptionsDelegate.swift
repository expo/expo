// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

class DevMenuDevOptionsDelegate {
  internal private(set) weak var bridge: RCTBridge?
  internal private(set) weak var devSettings: RCTDevSettings?

  #if DEBUG
  internal private(set) weak var perfMonitor: RCTPerfMonitor?
  #endif

  internal init(forBridge bridge: RCTBridge) {
    self.bridge = bridge
    devSettings = bridge.module(forName: "DevSettings") as? RCTDevSettings

    #if DEBUG
    perfMonitor = bridge.module(forName: "PerfMonitor") as? RCTPerfMonitor
    #endif
  }

  internal func reload() {
    // Without this the `expo-splash-screen` will reject
    // No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.
    DevMenuManager.shared.hideMenu()

    bridge?.requestReload()
  }

  internal func toggleElementInsector() {
    devSettings?.toggleElementInspector()
  }

  internal func toggleRemoteDebugging() {
    guard let devSettings = devSettings else {
      return
    }

    DispatchQueue.main.async {
      devSettings.isDebuggingRemotely = !devSettings.isDebuggingRemotely
    }
  }

  internal func togglePerformanceMonitor() {
    #if DEBUG
    guard let perfMonitor = perfMonitor else {
      return
    }

    guard let devSettings = devSettings else {
      return
    }

    DispatchQueue.main.async {
      devSettings.isPerfMonitorShown ? perfMonitor.hide() : perfMonitor.show()
      devSettings.isPerfMonitorShown = !devSettings.isPerfMonitorShown
    }
    #endif
  }

  internal func toggleFastRefresh() {
    guard let devSettings = devSettings else {
      return
    }

    devSettings.isHotLoadingEnabled = !devSettings.isHotLoadingEnabled
  }
}
