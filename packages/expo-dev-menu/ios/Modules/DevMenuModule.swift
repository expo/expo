// Copyright 2015-present 650 Industries. All rights reserved.

@objc(DevMenuModule)
open class DevMenuModule: NSObject {
  deinit {
    // cleanup registered callbacks when the bridge is deallocated to prevent these leaking into other (potentially unrelated) bridges
    if DevMenuManager.wasInitilized {
      DevMenuManager.shared.registeredCallbacks = []
    }
  }
  
  // MARK: JavaScript API

  @objc
  func openMenu() {
    DevMenuManager.shared.openMenu()
  }
  
  @objc
  func closeMenu() {
    DevMenuManager.shared.closeMenu()
  }
  
  @objc
  func hideMenu() {
    DevMenuManager.shared.hideMenu()
  }

  @objc
  func addDevMenuCallbacks(_ callbacks: [[String: Any]], resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    callbacks.forEach { callback in
      guard let name = callback["name"] as? String else {
        return
      }
      
      let shouldCollapse = callback["shouldCollapse"] as? Bool ?? true
      DevMenuManager.shared.registeredCallbacks.append(
        DevMenuManager.Callback(name: name, shouldCollapse: shouldCollapse)
      )
    }
    
    return resolve(nil)
  }
}
