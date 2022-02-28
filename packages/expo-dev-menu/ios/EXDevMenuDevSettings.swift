// Copyright 2015-present 650 Industries. All rights reserved.


import Foundation

class EXDevMenuDevSettings: NSObject {
  
  public static func getDevSettings() -> [String: Bool] {
    var devSettings: [String: Bool] = [:];
    
    devSettings["isDebuggingRemotely"] = false
    devSettings["isElementInspectorShown"] = false;
    devSettings["isHotLoadingEnabled"] = false;
    devSettings["isPerfMonitorShown"] = false;
    
    let manager = DevMenuManager.shared
    
    if let bridge = manager.currentBridge,
        let bridgeSettings = bridge.module(forName: "DevSettings") as? RCTDevSettings {
      
      devSettings["isDebuggingRemotely"] = bridgeSettings.isDebuggingRemotely;
      devSettings["isElementInspectorShown"] = bridgeSettings.isElementInspectorShown;
      devSettings["isHotLoadingEnabled"] = bridgeSettings.isHotLoadingEnabled;
      devSettings["isPerfMonitorShown"] = bridgeSettings.isPerfMonitorShown;
    }
    
    return devSettings
  }
  
}
