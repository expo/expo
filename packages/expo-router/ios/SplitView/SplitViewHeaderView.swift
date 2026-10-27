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
  // Kept because the column is no longer in the responder chain when this view is unmounted.
  private weak var largeTitleNavigationController: UINavigationController?

  func customizeNavigationItem(_ navigationItem: UINavigationItem) {
    self.navigationItem = navigationItem
    apply()
  }

  // The column can move to another navigation controller when the split view collapses or expands.
  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil {
      apply()
    }
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    if superview == nil, let navigationItem {
      navigationItem.title = nil
      navigationItem.largeTitleDisplayMode = .automatic
      navigationItem.leftItemsSupplementBackButton = false
      navigationItem.leftBarButtonItems = nil
      navigationItem.rightBarButtonItems = nil
      largeTitleNavigationController?.navigationBar.prefersLargeTitles = false
      self.navigationItem = nil
    }
  }

  func apply() {
    guard let navigationItem else {
      return
    }
    navigationItem.title = headerTitle
    // When the split view is collapsed, the columns share one navigation controller, so `.automatic` would inherit
    // the large title of another column.
    navigationItem.largeTitleDisplayMode = largeTitle == true ? .always : .never
    if largeTitle == true, let navigationController = columnNavigationController() {
      // The large title shows only when the bar prefers large titles, which react-native-screens does not set for
      // split columns.
      navigationController.navigationBar.prefersLargeTitles = true
      largeTitleNavigationController = navigationController
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

  // The split column view is the view of its view controller, so the controller is next in the responder chain.
  private func columnNavigationController() -> UINavigationController? {
    var responder = superview?.next
    while let current = responder {
      if let controller = current as? UIViewController {
        return controller.navigationController
      }
      responder = current.next
    }
    return nil
  }
}

private enum ToolbarSide: String {
  case left
  case right
}
