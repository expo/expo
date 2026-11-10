import ExpoModulesCore
import UIKit

// Matches `RNSNavigationItemCustomizing` of react-native-screens by its Objective-C name,
// so this compiles with versions that do not declare it.
@objc(RNSNavigationItemCustomizing)
protocol NavigationItemCustomizer: NSObjectProtocol {
  func configureNavigationItem(_ navigationItem: UINavigationItem)
}

// Writes the header of a react-native-screens split column. The column passes its navigation item
// when this view is mounted as its direct child.
class SplitViewHeaderView: ExpoView, NavigationItemCustomizer {
  var headerTitle: String?
  var largeTitle = false

  private weak var navigationItem: UINavigationItem?

  func configureNavigationItem(_ navigationItem: UINavigationItem) {
    self.navigationItem = navigationItem
    apply()
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    if superview == nil, let navigationItem {
      navigationItem.title = nil
      navigationItem.largeTitleDisplayMode = .never
      self.navigationItem = nil
    }
  }

  func apply() {
    guard let navigationItem else {
      return
    }
    navigationItem.title = headerTitle
    // `.automatic` would follow the previous item, which is another column when the split view is collapsed.
    let largeTitleDisplayMode: UINavigationItem.LargeTitleDisplayMode = largeTitle ? .always : .never
    if navigationItem.largeTitleDisplayMode != largeTitleDisplayMode {
      navigationItem.largeTitleDisplayMode = largeTitleDisplayMode
      // A visible bar does not grow by itself when its item starts to show a large title.
      // The column view is the view of its controller, so the controller is its next responder.
      (superview?.next as? UIViewController)?.navigationController?.navigationBar.sizeToFit()
    }
  }
}
