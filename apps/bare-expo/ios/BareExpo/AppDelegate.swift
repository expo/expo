//
//  AppDelegate.swift
//  BareExpo
//
//  Created by the Expo team on 5/27/20.
//  Copyright © 2020 Expo. All rights reserved.
//

import Foundation

@UIApplicationMain
class AppDelegate: UMAppDelegateWrapper {
  var moduleRegistryAdapter: UMModuleRegistryAdapter!
  
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    ensureReactMethodSwizzlingSetUp()

    moduleRegistryAdapter = UMModuleRegistryAdapter(moduleRegistryProvider: UMModuleRegistryProvider())
    
    window = UIWindow(frame: UIScreen.main.bounds)

    if let bridge = RCTBridge(delegate: self, launchOptions: launchOptions) {
      let rootView = RCTRootView(bridge: bridge, moduleName: "BareExpo", initialProperties: nil)
      let rootViewController = UIViewController()
      rootView.backgroundColor = UIColor.white
      rootViewController.view = rootView
      
      window?.rootViewController = rootViewController
      window?.makeKeyAndVisible()
    }

    super.application(application, didFinishLaunchingWithOptions: launchOptions)
    
    return true
  }
  
  #if RCT_DEV
  func bridge(_ bridge: RCTBridge!, didNotFindModule moduleName: String!) -> Bool {
    return true
  }
  #endif
  
  override func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    return RCTLinkingManager.application(app, open: url, options: options)
  }
  
  // Bring back React method swizzling removed from its Pod
  // when integrating with Expo client.
  // https://github.com/expo/react-native/commit/7f2912e8005ea6e81c45935241081153b822b988
  func ensureReactMethodSwizzlingSetUp() {
    Dispatch.once {
      // RCTKeyCommands.m
      // swizzle UIResponder
      RCTSwapInstanceMethods(UIResponder.self,
                             #selector(getter: UIResponder.keyCommands),
                             Selector(("RCT_keyCommands")))

      // RCTDevMenu.m
      // We're swizzling here because it's poor form to override methods in a category,
      // however UIWindow doesn't actually implement motionEnded:withEvent:, so there's
      // no need to call the original implementation.
      RCTSwapInstanceMethods(UIWindow.self,
                             #selector(UIResponder.motionEnded(_:with:)),
                             Selector(("RCT_motionEnded:withEvent:")))
    }
  }
}

// MARK: - RCTBridgeDelegate

extension AppDelegate: RCTBridgeDelegate {
  func sourceURL(for bridge: RCTBridge!) -> URL! {
    // DEBUG must be setup in Swift projects: https://stackoverflow.com/a/24112024/4047926
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings()?.jsBundleURL(forBundleRoot: "index", fallbackResource: nil)
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
  
  func extraModules(for bridge: RCTBridge!) -> [RCTBridgeModule]! {
    var extraModules = moduleRegistryAdapter.extraModules(for: bridge)
    // You can inject any extra modules that you would like here, more information at:
    // https://facebook.github.io/react-native/docs/native-modules-ios.html#dependency-injection

    // RCTDevMenu was removed when integrating React with Expo client:
    // https://github.com/expo/react-native/commit/7f2912e8005ea6e81c45935241081153b822b988
    // Let's bring it back in Bare Expo.
    extraModules?.append(RCTDevMenu() as! RCTBridgeModule)
    
    // Add AsyncStorage back to the project
    // https://github.com/expo/react-native/commit/bd1396034319e6e59f960fac7aeca1f483c2052d
    let documentDirectory = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true).first! as NSString
    let storageDirectory = documentDirectory.appendingPathComponent("RCTAsyncLocalStorage_V1")
    extraModules?.append(RCTAsyncLocalStorage(storageDirectory: storageDirectory))
    return extraModules
  }
}
