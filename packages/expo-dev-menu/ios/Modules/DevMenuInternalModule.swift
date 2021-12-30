// Copyright 2015-present 650 Industries. All rights reserved.
import SafariServices

@objc(DevMenuInternalModule)
public class DevMenuInternalModule: NSObject, RCTBridgeModule {
  @objc
  var redirectResolve: RCTPromiseResolveBlock?
  @objc
  var redirectReject: RCTPromiseRejectBlock?
  @objc
  var authSession: SFAuthenticationSession?

  public static func moduleName() -> String! {
    return "ExpoDevMenuInternal"
  }

  // Module DevMenuInternalModule requires main queue setup since it overrides `constantsToExport`.
  public static func requiresMainQueueSetup() -> Bool {
    return true
  }

  private static var fontsWereLoaded = false
  private static let sessionKey = "expo-dev-menu.session"
  private static let userLoginEvent = "expo.dev-menu.user-login"
  private static let userLogoutEvent = "expo.dev-menu.user-logout"
  private static let defaultScheme = "expo-dev-menu"

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
  func loadFontsAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    if DevMenuInternalModule.fontsWereLoaded {
      resolve(nil)
      return
    }

    let fonts = ["MaterialCommunityIcons", "Ionicons"]
    for font in fonts {
      guard let path = DevMenuUtils.resourcesBundle()?.path(forResource: font, ofType: "ttf") else {
        reject("ERR_DEVMENU_CANNOT_FIND_FONT", "Font file for '\(font)' doesn't exist.", nil)
        return
      }
      guard let data = FileManager.default.contents(atPath: path) else {
        reject("ERR_DEVMENU_CANNOT_OPEN_FONT_FILE", "Could not open '\(path)'.", nil)
        return
      }

      guard let provider = CGDataProvider(data: data as CFData) else {
        reject("ERR_DEVMENU_CANNOT_CREATE_FONT_PROVIDER", "Could not create font provider for '\(font)'.", nil)
        return
      }
      guard let cgFont = CGFont(provider) else {
        reject("ERR_DEVMENU_CANNOT_CREATE_FONT", "Could not create font for '\(font)'.", nil)
        return
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
    guard let rctDevMenu = manager.session?.bridge.devMenu else {
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
  func setSessionAsync(_ session: [String: Any]?, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    do {
      try manager.expoSessionDelegate.setSessionAsync(session)
      resolve(nil)
    } catch let error {
      reject("ERR_DEVMENU_CANNOT_SAVE_SESSION", error.localizedDescription, error)
    }
  }

  @objc
  func restoreSessionAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    resolve(manager.expoSessionDelegate.restoreSession())
  }

  @objc
  func getAuthSchemeAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    guard let urlTypesArray = Bundle.main.infoDictionary?["CFBundleURLTypes"] as? [NSDictionary] else {
      resolve(DevMenuInternalModule.defaultScheme)
      return
    }

    if (urlTypesArray
          .contains(where: { ($0["CFBundleURLSchemes"] as? [String] ?? [])
                      .contains(DevMenuInternalModule.defaultScheme) })) {
      resolve(DevMenuInternalModule.defaultScheme)
      return
    }

    for urlType in urlTypesArray {
      guard let schemes = urlType["CFBundleURLSchemes"] as? [String] else {
        continue
      }

      if schemes.first != nil {
        resolve(schemes.first)
        return
      }
    }

    resolve(DevMenuInternalModule.defaultScheme)
  }
}
