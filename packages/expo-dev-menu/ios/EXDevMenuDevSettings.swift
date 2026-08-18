// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import React
import ExpoModulesCore

class EXDevMenuDevSettings: NSObject {
  static func getDevSettings() -> [String: Bool] {
    var devSettings: [String: Bool] = [:]

    devSettings["isElementInspectorShown"] = false
    devSettings["isHotLoadingEnabled"] = false
    devSettings["isPerfMonitorShown"] = false

    devSettings["isElementInspectorAvailable"] = false
    devSettings["isHotLoadingAvailable"] = false
    devSettings["isPerfMonitorAvailable"] = false
    devSettings["isJSInspectorAvailable"] = false

    let manager = DevMenuManager.shared

    if let bridgeSettings: RCTDevSettings = manager.currentAppContext?.nativeModule(named: "DevSettings") {
      #if !os(macOS)
        let perfMonitorModule: NSObject? = manager.currentAppContext?.nativeModule(named: "PerfMonitor")
        let isPerfMonitorAvailable: Bool = perfMonitorModule != nil
      #else
        let isPerfMonitorAvailable = false
      #endif

      devSettings["isElementInspectorShown"] = bridgeSettings.isElementInspectorShown
      devSettings["isHotLoadingEnabled"] = bridgeSettings.isHotLoadingEnabled
      devSettings["isPerfMonitorShown"] = bridgeSettings.isPerfMonitorShown
      devSettings["isHotLoadingAvailable"] = bridgeSettings.isHotLoadingAvailable
      devSettings["isPerfMonitorAvailable"] = isPerfMonitorAvailable && manager.currentManifest?.isDevelopmentMode() == true
      devSettings["isJSInspectorAvailable"] = bridgeSettings.isDeviceDebuggingAvailable

      let isElementInspectorAvailable = manager.currentManifest?.isDevelopmentMode()
      devSettings["isElementInspectorAvailable"] = isElementInspectorAvailable
    }

    return devSettings
  }
}
