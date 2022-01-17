//
//  AppDelegate.swift
//  BareExpo
//
//  Created by the Expo team on 5/27/20.
//  Copyright © 2020 Expo. All rights reserved.
//

import Foundation
import ExpoModulesCore
import EXDevMenuInterface
#if EX_DEV_MENU_ENABLED
import EXDevMenu
#endif

#if FB_SONARKIT_ENABLED && canImport(FlipperKit)
import FlipperKit
#endif

@UIApplicationMain
class AppDelegate: ExpoAppDelegate, RCTBridgeDelegate, EXDevLauncherControllerDelegate {
  var bridge: RCTBridge?
  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?

  let useDevClient: Bool = false
  
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    initializeFlipper(with: application)
    window = UIWindow(frame: UIScreen.main.bounds)
    self.launchOptions = launchOptions;

    if (useDevClient) {
      let controller = EXDevLauncherController.sharedInstance()
      controller.start(with: window!, delegate: self, launchOptions: launchOptions);
    } else {
      initializeReactNativeBridge(launchOptions);
    }

    super.application(application, didFinishLaunchingWithOptions: launchOptions)
    
    return true
  }

  @discardableResult
  func initializeReactNativeBridge(_ launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> RCTBridge {
    let bridge = reactDelegate.createBridge(delegate: self, launchOptions: launchOptions)
    let rootView = reactDelegate.createRootView(bridge: bridge, moduleName: "main", initialProperties: nil)
    let rootViewController = reactDelegate.createRootViewController()
    rootView.backgroundColor = UIColor.white
    rootViewController.view = rootView

    window?.rootViewController = rootViewController
    window?.makeKeyAndVisible()
    self.bridge = bridge
    return bridge
  }
  
  #if RCT_DEV
  func bridge(_ bridge: RCTBridge!, didNotFindModule moduleName: String!) -> Bool {
    return true
  }
  #endif
  
  override func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    if (useDevClient && EXDevLauncherController.sharedInstance().onDeepLink(url, options: options)) {
      return true;
    }
    
    return RCTLinkingManager.application(app, open: url, options: options)
  }
  
  private func initializeFlipper(with application: UIApplication) {
  #if FB_SONARKIT_ENABLED && canImport(FlipperKit)
    let client = FlipperClient.shared()
    let layoutDescriptorMapper = SKDescriptorMapper(defaults: ())
    client?.add(FlipperKitLayoutPlugin(rootNode: application, with: layoutDescriptorMapper!))
    client?.add(FKUserDefaultsPlugin(suiteName: nil))
    client?.add(FlipperKitReactPlugin())
    client?.add(FlipperKitNetworkPlugin(networkAdapter: SKIOSNetworkAdapter()))
    client?.start()
  #endif
  }

  // MARK: - RCTBridgeDelegate

  func sourceURL(for bridge: RCTBridge!) -> URL! {
    // DEBUG must be setup in Swift projects: https://stackoverflow.com/a/24112024/4047926
    #if DEBUG
    if (useDevClient) {
      return EXDevLauncherController.sharedInstance().sourceUrl()
    } else {
      return RCTBundleURLProvider.sharedSettings()?.jsBundleURL(forBundleRoot: "index", fallbackResource: nil)
    }
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }

  func extraModules(for bridge: RCTBridge!) -> [RCTBridgeModule] {
    var extraModules = [RCTBridgeModule]()
    // You can inject any extra modules that you would like here, more information at:
    // https://facebook.github.io/react-native/docs/native-modules-ios.html#dependency-injection

    return extraModules
  }

  // MARK: - EXDevelopmentClientControllerDelegate

  func devLauncherController(_ developmentClientController: EXDevLauncherController, didStartWithSuccess success: Bool) {
    developmentClientController.appBridge = initializeReactNativeBridge(developmentClientController.getLaunchOptions())
  }
}
