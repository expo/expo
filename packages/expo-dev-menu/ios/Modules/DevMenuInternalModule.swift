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

  init(manager: DevMenuManager) {
    self.manager = manager
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
  func fetchDataSourceAsync(_ dataSourceId: String?, resolve: @escaping RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    guard let dataSourceId = dataSourceId else {
      return reject("ERR_DEVMENU_DATA_SOURCE_FAILED", "DataSource ID not provided.", nil)
    }

    for dataSource in manager.devMenuDataSources {
      if dataSource.id == dataSourceId {
        dataSource.fetchData { data in
          resolve(data.map { $0.serialize() })
        }
        return
      }
    }

    return reject("ERR_DEVMENU_DATA_SOURCE_FAILED", "DataSource \(dataSourceId) not founded.", nil)
  }

  @objc
  func dispatchCallableAsync(_ callableId: String?, args: [String: Any]?, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    guard let callableId = callableId else {
      return reject("ERR_DEVMENU_ACTION_FAILED", "Callable ID not provided.", nil)
    }
    manager.dispatchCallable(withId: callableId, args: args)
    resolve(nil)
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
  func getDevSettingsAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    if let bridge = manager.currentBridge {
      if let devSettings = bridge.module(forName: "DevSettings") as? RCTDevSettings {
        resolve([
          "isDebuggingRemotely": devSettings.isDebuggingRemotely,
          "isElementInspectorShown": devSettings.isElementInspectorShown,
          "isHotLoadingEnabled": devSettings.isHotLoadingEnabled,
          "isPerfMonitorShown": devSettings.isPerfMonitorShown,
        ])
      }
      
    } else {
      reject("E_MISSING_BRIDGE", "DevMenuManager does not have a currentBridge - getDevSettingsAsync() ", nil);
    }
  }
}
