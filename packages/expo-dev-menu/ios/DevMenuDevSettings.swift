// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
open class DevMenuDevSettings: NSObject {
  
  @objc
  static public let shared = DevMenuDevSettings()
  
  @objc
  public func getSettings() -> [String: Bool] {
    var devSettings: [String: Bool] = [:]
    
    devSettings["isDebuggingRemotely"] = false
    devSettings["isElementInspectorShown"] = false
    devSettings["isHotLoadingEnabled"] = false
    devSettings["isPerfMonitorShown"] = false
    
    if let bridge = DevMenuManager.shared.currentBridge {
      if let currentDevSettings = bridge.module(forName: "DevSettings") as? RCTDevSettings {
        devSettings["isDebuggingRemotely"] = currentDevSettings.isDebuggingRemotely
        devSettings["isElementInspectorShown"] = currentDevSettings.isElementInspectorShown
        devSettings["isHotLoadingEnabled"] = currentDevSettings.isHotLoadingEnabled
        devSettings["isPerfMonitorShown"] = currentDevSettings.isPerfMonitorShown
      }
    }
    
    return devSettings
  }
  
  @objc
  public func reload() {
    // Without this the `expo-splash-screen` will reject
    // No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.
    DevMenuManager.shared.hideMenu()
    DevMenuManager.shared.currentBridge?.requestReload()
  }
  
  
  @objc
  public func toggleElementInspector() {
    if let devSettings = DevMenuManager.shared.currentBridge?.module(forName: "DevSettings") as? RCTDevSettings {
      devSettings.toggleElementInspector()
    }
  }
  
  @objc
  public func togglePerformanceMonitor() {
    #if DEBUG
    if let bridge = DevMenuManager.shared.currentBridge,
      let devSettings = bridge.module(forName: "DevSettings") as? RCTDevSettings,
       let perfMonitor = bridge.module(forName: "PerfMonitor") as? RCTPerfMonitor {
      DispatchQueue.main.async {
        devSettings.isPerfMonitorShown ? perfMonitor.hide() : perfMonitor.show()
        devSettings.isPerfMonitorShown = !devSettings.isPerfMonitorShown
      }
    }
    #endif
  }
  
  @objc
  public func toggleFastRefresh() {
    if let devSettings = DevMenuManager.shared.currentBridge?.module(forName: "DevSettings") as? RCTDevSettings {
      devSettings.isHotLoadingEnabled = !devSettings.isHotLoadingEnabled
    }
  }
  
  @objc
  public func toggleRemoteDebugging() {
    if let devSettings = DevMenuManager.shared.currentBridge?.module(forName: "DevSettings") as? RCTDevSettings {
      DispatchQueue.main.async {
        devSettings.isDebuggingRemotely = !devSettings.isDebuggingRemotely
      }
    }
  }
}
