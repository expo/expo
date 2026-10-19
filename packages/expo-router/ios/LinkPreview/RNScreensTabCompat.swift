import UIKit

/// Instead of casting to concrete class names (which break on renames),
/// we detect tab views by checking `responds(to:)` for expected selectors
/// and read properties via KVC.
enum RNScreensTabCompat {
  private static let screenKeyName = "screenKey"
  private static let controllerName = "controller"
  private static let reactViewControllerName = "reactViewController"

  private static let screenKeySelector = NSSelectorFromString(screenKeyName)
  private static let controllerSelector = NSSelectorFromString(controllerName)
  private static let reactViewControllerSelector = NSSelectorFromString(reactViewControllerName)

  // MARK: - Type check

  /// A view is a tab screen if it has a `screenKey` property — specific to RNScreens tab views.
  static func isTabScreen(_ view: UIView) -> Bool {
    view.responds(to: screenKeySelector)
  }

  // MARK: - Property access via KVC

  static func screenKey(from view: UIView) -> String? {
    guard view.responds(to: screenKeySelector) else { return nil }
    return view.value(forKey: screenKeyName) as? String
  }

  /// `screenKey` is a route name; nativeID carries the globally unique Expo Router key.
  static func routeKey(from view: UIView) -> String? {
    let selector = NSSelectorFromString("nativeId")
    guard view.responds(to: selector),
      let nativeId = view.value(forKey: "nativeId") as? String,
      nativeId.hasPrefix("expo-router-tab:")
    else { return nil }
    return String(nativeId.dropFirst("expo-router-tab:".count))
  }

  /// Calls `reactViewController()` dynamically via `perform(_:)`, then returns `.tabBarController`.
  static func tabBarController(fromTabScreen view: UIView) -> UITabBarController? {
    guard isTabScreen(view),
      view.responds(to: reactViewControllerSelector)
    else { return nil }
    let vc = view.perform(reactViewControllerSelector)?.takeUnretainedValue() as? UIViewController
    return vc?.tabBarController
  }

  static func tabBarController(fromTabHost view: UIView) -> UITabBarController? {
    guard view.responds(to: controllerSelector) else { return nil }
    return view.value(forKey: controllerName) as? UITabBarController
  }
}
