// Copyright 2015-present 650 Industries. All rights reserved.

@objc(DevMenuInternalModule)
public class DevMenuInternalModule: NSObject, RCTBridgeModule {
  public static func moduleName() -> String! {
    return "ExpoDevMenuInternal"
  }

  let manager: DevMenuManager

  init(manager: DevMenuManager) {
    self.manager = manager
  }

  // MARK: JavaScript API

  @objc
  func dispatchActionAsync(_ actionId: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    if actionId == nil {
      return reject("ERR_DEVMENU_ACTION_FAILED", "Action ID not provided.", nil)
    }
    manager.dispatchAction(withId: actionId)
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
}
