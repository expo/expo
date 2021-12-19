import EXDevMenuInterface

internal class LauncherDelegate: DevMenuDelegateProtocol {
  private let controller: EXDevLauncherController

  init(withController controller: EXDevLauncherController) {
    self.controller = controller
  }

  func appBridge(forDevMenuManager manager: DevMenuManagerProtocol) -> AnyObject? {
    return controller.launcherBridge
  }

  func appInfo(forDevMenuManager manager: DevMenuManagerProtocol) -> [String: Any]? {
    return [
      "appName": "Development Client",
      "appVersion": EXDevLauncherController.version() ?? NSNull(),
      "appIcon": NSNull(),
      "hostUrl": NSNull()
    ]
  }

  public func supportsDevelopment() -> Bool {
    return false
  }
}

internal class AppDelegate: DevMenuDelegateProtocol {
  private let controller: EXDevLauncherController

  init(withController controller: EXDevLauncherController) {
    self.controller = controller
  }

  func appBridge(forDevMenuManager manager: DevMenuManagerProtocol) -> AnyObject? {
    return controller.appBridge
  }

  func appInfo(forDevMenuManager manager: DevMenuManagerProtocol) -> [String: Any]? {
    guard let manifest = controller.appManifest() else {
      return [
        "appName": "Development Client - App",
        "appVersion": NSNull(),
        "appIcon": NSNull(),
        // AppBridge should be present here, but for safety, we use null checks
        "hostUrl": controller.appBridge?.bundleURL?.absoluteString ?? NSNull()
      ]
    }

    return [
      "appName": manifest.name(),
      "appVersion": manifest.version(),
      "appIcon": NSNull(),
      "hostUrl": manifest.bundleUrl()
    ]
  }

  public func supportsDevelopment() -> Bool {
    return true
  }
}

@objc
public class EXDevLauncherMenuDelegate: NSObject, DevMenuDelegateProtocol {
  private let controller: EXDevLauncherController
  private weak var appDelegate: AppDelegate
  private weak var launcherDelegate: LauncherDelegate

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

  public func appInfo(forDevMenuManager manager: DevMenuManagerProtocol) -> [String: Any]? {
    return currentDelegate.appInfo?(forDevMenuManager: manager)
  }

  public func supportsDevelopment() -> Bool {
    guard let supportsDevelopment = currentDelegate.supportsDevelopment?() else {
      return true
    }

    return supportsDevelopment
  }
}
