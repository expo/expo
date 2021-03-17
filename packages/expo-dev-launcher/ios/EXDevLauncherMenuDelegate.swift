import EXDevMenuInterface

private protocol Delegate {
  var bridge: RCTBridge { get }
  var appInfo: [String : Any]? { get }
}

private class LauncherDelegate : DevMenuDelegateProtocol {
  private let controller: EXDevLauncherController
  
  init(withController controller: EXDevLauncherController) {
    self.controller = controller
  }
  
  func appBridge(forDevMenuManager manager: DevMenuManagerProtocol) -> AnyObject? {
    return controller.launcherBridge
  }
  
  func appInfo(forDevMenuManager manager: DevMenuManagerProtocol) -> [String : Any]? {
    return [
      "appName": "Development Client",
      "appVersion": EXDevLauncherController.version() ?? NSNull(),
      "appIcon": NSNull(),
      "hostUrl": NSNull(),
    ]
  }
}

private class AppDelegate : DevMenuDelegateProtocol {
  private let controller: EXDevLauncherController
  
  init(withController controller: EXDevLauncherController) {
    self.controller = controller
  }
  
  func appBridge(forDevMenuManager manager: DevMenuManagerProtocol) -> AnyObject?{
    return controller.appBridge
  }
  
  func appInfo(forDevMenuManager manager: DevMenuManagerProtocol) -> [String : Any]?  {
    guard let manifest = controller.appManifest() else {
      return [
        "appName": "Development Client - App",
        "appVersion": NSNull(),
        "appIcon": NSNull(),
        "hostUrl": controller.appBridge.bundleURL?.absoluteString,
      ]
    }
    
    return [
      "appName": manifest.name,
      "appVersion": manifest.version,
      "appIcon": NSNull(),
      "hostUrl": manifest.bundleUrl,
    ]
  }
}


@objc
public class EXDevLauncherMenuDelegate : NSObject, DevMenuDelegateProtocol {
  private let controller: EXDevLauncherController
  private let appDelegate: AppDelegate
  private let launcherDelegate: LauncherDelegate


  @objc
  public init(withLauncherController launcherController: EXDevLauncherController) {
    controller = launcherController
    appDelegate = AppDelegate(withController: controller)
    launcherDelegate = LauncherDelegate(withController: controller)
  }
  
  private var currentDelegate: DevMenuDelegateProtocol {
    if controller.isAppRunning() {
      return appDelegate
    } else {
      return launcherDelegate
    }
  }
  
  public func appBridge(forDevMenuManager manager: DevMenuManagerProtocol) -> AnyObject? {
    return currentDelegate.appBridge?(forDevMenuManager: manager)
  }
  
  public func appInfo(forDevMenuManager manager: DevMenuManagerProtocol) -> [String : Any]? {
    return currentDelegate.appInfo?(forDevMenuManager: manager)
  }
}
