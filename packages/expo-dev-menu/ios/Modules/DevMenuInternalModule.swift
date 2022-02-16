// Copyright 2015-present 650 Industries. All rights reserved.
import SafariServices

@objc(DevMenuInternalModule)
public class DevMenuInternalModule: NSObject, RCTBridgeModule {
  public static func moduleName() -> String! {
    return "ExpoDevMenuInternal"
  }

  // Module DevMenuInternalModule requires main queue setup since it overrides `constantsToExport`.
  public static func requiresMainQueueSetup() -> Bool {
    return true
  }

  let manager: DevMenuManager

  public override init() {
    self.manager = DevMenuManager.shared
  }

  // MARK: JavaScript API

  @objc
  public func constantsToExport() -> [AnyHashable: Any] {
#if targetEnvironment(simulator)
    let doesDeviceSupportKeyCommands = true
#else
    let doesDeviceSupportKeyCommands = false
#endif
    return ["doesDeviceSupportKeyCommands": doesDeviceSupportKeyCommands]
  }


  @objc
  func hideMenu() {
    manager.hideMenu()
  }

  @objc
  func setOnboardingFinished(_ finished: Bool) {
    DevMenuSettings.isOnboardingFinished = finished
  }

  @objc
  func getSettingsAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    resolve(DevMenuSettings.serialize())
  }

  @objc
  func setSettingsAsync(_ dict: [String: Any], resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    if let motionGestureEnabled = dict["motionGestureEnabled"] as? Bool {
      DevMenuSettings.motionGestureEnabled = motionGestureEnabled
    }
    if let touchGestureEnabled = dict["touchGestureEnabled"] as? Bool {
      DevMenuSettings.touchGestureEnabled = touchGestureEnabled
    }
    if let keyCommandsEnabled = dict["keyCommandsEnabled"] as? Bool {
      DevMenuSettings.keyCommandsEnabled = keyCommandsEnabled
    }
    if let showsAtLaunch = dict["showsAtLaunch"] as? Bool {
      DevMenuSettings.showsAtLaunch = showsAtLaunch
    }
  }

  @objc
  func openDevMenuFromReactNative() {
    guard let rctDevMenu = manager.currentBridge?.devMenu else {
      return
    }

    DispatchQueue.main.async {
      rctDevMenu.show()
    }
  }

  @objc
  func onScreenChangeAsync(_ currentScreen: String?, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    manager.setCurrentScreen(currentScreen)
    resolve(nil)
  }

  @objc
  func getAppInfoAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    if let bridge = manager.currentBridge {
      let manifest = manager.currentManifest
      
      let appInfo = EXDevMenuAppInfo.getFor(bridge, andManifest: manifest as Any as! [AnyHashable : Any])
      
      let hostUrl = manager.currentManifestURL?.absoluteString
          
      resolve([
        "appName": appInfo["appName"],
        "appIcon": appInfo["appIcon"],
        "appVersion": appInfo["appVersion"],
        "runtimeVersion": appInfo["runtimeVersion"],
        "sdkVersion": appInfo["sdkVersion"],
        "hostUrl": hostUrl,
      ])
    } else {
      reject("E_MISSING_BRIDGE", "DevMenuManager does not have a currentBridge - getAppInfoAsync() ", nil);
    }
  }
  
  @objc
  func getDevSettingsAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    resolve(DevMenuDevSettings.shared.getSettings())
  }
  
  @objc
  func toggleElementInspectorAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    DevMenuDevSettings.shared.toggleElementInspector()
    resolve(nil)
  }
  
  @objc
  func togglePerformanceMonitorAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    DevMenuDevSettings.shared.togglePerformanceMonitor()
    resolve(nil)
  }
  
  @objc
  func reloadAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    DevMenuDevSettings.shared.reload()
    resolve(nil)
  }
  
  @objc
  func toggleDebugRemoteJSAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    DevMenuDevSettings.shared.toggleRemoteDebugging()
    resolve(nil)
  }
  
  @objc
  func toggleFastRefreshAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    DevMenuDevSettings.shared.toggleFastRefresh()
    resolve(nil)

  }
  
  @objc
  func navigateToLauncherAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    if let launcherDelegate = manager.devMenuLauncherDelegate {
      DispatchQueue.main.async {
        launcherDelegate.navigateToLauncher()
      }
      
      resolve(nil)
      return
    }
    
    reject("E_MISSING_DELEGATE", "DevMenuManager does not have a delegate for navigateToLauncher() ", nil);
  }
}
