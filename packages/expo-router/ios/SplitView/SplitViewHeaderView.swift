import ExpoModulesCore
import RNScreens
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
  var navigationBarHidden = false
  let onToolbarItemPress = EventDispatcher()
  let onSearchBarChangeText = EventDispatcher()
  let onSearchBarSearchButtonPress = EventDispatcher()

  private weak var navigationItem: UINavigationItem?
  private var searchController: UISearchController?
  private var preparingStack = false
  // The item of the previous column, which holds the back button options of this column.
  private weak var backButtonNavigationItem: UINavigationItem?

  func configureNavigationItem(_ navigationItem: UINavigationItem) {
    self.navigationItem = navigationItem
    _ = Self.installAppearanceHook
    _ = Self.installStackHooks
    apply()
  }

  // The previous column is known only after this column is in a window.
  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil {
      applyBackButton()
      applyVisibility()
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
      navigationController?.navigationBar.sizeToFit()
    }
    // Keeps the back button next to the left items when the split view is collapsed.
    navigationItem.leftItemsSupplementBackButton = true
    navigationItem.leftBarButtonItems = barButtonItems(leftToolbarItems)
    navigationItem.rightBarButtonItems = barButtonItems(rightToolbarItems)
    applySearchBar(to: navigationItem)
    applyTitleColors(to: navigationItem)
    navigationItem.hidesBackButton = !backVisible
    applyBackButton()
    applyVisibility()
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

  // The column view is the view of its controller, so the controller is its next responder.
  private var navigationController: UINavigationController? {
    (superview?.next as? UIViewController)?.navigationController
  }

  private func onWillAppear(_ controller: UIViewController, animated: Bool) {
    if let stack = controller.children.first(where: { $0 is RNSNavigationController }) as? UINavigationController,
      let screen = stack.topViewController {
      applyStackVisibility(stack, screen: screen, transitioning: stackIsTransitioning(stack), appearing: true)
      return
    }
    controller.navigationController?.setNavigationBarHidden(navigationBarHidden, animated: animated)
  }

  private func applyVisibility() {
    if let controller = superview?.next as? UIViewController, isTopColumn(controller) {
      onWillAppear(controller, animated: false)
    }
  }

  private func isTopColumn(_ controller: UIViewController) -> Bool {
    var child = controller
    while let parent = child.parent {
      if let navigation = parent as? UINavigationController, navigation.topViewController !== child {
        return false
      }
      child = parent
    }
    return true
  }

  private func stackIsTransitioning(_ stack: UINavigationController) -> Bool {
    guard let coordinator = stack.transitionCoordinator, coordinator.presentationStyle == .none else {
      return preparingStack
    }
    // A nested controller can inherit the split column's transition coordinator.
    return preparingStack || coordinator.viewController(forKey: .from)?.parent === stack
      || coordinator.viewController(forKey: .to)?.parent === stack
  }

  private func applyStackVisibility(
    _ stack: UINavigationController,
    screen: UIViewController,
    transitioning: Bool,
    appearing: Bool = false
  ) {
    let stackOwnsHeader = transitioning || screen !== stack.viewControllers.first
    if !stackOwnsHeader {
      stack.setNavigationBarHidden(true, animated: false)
    }
    if let column = stack.parent, appearing || isTopColumn(column) {
      column.navigationController?.setNavigationBarHidden(navigationBarHidden || stackOwnsHeader, animated: false)
    }
  }

  private static func header(for stack: UINavigationController) -> SplitViewHeaderView? {
    guard stack is RNSNavigationController,
      let column = stack.parent,
      let columnClass = NSClassFromString("RNSSplitScreenController"),
      column.isKind(of: columnClass)
    else { return nil }
    return column.viewIfLoaded?.subviews.first(where: { $0 is SplitViewHeaderView }) as? SplitViewHeaderView
  }

  private static let installStackHooks: Void = {
    let updateSelector = NSSelectorFromString("updateViewController:withConfig:animated:")
    let pushSelector = NSSelectorFromString("setPushViewControllers:")
    let finishSelector = NSSelectorFromString("navigationController:didShowViewController:animated:")
    guard let updateMethod = class_getClassMethod(RNSScreenStackHeaderConfig.self, updateSelector),
      let pushMethod = class_getInstanceMethod(RNSScreenStackView.self, pushSelector),
      let finishMethod = class_getInstanceMethod(RNSScreenStackView.self, finishSelector)
    else { return }

    // Both screen transitions and header prop updates pass through this method.
    typealias UpdateHeader = @convention(c) (
      AnyObject, Selector, UIViewController, RNSScreenStackHeaderConfig?, Bool
    ) -> Void
    let update = unsafeBitCast(method_getImplementation(updateMethod), to: UpdateHeader.self)
    let updateHook: @convention(block) (
      AnyObject, UIViewController, RNSScreenStackHeaderConfig?, Bool
    ) -> Void = { receiver, screen, config, animated in
      guard let stack = screen.parent as? UINavigationController, let header = SplitViewHeaderView.header(for: stack) else {
        update(receiver, updateSelector, screen, config, animated)
        return
      }
      let transitioning = header.stackIsTransitioning(stack)
      let restingRoot = !transitioning && screen === stack.viewControllers.first
      update(receiver, updateSelector, screen, restingRoot ? nil : config, animated)
      header.applyStackVisibility(stack, screen: screen, transitioning: transitioning)
    }
    method_setImplementation(updateMethod, imp_implementationWithBlock(updateHook))

    // Screens stages the controller list before calling UIKit's push or replacement methods.
    typealias SetScreens = @convention(c) (RNSScreenStackView, Selector, NSArray) -> Void
    let setScreens = unsafeBitCast(method_getImplementation(pushMethod), to: SetScreens.self)
    let pushHook: @convention(block) (RNSScreenStackView, NSArray) -> Void = { view, screens in
      guard let stack = view.reactViewController() as? UINavigationController,
        let header = SplitViewHeaderView.header(for: stack)
      else {
        setScreens(view, pushSelector, screens)
        return
      }
      if let root = stack.topViewController, root === stack.viewControllers.first,
        let next = screens.lastObject as? UIViewController, next !== root {
        header.preparingStack = true
        UIView.performWithoutAnimation {
          header.applyStackVisibility(stack, screen: root, transitioning: true)
          // Settle the column's safe area before showing the nested navigation bar.
          let columnNavigationView = stack.parent?.navigationController?.view
          columnNavigationView?.setNeedsLayout()
          columnNavigationView?.layoutIfNeeded()
          if let config = (root.view as? RNSScreenView)?.findHeaderConfig() {
            RNSScreenStackHeaderConfig.willShow(root, animated: false, with: config)
          }
          stack.view.setNeedsLayout()
          stack.view.layoutIfNeeded()
        }
      }
      setScreens(view, pushSelector, screens)
      header.preparingStack = false
      if let screen = stack.topViewController {
        header.applyStackVisibility(stack, screen: screen, transitioning: header.stackIsTransitioning(stack))
      }
    }
    method_setImplementation(pushMethod, imp_implementationWithBlock(pushHook))

    // didShow identifies the surviving screen after both completed and cancelled transitions.
    typealias DidShow = @convention(c) (RNSScreenStackView, Selector, UINavigationController, UIViewController, Bool) -> Void
    let didShow = unsafeBitCast(method_getImplementation(finishMethod), to: DidShow.self)
    let finishHook: @convention(block) (
      RNSScreenStackView, UINavigationController, UIViewController, Bool
    ) -> Void = { view, stack, screen, animated in
      didShow(view, finishSelector, stack, screen, animated)
      if let header = SplitViewHeaderView.header(for: stack), !header.preparingStack {
        if screen === stack.viewControllers.first {
          UIView.performWithoutAnimation {
            header.applyStackVisibility(stack, screen: screen, transitioning: false)
            let columnNavigationView = stack.parent?.navigationController?.view
            columnNavigationView?.setNeedsLayout()
            columnNavigationView?.layoutIfNeeded()
            stack.view.setNeedsLayout()
            stack.view.layoutIfNeeded()
          }
        } else {
          header.applyStackVisibility(stack, screen: screen, transitioning: false)
        }
      }
    }
    method_setImplementation(finishMethod, imp_implementationWithBlock(finishHook))
  }()

  // UIKit must receive visibility changes during controller appearance, before it prepares the transition.
  private static let installAppearanceHook: Void = {
    let selector = #selector(UIViewController.viewWillAppear(_:))
    guard let controllerClass = NSClassFromString("RNSSplitScreenController"),
      controllerClass is UIViewController.Type,
      let method = class_getInstanceMethod(controllerClass, selector)
    else {
      return
    }
    typealias ViewWillAppear = @convention(c) (UIViewController, Selector, Bool) -> Void
    let original = unsafeBitCast(method_getImplementation(method), to: ViewWillAppear.self)
    let implementation: @convention(block) (UIViewController, Bool) -> Void = { controller, animated in
      original(controller, selector, animated)
      if let header = controller.viewIfLoaded?.subviews.first(where: { $0 is SplitViewHeaderView })
        as? SplitViewHeaderView
      {
        header.onWillAppear(controller, animated: animated)
      }
    }
    let replacement = imp_implementationWithBlock(implementation)
    // Add an override if a screens version inherits this method; never replace UIViewController's implementation.
    if !class_addMethod(controllerClass, selector, replacement, method_getTypeEncoding(method)) {
      method_setImplementation(method, replacement)
    }
  }()

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
