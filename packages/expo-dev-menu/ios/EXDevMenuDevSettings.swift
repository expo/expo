// Copyright 2015-present 650 Industries. All rights reserved.


import Foundation

class EXDevMenuDevSettings: NSObject {
  
  public static func getDevSettings() -> [String: Bool] {
    var devSettings: [String: Bool] = [:];
    
    devSettings["isDebuggingRemotely"] = false
    devSettings["isElementInspectorShown"] = false;
    devSettings["isHotLoadingEnabled"] = false;
    devSettings["isPerfMonitorShown"] = false;
    
    devSettings["isRemoteDebuggingAvailable"] = false;
    devSettings["isElementInspectorAvailable"] = false;
    devSettings["isHotLoadingAvailable"] = false;
    devSettings["isPerfMonitorAvailable"] = false;
    devSettings["isJSInspectorAvailable"] = false
    
    let manager = DevMenuManager.shared
    
    if let bridge = manager.currentBridge,
        let bridgeSettings = bridge.module(forName: "DevSettings") as? RCTDevSettings {
      
      
      let perfMonitor = bridge.module(forName: "PerfMonitor")
      let isPerfMonitorAvailable = perfMonitor != nil
      
      devSettings["isDebuggingRemotely"] = bridgeSettings.isDebuggingRemotely;
      devSettings["isElementInspectorShown"] = bridgeSettings.isElementInspectorShown;
      devSettings["isHotLoadingEnabled"] = bridgeSettings.isHotLoadingEnabled;
      devSettings["isPerfMonitorShown"] = bridgeSettings.isPerfMonitorShown;
      devSettings["isRemoteDebuggingAvailable"] = bridgeSettings.isRemoteDebuggingAvailable
      devSettings["isHotLoadingAvailable"] = bridgeSettings.isHotLoadingAvailable
      devSettings["isPerfMonitorAvailable"] = isPerfMonitorAvailable
      devSettings["isJSInspectorAvailable"] = bridge.batched.isInspectable
       
      let isElementInspectorAvailable = manager.currentManifest?.isDevelopmentMode()
      devSettings["isElementInspectorAvailable"] = isElementInspectorAvailable
    }
    
    return devSettings
  }
  
}
