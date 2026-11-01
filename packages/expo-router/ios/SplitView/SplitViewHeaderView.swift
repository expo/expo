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
  var headerSubtitle: String?
  var largeTitle = false
  var titleColor: UIColor?
  var largeTitleColor: UIColor?
  var leftToolbarItems: [SplitViewToolbarItemRecord] = []
  var rightToolbarItems: [SplitViewToolbarItemRecord] = []
  var searchBar: SplitViewSearchBarRecord?
  var backButtonDisplayMode: UINavigationItem.BackButtonDisplayMode = .default
  var backTitle: String?
  var backVisible = true
  let onToolbarItemPress = EventDispatcher()
  let onSearchBarChangeText = EventDispatcher()
  let onSearchBarSearchButtonPress = EventDispatcher()

  private weak var navigationItem: UINavigationItem?
  private var searchController: UISearchController?
  // The item of the previous column, which holds the back button options of this column.
  private weak var backButtonNavigationItem: UINavigationItem?

  func configureNavigationItem(_ navigationItem: UINavigationItem) {
    self.navigationItem = navigationItem
    apply()
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    if superview == nil, let navigationItem {
      navigationItem.title = nil
      if #available(iOS 26.0, *) {
        navigationItem.subtitle = nil
      }
      navigationItem.largeTitleDisplayMode = .never
      navigationItem.leftItemsSupplementBackButton = false
      navigationItem.leftBarButtonItems = nil
      navigationItem.rightBarButtonItems = nil
      navigationItem.searchController = nil
      navigationItem.hidesBackButton = false
      navigationItem.standardAppearance = nil
      navigationItem.compactAppearance = nil
      navigationItem.scrollEdgeAppearance = nil
      searchController = nil
      self.navigationItem = nil
      applyBackButton()
    }
  }

  // The previous column is known only after this column is pushed onto the collapsed split view.
  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil {
      applyBackButton()
    }
  }

  func apply() {
    guard let navigationItem else {
      return
    }
    navigationItem.title = headerTitle
    if #available(iOS 26.0, *) {
      navigationItem.subtitle = headerSubtitle
    }
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
    navigationItem.leftBarButtonItems = barButtonItems(leftToolbarItems)
    navigationItem.rightBarButtonItems = barButtonItems(rightToolbarItems)
    applySearchBar(to: navigationItem)
    applyTitleColors(to: navigationItem)
    navigationItem.hidesBackButton = !backVisible
    applyBackButton()
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

  // UIKit reads the title and the display mode of a back button from the item below it in the navigation stack.
  // When the split view is collapsed, that is the item of the previous column.
  private func applyBackButton() {
    // Keeps the last found item, because the previous column is found only while collapsed.
    let previousItem = navigationItem == nil ? nil : previousNavigationItem() ?? backButtonNavigationItem
    if backButtonNavigationItem !== previousItem {
      backButtonNavigationItem?.backButtonTitle = nil
      backButtonNavigationItem?.backButtonDisplayMode = .default
      backButtonNavigationItem = previousItem
    }
    guard let previousItem else {
      return
    }
    previousItem.backButtonTitle = backTitle?.isEmpty == false ? backTitle : nil
    previousItem.backButtonDisplayMode = backButtonDisplayMode
  }

  // Each column is the root of its own navigation controller. When the split view collapses,
  // UIKit pushes these navigation controllers onto the navigation controller of the first column.
  private func previousNavigationItem() -> UINavigationItem? {
    var controller = superview?.next as? UIViewController
    while let current = controller,
      let navigationController = current.navigationController,
      let index = navigationController.viewControllers.firstIndex(of: current) {
      if index > 0 {
        let previous = navigationController.viewControllers[index - 1]
        return ((previous as? UINavigationController)?.topViewController ?? previous).navigationItem
      }
      controller = navigationController
    }
    return nil
  }

  // An item appearance replaces the whole appearance of the bar, so it is set only when a color is set.
  private func applyTitleColors(to navigationItem: UINavigationItem) {
    guard titleColor != nil || largeTitleColor != nil else {
      navigationItem.standardAppearance = nil
      navigationItem.compactAppearance = nil
      navigationItem.scrollEdgeAppearance = nil
      return
    }
    let standardAppearance = UINavigationBarAppearance()
    // Matches the default scroll edge appearance, which the bar shows with the large title.
    let scrollEdgeAppearance = UINavigationBarAppearance()
    scrollEdgeAppearance.configureWithTransparentBackground()
    for appearance in [standardAppearance, scrollEdgeAppearance] {
      if let titleColor {
        appearance.titleTextAttributes = [.foregroundColor: titleColor]
      }
      // Same fallback as `headerLargeTitleStyle` of Stack.
      if let largeTitleColor = largeTitleColor ?? titleColor {
        appearance.largeTitleTextAttributes = [.foregroundColor: largeTitleColor]
      }
    }
    navigationItem.standardAppearance = standardAppearance
    navigationItem.compactAppearance = standardAppearance
    navigationItem.scrollEdgeAppearance = scrollEdgeAppearance
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

  private func barButtonItems(_ items: [SplitViewToolbarItemRecord]) -> [UIBarButtonItem] {
    return items.map { item in
      // With an image, the button shows only the image and uses the title as its default accessibility label.
      let image = toolbarItemImage(item)
      let barButtonItem: UIBarButtonItem
      if let menu = item.menu {
        barButtonItem = UIBarButtonItem(title: item.title, image: image, primaryAction: nil, menu: makeMenu(menu))
      } else {
        barButtonItem = UIBarButtonItem(primaryAction: makeAction(id: item.id, title: item.title, image: image))
      }
      barButtonItem.isEnabled = !item.disabled
      barButtonItem.isSelected = item.selected
      barButtonItem.tintColor = item.tintColor
      barButtonItem.style = item.barButtonItemStyle?.toUIBarButtonItemStyle() ?? .plain
      barButtonItem.accessibilityLabel = item.accessibilityLabel
      barButtonItem.accessibilityHint = item.accessibilityHint
      if #available(iOS 26.0, *) {
        barButtonItem.sharesBackground = item.sharesBackground
        barButtonItem.hidesSharedBackground = item.hidesSharedBackground
        barButtonItem.badge = item.badgeConfiguration?.toBadgeConfiguration().toBarButtonItemBadge()
      }
      return barButtonItem
    }
  }

  private func toolbarItemImage(_ item: SplitViewToolbarItemRecord) -> UIImage? {
    if let xcassetName = item.xcassetName {
      let renderingMode: UIImage.RenderingMode = item.imageRenderingMode == .template ? .alwaysTemplate : .alwaysOriginal
      return UIImage(named: xcassetName)?.withRenderingMode(renderingMode)
    }
    return item.icon.flatMap { UIImage(systemName: $0) }
  }

  private func makeMenu(_ menu: SplitViewMenuRecord) -> UIMenu {
    let actions = menu.items.map { item in
      let action = makeAction(id: item.id, title: item.title, image: item.icon.flatMap { UIImage(systemName: $0) })
      if item.destructive {
        action.attributes.insert(.destructive)
      }
      if item.disabled {
        action.attributes.insert(.disabled)
      }
      action.state = item.isOn ? .on : .off
      return action
    }
    return UIMenu(title: menu.title ?? "", children: actions)
  }

  private func makeAction(id: String, title: String, image: UIImage?) -> UIAction {
    return UIAction(title: title, image: image) { [weak self] _ in
      self?.onToolbarItemPress(["id": id])
    }
  }
}
