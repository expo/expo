import Expo
import React
import ReactAppDependencyProvider

public class AppDelegate: ExpoAppDelegate {
  public override func applicationDidFinishLaunching(_ notification: Notification) {
    self.moduleName = "main"
    self.initialProps = [:]
    
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()
    
    reactNativeFactoryDelegate = delegate
    reactNativeFactory = factory

    return super.applicationDidFinishLaunching(notification)
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins
}
