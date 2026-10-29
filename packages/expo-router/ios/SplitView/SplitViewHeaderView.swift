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
class SplitViewHeaderView: ExpoView, NavigationItemCustomizer, UISearchBarDelegate {
  var headerTitle: String?
  var largeTitle = false
  var leftToolbarItems: [SplitViewToolbarItemRecord] = []
  var rightToolbarItems: [SplitViewToolbarItemRecord] = []
  var searchBar: SplitViewSearchBarRecord?
  let onToolbarItemPress = EventDispatcher()
  let onSearchBarChangeText = EventDispatcher()
  let onSearchBarSearchButtonPress = EventDispatcher()

  private weak var navigationItem: UINavigationItem?
  private var searchController: UISearchController?

  func configureNavigationItem(_ navigationItem: UINavigationItem) {
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
      navigationItem.searchController = nil
      searchController = nil
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
    // Keeps the back button next to the left items when the split view is collapsed.
    navigationItem.leftItemsSupplementBackButton = true
    navigationItem.leftBarButtonItems = barButtonItems(leftToolbarItems, side: .left)
    navigationItem.rightBarButtonItems = barButtonItems(rightToolbarItems, side: .right)
    applySearchBar(to: navigationItem)
  }

  func searchBar(_ searchBar: UISearchBar, textDidChange searchText: String) {
    onSearchBarChangeText(["text": searchText])
  }

  // Cancel clears the text without calling `textDidChange`.
  func searchBarCancelButtonClicked(_ searchBar: UISearchBar) {
    onSearchBarChangeText(["text": ""])
  }

  func searchBarSearchButtonClicked(_ searchBar: UISearchBar) {
    onSearchBarSearchButtonPress(["text": searchBar.text ?? ""])
  }

  private func applySearchBar(to navigationItem: UINavigationItem) {
    if let searchBar {
      // Reuses the controller, so the search text and the active state survive prop updates.
      let controller = searchController ?? makeSearchController()
      controller.searchBar.placeholder = searchBar.placeholder
      searchController = controller
    } else {
      searchController = nil
    }
    if navigationItem.searchController !== searchController {
      navigationItem.searchController = searchController
    }
  }

  private func makeSearchController() -> UISearchController {
    let controller = UISearchController(searchResultsController: nil)
    // The column shows the results itself.
    controller.obscuresBackgroundDuringPresentation = false
    controller.searchBar.delegate = self
    return controller
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
