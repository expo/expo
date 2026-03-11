import UIKit

/// Instead of casting to concrete class names (which break on renames),
/// we detect tab views by checking `responds(to:)` for expected selectors
/// and read properties via KVC.
enum RNScreensTabCompat {
  private static let tabKeyName = "tabKey"
  private static let controllerName = "controller"
  private static let reactViewControllerName = "reactViewController"

  private static let tabKeySelector = NSSelectorFromString(tabKeyName)
  private static let controllerSelector = NSSelectorFromString(controllerName)
  private static let reactViewControllerSelector = NSSelectorFromString(reactViewControllerName)

  // MARK: - Type check

  /// A view is a tab screen if it has a `tabKey` property — specific to RNScreens tab views.
  static func isTabScreen(_ view: UIView) -> Bool {
    view.responds(to: tabKeySelector)
  }

  // MARK: - Property access via KVC

  static func tabKey(from view: UIView) -> String? {
    guard view.responds(to: tabKeySelector) else { return nil }
    return view.value(forKey: tabKeyName) as? String
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
