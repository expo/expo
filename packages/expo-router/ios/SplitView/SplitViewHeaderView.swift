import ExpoModulesCore
import UIKit

// Matches `RNSNavigationItemCustomizerProtocol` of react-native-screens by its Objective-C name,
// so this compiles with versions that do not declare it.
@objc(RNSNavigationItemCustomizerProtocol)
protocol NavigationItemCustomizer: NSObjectProtocol {
  func customizeNavigationItem(_ navigationItem: UINavigationItem)
}

// Writes the header of a react-native-screens split column. The column passes its navigation item
// when this view is mounted as its direct child.
class SplitViewHeaderView: ExpoView, NavigationItemCustomizer {
  var headerTitle: String?
  var largeTitle: Bool?
  var leftToolbarItems: [SplitViewToolbarItemRecord] = []
  var rightToolbarItems: [SplitViewToolbarItemRecord] = []
  let onToolbarItemPress = EventDispatcher()

  private weak var navigationItem: UINavigationItem?

  func customizeNavigationItem(_ navigationItem: UINavigationItem) {
    self.navigationItem = navigationItem
    apply()
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    if superview == nil, let navigationItem {
      navigationItem.title = nil
      navigationItem.largeTitleDisplayMode = .never
      navigationItem.leftItemsSupplementBackButton = false
      navigationItem.leftBarButtonItems = nil
      navigationItem.rightBarButtonItems = nil
      self.navigationItem = nil
    }
  }

  func apply() {
    guard let navigationItem else {
      return
    }
    navigationItem.title = headerTitle
    // `.automatic` would follow the previous item, which is another column when the split view is collapsed.
    let largeTitleDisplayMode: UINavigationItem.LargeTitleDisplayMode = largeTitle == true ? .always : .never
    if navigationItem.largeTitleDisplayMode != largeTitleDisplayMode {
      navigationItem.largeTitleDisplayMode = largeTitleDisplayMode
      // A visible bar does not grow by itself when its item starts to show a large title.
      // The column view is the view of its controller, so the controller is its next responder.
      (superview?.next as? UIViewController)?.navigationController?.navigationBar.sizeToFit()
    }
    // Keeps the back button next to the left items when the split view is collapsed.
    navigationItem.leftItemsSupplementBackButton = true
    navigationItem.leftBarButtonItems = barButtonItems(leftToolbarItems, side: .left)
    navigationItem.rightBarButtonItems = barButtonItems(rightToolbarItems, side: .right)
  }

  private func barButtonItems(_ items: [SplitViewToolbarItemRecord], side: ToolbarSide) -> [UIBarButtonItem] {
    return items.enumerated().map { index, item in
      // With an image, the button shows only the image and uses the title as its accessibility label.
      let image = item.icon.flatMap { UIImage(systemName: $0) }
      let action = UIAction(title: item.title, image: image) { [weak self] _ in
        self?.onToolbarItemPress(["side": side.rawValue, "index": index])
      }
      return UIBarButtonItem(primaryAction: action)
    }
  }
}

private enum ToolbarSide: String {
  case left
  case right
}
