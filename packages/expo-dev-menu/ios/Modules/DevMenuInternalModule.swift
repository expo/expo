// Copyright 2015-present 650 Industries. All rights reserved.

@objc(DevMenuInternalModule)
public class DevMenuInternalModule: NSObject, RCTBridgeModule {
  public static func moduleName() -> String! {
    return "ExpoDevMenuInternal"
  }

  private static var fontsWereLoaded = false;

  let manager: DevMenuManager

  init(manager: DevMenuManager) {
    self.manager = manager
  }

  // MARK: JavaScript API
  
  @objc
  func loadFontsAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    if (DevMenuInternalModule.fontsWereLoaded) {
      resolve(nil);
      return;
    }
    
    let fonts = ["MaterialCommunityIcons", "Ionicons"]
    for font in fonts {
      guard let path = DevMenuUtils.resourcesBundle()?.path(forResource: font, ofType: "ttf") else {
        reject("ERR_DEVMENU_CANNOT_FIND_FONT", "Font file for '\(font)' doesn't exist.", nil);
        return;
      }
      guard let data = FileManager.default.contents(atPath: path) else {
        reject("ERR_DEVMENU_CANNOT_OPEN_FONT_FILE", "Could not open '\(path)'.", nil);
        return;
      }
      
      guard let provider = CGDataProvider(data: data as CFData) else {
        reject("ERR_DEVMENU_CANNOT_CREATE_FONT_PROVIDER", "Could not create font provider for '\(font)'.", nil);
        return;
      }
      guard let cgFont = CGFont(provider) else {
        reject("ERR_DEVMENU_CANNOT_CREATE_FONT", "Could not create font for '\(font)'.", nil);
        return;
      }
        
      var error: Unmanaged<CFError>?
      if !CTFontManagerRegisterGraphicsFont(cgFont, &error) {
        reject("ERR_DEVMENU_CANNOT_ADD_FONT", "Could not create font from loaded data for '\(font)'. '\(error.debugDescription)'.", nil)
        return
      }
    }
    
    DevMenuInternalModule.fontsWereLoaded = true
    resolve(nil)
  }
  
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
