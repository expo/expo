import UIKit

/// Instead of casting to concrete class names (which break on renames),
/// we detect tab views by checking `responds(to:)` for expected selectors
/// and read properties via KVC.
enum RNScreensTabCompat {
  // RNScreens >= 4.25 uses `screenKey`; earlier versions used `tabKey`.
  // Probe in declaration order; the first selector the view responds to wins.
  private static let tabKeyNames = ["screenKey", "tabKey"]
  private static let controllerName = "controller"
  private static let reactViewControllerName = "reactViewController"

  private static let controllerSelector = NSSelectorFromString(controllerName)
  private static let reactViewControllerSelector = NSSelectorFromString(reactViewControllerName)

  // MARK: - Type check

  /// A view is a tab screen if it exposes either `screenKey` (RNScreens ≥4.25) or `tabKey` (legacy).
  static func isTabScreen(_ view: UIView) -> Bool {
    return tabKeyNames.contains { view.responds(to: NSSelectorFromString($0)) }
  }

  // MARK: - Property access via KVC

  static func tabKey(from view: UIView) -> String? {
    for name in tabKeyNames {
      if view.responds(to: NSSelectorFromString(name)) {
        return view.value(forKey: name) as? String
      }
    }
    return nil
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
