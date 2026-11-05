import ExpoModulesCore
import RNScreens
import UIKit

// A child controller observes UIKit transitions without taking a Screens delegate.
final class SplitViewLifecycleObserver: UIViewController, RNSViewControllerDelegate {
  var update: (() -> Void)?
  var transitionEnded: (() -> Void)?

  private var contentController: UIViewController? {
    parent?.children.last { !($0 is SplitViewLifecycleObserver) }
  }

  #if !os(tvOS)
  // Screens resolves every window trait through its last child controller.
  override var childForStatusBarStyle: UIViewController? {
    guard let contentController, contentController is RNSViewControllerDelegate else { return nil }
    return contentController.childForStatusBarStyle
  }
  #endif

  override func loadView() {
    view = UIView(frame: .zero)
    view.isUserInteractionEnabled = false
  }

  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    reconcileTransition()
  }

  override func viewWillDisappear(_ animated: Bool) {
    super.viewWillDisappear(animated)
    reconcileTransition()
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    update?()
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    update?()
  }

  override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
    super.viewWillTransition(to: size, with: coordinator)
    coordinator.animate(
      alongsideTransition: { [weak self] _ in self?.update?() },
      completion: { [weak self] _ in
        self?.update?()
      }
    )
  }

  private func reconcileTransition() {
    update?()
    // Completion runs for both committed and cancelled interactive transitions.
    transitionCoordinator?.animate(
      alongsideTransition: nil,
      completion: { [weak self] _ in
        self?.transitionEnded?()
        self?.update?()
      }
    )
  }

  func attach(to controller: UIViewController, in view: UIView) {
    guard parent !== controller else { return }
    detach()
    controller.addChild(self)
    view.addSubview(self.view)
    didMove(toParent: controller)
  }

  func detach() {
    guard parent != nil else { return }
    willMove(toParent: nil)
    view.removeFromSuperview()
    removeFromParent()
  }
}

#if !os(tvOS)
extension SplitViewLifecycleObserver: RNSOrientationProviding {
  func evaluateOrientation() -> RNSOrientation {
    (contentController as? RNSOrientationProviding)?.evaluateOrientation() ?? .inherit
  }
}
#endif

// Blocks the swipe back to the previous column while the Stack root disables its gestures.
private final class SplitViewRootGestureBlocker: NSObject, UIGestureRecognizerDelegate {
  weak var gesture: UIGestureRecognizer?
  let original: UIGestureRecognizerDelegate?

  init(gesture: UIGestureRecognizer) {
    self.gesture = gesture
    original = gesture.delegate
  }

  func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    false
  }

  override func responds(to selector: Selector!) -> Bool {
    super.responds(to: selector) || original?.responds(to: selector) == true
  }

  override func forwardingTarget(for selector: Selector!) -> Any? {
    original
  }

  func restore() {
    if gesture?.delegate === self { gesture?.delegate = original }
  }
}

final class SplitViewColumnView: ExpoView {
  static let columns = NSMapTable<NSString, SplitViewColumnView>.strongToWeakObjects()
  var columnId = ""
  var previousColumn = "primary"
  let onOwnershipChange = EventDispatcher()
  private let observer = SplitViewLifecycleObserver()
  private let screens = NSHashTable<SplitViewStackScreenView>.weakObjects()
  private weak var column: UIViewController?
  private weak var controlledNavigation: UINavigationController?
  private var originalHidden = false
  private var lastOwnership: NSDictionary?
  private var reconciling = false
  // The Stack whose root item the shared bar shows while its header is hidden.
  private weak var mirroredStack: UINavigationController?
  private weak var mirroredScreen: SplitViewStackScreenView?
  private weak var mirroredItem: UINavigationItem?
  // The navigation controller of the shared bar. A pop of the column detaches the column from it.
  private weak var sharedNavigation: UINavigationController?
  // The views moved from the Stack root item, because a view shows in one bar at a time.
  private var movedViews = MovedViews()
  private var movingViews = false
  // Screens writes the views of an item one by one, so they move only after it finishes.
  private var viewsChanged = false
  private var savedColumnItem: NavigationItemState?
  private var appliedState: NavigationItemState?
  // Custom views can leave the bar on purpose, for example into the overflow menu, so repairs run only for a short
  // time after a column transition or an options update.
  private var customViewChecksUntil: CFTimeInterval = 0
  private var mirrorObservations: [NSKeyValueObservation] = []
  private var mirrorUpdateScheduled = false

  var configuredHidden = false {
    didSet { reconcile() }
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    if superview == nil {
      showStackHeader()
      restoreNavigation()
      observer.detach()
      Self.columns.removeObject(forKey: columnId as NSString)
    } else {
      attach()
    }
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil { attach() }
  }

  func attach() {
    guard !columnId.isEmpty, let controller = superview?.next as? UIViewController else { return }
    column = controller
    Self.columns.setObject(self, forKey: columnId as NSString)
    for screen in SplitViewStackScreenView.pending.allObjects where screen.columnId == columnId {
      screen.attach()
    }
    observer.update = { [weak self] in self?.reconcile() }
    observer.transitionEnded = { [weak self] in self?.checkCustomViews() }
    observer.attach(to: controller, in: self)
    reconcile()
  }

  func register(_ screen: SplitViewStackScreenView) {
    screens.add(screen)
    reconcile()
  }

  func unregister(_ screen: SplitViewStackScreenView) {
    screens.remove(screen)
    screen.restoreControls()
    reconcile()
  }

  func reconcile() {
    guard !reconciling, let column, let navigation = column.navigationController else { return }
    reconciling = true
    defer { reconciling = false }
    if controlledNavigation !== navigation {
      restoreNavigation()
      controlledNavigation = navigation
      originalHidden = navigation.isNavigationBarHidden
    }
    let split = column.splitViewController
    let owner = screens.allObjects.first { screen in
      guard screen.active, let stack = screen.screenController?.navigationController,
        stack !== navigation, stack.topViewController === screen.screenController,
        stack.view.isDescendant(of: column.view)
      else { return false }
      // Modal controllers have a separate ancestry and must not take over the underlying column.
      var ancestor = stack.parent
      while let current = ancestor {
        if current === column {
          let available = column.view.safeAreaLayoutGuide.layoutFrame
          let frame = stack.view.convert(stack.view.bounds, to: column.view)
          return !available.isEmpty && frame.insetBy(dx: -1, dy: -1).contains(available)
        }
        ancestor = current.parent
      }
      return false
    }
    // A pop or push of this column keeps the root item in the shared bar, so the bar animates it.
    let columnTransition = sharedNavigation?.transitionCoordinator.map { coordinator in
      [UITransitionContextViewControllerKey.from, .to].contains { coordinator.viewController(forKey: $0) === navigation }
    } == true
    let resting = mirroredStack != nil && columnTransition && owner === mirroredScreen
      ? mirroredStack : owner.flatMap { $0.restingRootStack(collapsed: split?.isCollapsed == true) }
    if let owner, let resting {
      showRootInSharedBar(owner: owner, stack: resting)
    }
    let hidden = owner == nil ? configuredHidden : mirroredStack == nil || resting == nil
    if navigation.isNavigationBarHidden != hidden {
      navigation.setNavigationBarHidden(hidden, animated: false)
    }
    // The shared bar hides first, so the Stack header lays out at the top of the column before a push starts.
    if resting == nil {
      showStackHeader()
    }
    for screen in screens.allObjects {
      if screen === owner, let split {
        screen.installControls(split: split, previousColumn: previousColumn)
      } else {
        screen.restoreControls()
      }
    }
    let collapsed = split?.isCollapsed ?? false
    // UIKit shows its sidebar button in the content column only when it is alone or other columns overlay it.
    let showsSidebarButton = split.map {
      !collapsed && $0.displayModeButtonVisibility != .never
        && [.secondaryOnly, .oneOverSecondary, .twoOverSecondary].contains($0.displayMode)
    } ?? false
    // The Stack root reports no header while the shared bar shows its item, so the column reports that bar.
    let sharedBar = navigation.navigationController?.navigationBar
    let mirroredHeaderHeight = mirroredStack != nil ? Double(sharedBar?.frame.maxY ?? 0) : 0
    let ownership: [String: Any] = [
      "ownsHeader": owner != nil, "isCollapsed": collapsed, "showsSidebarButton": showsSidebarButton,
      "mirroredHeaderHeight": mirroredHeaderHeight,
    ]
    if lastOwnership?.isEqual(to: ownership) != true {
      lastOwnership = ownership as NSDictionary
      onOwnershipChange(ownership)
    }
  }

  // When collapsed, the column shares the bar of the primary navigation controller. UIKit animates that bar
  // when the column is popped, so a resting Stack root shows its item there and hides its own header.
  // Every pop of the column, from a gesture, Back or JavaScript, is then a regular pop of one bar.
  private func showRootInSharedBar(owner: SplitViewStackScreenView, stack: UINavigationController) {
    guard let column, let source = owner.screenController?.navigationItem else { return }
    if mirroredStack !== stack || mirroredScreen !== owner || mirroredItem !== source {
      showStackHeader()
      savedColumnItem = NavigationItemState(column.navigationItem)
      mirroredStack = stack
      mirroredScreen = owner
      mirroredItem = source
      sharedNavigation = column.navigationController?.navigationController
      moveViews(from: source)
      observeMirror(item: source, stack: stack)
      // The shared bar has its height only after the next layout.
      DispatchQueue.main.async { [weak self] in self?.reconcile() }
    }
    if viewsChanged {
      moveViews(from: source)
    }
    let state = NavigationItemState(source, views: movedViews)
    if state != appliedState {
      appliedState = state
      state.apply(to: column.navigationItem)
    }
    repairCustomViews()
    // While Screens shows its header, only the bar view is hidden; the navigation controller follows afterwards.
    if !stack.isNavigationBarHidden, !stack.navigationBar.isHidden {
      stack.setNavigationBarHidden(true, animated: false)
    }
  }

  // The column header writes its options into the shared item. While the Stack root is shown there, they are kept
  // for later and the item shows the Stack root again.
  // `apply()` of the header writes the title, the bar items and the search bar every time.
  func columnHeaderDidApply() {
    guard mirroredStack != nil, let column, let saved = savedColumnItem else { return }
    savedColumnItem = NavigationItemState(column.navigationItem, views: MovedViews(
      titleView: saved.views.titleView, leftItems: column.navigationItem.leftBarButtonItems,
      rightItems: column.navigationItem.rightBarButtonItems, searchController: column.navigationItem.searchController))
    appliedState = nil
    reconcile()
  }

  private func moveViews(from item: UINavigationItem) {
    viewsChanged = false
    movedViews = MovedViews(item)
    movingViews = true
    MovedViews().apply(to: item)
    movingViews = false
    if movedViews.hasCustomViews {
      checkCustomViews()
    }
  }

  // Checks the custom views now and for a short time after, because another bar can remove them in a later layout.
  private func checkCustomViews() {
    guard mirroredStack != nil else { return }
    let lastDelay: TimeInterval = 1
    customViewChecksUntil = CACurrentMediaTime() + lastDelay + 0.1
    for delay in [0, 0.1, 0.3, lastDelay] {
      DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in self?.repairCustomViews() }
    }
  }

  // Sets a custom view again when another bar removed it.
  private func repairCustomViews() {
    // A pending Screens update moves the views first.
    guard mirroredStack != nil, !viewsChanged, CACurrentMediaTime() < customViewChecksUntil, let column,
      column.view.window != nil, let shared = sharedNavigation, shared.transitionCoordinator == nil
    else { return }
    let bar = shared.navigationBar
    let item = column.navigationItem
    let isMissing = { (view: UIView?) in view.map { !$0.isDescendant(of: bar) } ?? false }
    if let titleView = item.titleView, isMissing(titleView) {
      item.titleView = nil
      item.titleView = titleView
    }
    if let items = item.leftBarButtonItems, items.contains(where: { isMissing($0.customView) }) {
      item.leftBarButtonItems = nil
      item.leftBarButtonItems = items
    }
    if let items = item.rightBarButtonItems, items.contains(where: { isMissing($0.customView) }) {
      item.rightBarButtonItems = nil
      item.rightBarButtonItems = items
    }
  }

  private func observeMirror(item: UINavigationItem, stack: UINavigationController) {
    let update = { [weak self] in
      guard let self, !self.mirrorUpdateScheduled else { return }
      self.mirrorUpdateScheduled = true
      DispatchQueue.main.async {
        self.mirrorUpdateScheduled = false
        self.reconcile()
      }
    }
    // Screens sets new views when the screen options change. They move to the shared bar too.
    let viewsUpdate = { [weak self] in
      guard let self, !self.movingViews else { return }
      self.viewsChanged = true
      update()
    }
    mirrorObservations = [
      // Screens shows its header last when it applies the screen options. Hiding the bar view right away keeps it
      // from being drawn; the navigation controller state follows once Screens returns.
      stack.navigationBar.observe(\.isHidden, options: [.new]) { [weak self, weak stack] bar, change in
        guard change.newValue == false, let self, let stack, self.mirroredStack === stack else { return }
        bar.isHidden = true
        if self.viewsChanged {
          self.reconcile()
        }
        DispatchQueue.main.async { [weak stack] in
          if let stack, self.mirroredStack === stack { stack.setNavigationBarHidden(true, animated: false) }
        }
      },
      item.observe(\.titleView) { _, _ in viewsUpdate() },
      item.observe(\.leftBarButtonItems) { _, _ in viewsUpdate() },
      item.observe(\.rightBarButtonItems) { _, _ in viewsUpdate() },
      item.observe(\.searchController) { _, _ in viewsUpdate() },
      item.observe(\.title) { _, _ in update() },
      item.observe(\.leftItemsSupplementBackButton) { _, _ in update() },
      item.observe(\.largeTitleDisplayMode) { _, _ in update() },
      item.observe(\.hidesBackButton) { _, _ in update() },
      item.observe(\.standardAppearance) { _, _ in update() },
      item.observe(\.compactAppearance) { _, _ in update() },
      item.observe(\.scrollEdgeAppearance) { _, _ in update() },
    ]
    if #available(iOS 26.0, *) {
      mirrorObservations.append(item.observe(\.subtitle) { _, _ in update() })
    }
  }

  private func showStackHeader() {
    guard let stack = mirroredStack else { return }
    let item = mirroredItem
    // After an unfinished update, the item already holds the views Screens set last.
    let views = viewsChanged ? nil : movedViews
    viewsChanged = false
    mirroredStack = nil
    mirroredItem = nil
    sharedNavigation = nil
    customViewChecksUntil = 0
    movedViews = MovedViews()
    appliedState = nil
    mirrorObservations = []
    if let column {
      // Restoring the column item first releases the moved views for the Stack root item.
      savedColumnItem?.apply(to: column.navigationItem)
    }
    savedColumnItem = nil
    if let item, let views {
      views.apply(to: item)
    }
    if mirroredScreen?.headerShown != false {
      stack.setNavigationBarHidden(false, animated: false)
    }
    mirroredScreen = nil
    column?.navigationController?.view.layoutIfNeeded()
  }

  func showSidebar() {
    column?.splitViewController?.show(.primary)
  }

  private func restoreNavigation() {
    controlledNavigation?.setNavigationBarHidden(originalHidden, animated: false)
    controlledNavigation = nil
  }
}

private struct MovedViews {
  var titleView: UIView?
  var leftItems: [UIBarButtonItem]?
  var rightItems: [UIBarButtonItem]?
  var searchController: UISearchController?

  init(
    titleView: UIView? = nil, leftItems: [UIBarButtonItem]? = nil, rightItems: [UIBarButtonItem]? = nil,
    searchController: UISearchController? = nil
  ) {
    self.titleView = titleView
    self.leftItems = leftItems
    self.rightItems = rightItems
    self.searchController = searchController
  }

  init(_ item: UINavigationItem) {
    self.init(
      titleView: item.titleView, leftItems: item.leftBarButtonItems, rightItems: item.rightBarButtonItems,
      searchController: item.searchController)
  }

  func apply(to item: UINavigationItem) {
    item.titleView = titleView
    item.leftBarButtonItems = leftItems
    item.rightBarButtonItems = rightItems
    if item.searchController !== searchController {
      item.searchController = searchController
    }
  }

  var hasCustomViews: Bool {
    titleView != nil || ((leftItems ?? []) + (rightItems ?? [])).contains { $0.customView != nil }
  }

  func isSame(as other: MovedViews) -> Bool {
    titleView === other.titleView && searchController === other.searchController
      && Self.same(leftItems, other.leftItems) && Self.same(rightItems, other.rightItems)
  }

  private static func same(_ a: [UIBarButtonItem]?, _ b: [UIBarButtonItem]?) -> Bool {
    (a ?? []).count == (b ?? []).count && zip(a ?? [], b ?? []).allSatisfy { $0 === $1 }
  }
}

private struct NavigationItemState: Equatable {
  let views: MovedViews
  let title: String?
  let subtitle: String?
  let supplementsBackButton: Bool
  let hidesBackButton: Bool
  let largeTitleDisplayMode: UINavigationItem.LargeTitleDisplayMode
  let standardAppearance: UINavigationBarAppearance?
  let compactAppearance: UINavigationBarAppearance?
  let scrollEdgeAppearance: UINavigationBarAppearance?

  init(_ item: UINavigationItem, views: MovedViews? = nil) {
    self.views = views ?? MovedViews(item)
    title = item.title
    if #available(iOS 26.0, *) {
      subtitle = item.subtitle
    } else {
      subtitle = nil
    }
    supplementsBackButton = item.leftItemsSupplementBackButton
    hidesBackButton = item.hidesBackButton
    largeTitleDisplayMode = item.largeTitleDisplayMode
    standardAppearance = item.standardAppearance
    compactAppearance = item.compactAppearance
    scrollEdgeAppearance = item.scrollEdgeAppearance
  }

  func apply(to item: UINavigationItem) {
    views.apply(to: item)
    item.title = title
    if #available(iOS 26.0, *) {
      item.subtitle = subtitle
    }
    item.leftItemsSupplementBackButton = supplementsBackButton
    item.hidesBackButton = hidesBackButton
    item.largeTitleDisplayMode = largeTitleDisplayMode
    item.standardAppearance = standardAppearance
    item.compactAppearance = compactAppearance
    item.scrollEdgeAppearance = scrollEdgeAppearance
  }

  static func == (lhs: Self, rhs: Self) -> Bool {
    lhs.views.isSame(as: rhs.views) && lhs.title == rhs.title && lhs.subtitle == rhs.subtitle
      && lhs.supplementsBackButton == rhs.supplementsBackButton && lhs.hidesBackButton == rhs.hidesBackButton
      && lhs.largeTitleDisplayMode == rhs.largeTitleDisplayMode
      && lhs.standardAppearance === rhs.standardAppearance && lhs.compactAppearance === rhs.compactAppearance
      && lhs.scrollEdgeAppearance === rhs.scrollEdgeAppearance
  }
}

final class SplitViewStackScreenView: ExpoView {
  static let pending = NSHashTable<SplitViewStackScreenView>.weakObjects()
  var columnId = ""
  var active = true
  var screenFocused = true
  var headerShown = true
  var gestureEnabled = true
  private(set) weak var screenController: UIViewController?
  private weak var owner: SplitViewColumnView?
  private let observer = SplitViewLifecycleObserver()
  private var backAction: UIAction?
  private weak var controlledItem: UINavigationItem?
  private var lastSize = CGSize.zero
  private var gestureBlockers: [SplitViewRootGestureBlocker] = []

  override func layoutSubviews() {
    super.layoutSubviews()
    if bounds.size != lastSize {
      lastSize = bounds.size
      attach()
    }
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil {
      attach()
    } else {
      // Removing an ancestor does not call this marker's willMove(toSuperview:).
      // Reconcile membership in the column, since modal presentation can also detach the window.
      owner?.reconcile()
    }
  }

  override func willMove(toSuperview newSuperview: UIView?) {
    if newSuperview == nil {
      Self.pending.remove(self)
      owner?.unregister(self)
      owner = nil
      observer.detach()
      screenController = nil
    }
    super.willMove(toSuperview: newSuperview)
  }

  func attach() {
    guard window != nil else { return }
    var responder: UIResponder? = next
    while let current = responder, !(current is UIViewController) { responder = current.next }
    guard let controller = responder as? UIViewController else { return }
    screenController = controller
    observer.update = { [weak self] in self?.refresh() }
    observer.attach(to: controller, in: self)
    refresh()
  }

  private func refresh() {
    guard let column = SplitViewColumnView.columns.object(forKey: columnId as NSString) else {
      Self.pending.add(self)
      return
    }
    Self.pending.remove(self)
    if owner !== column {
      owner?.unregister(self)
      owner = column
      column.register(self)
    } else {
      column.reconcile()
    }
  }

  func installControls(split: UISplitViewController, previousColumn: String) {
    guard let controller = screenController, let navigation = controller.navigationController else { return }
    let item = controller.navigationItem
    if controlledItem !== item {
      restoreControls()
      controlledItem = item
    }
    if split.isCollapsed {
      let previous: UISplitViewController.Column = previousColumn == "supplementary" ? .supplementary : .primary
      if navigation.viewControllers.first === controller, split.viewController(for: previous) != nil {
        // Matches the Back of the shared bar, which replaces this header while the root rests. On iOS 26 that Back
        // shows the title of the previous column only when the column sets a Back title.
        let previousItem = (split.viewController(for: previous) as? UINavigationController)?.topViewController?
          .navigationItem
        let title = previousItem?.backButtonDisplayMode == .minimal ? "" : previousItem?.backButtonTitle ?? ""
        if let backAction, item.backAction === backAction, backAction.title != title {
          removeBackAction()
        }
        if item.backAction == nil {
          item.backAction = UIAction(title: title) { [weak split] _ in split?.show(previous) }
          backAction = item.backAction
        }
      }
    } else {
      removeBackAction()
    }
    updateGestureBlockers(split: split)
  }

  private func updateGestureBlockers(split: UISplitViewController) {
    guard split.isCollapsed, !gestureEnabled, let stack = screenController?.navigationController,
      stack.viewControllers.first === screenController, stack.view.window != nil,
      let primary = split.viewController(for: .primary) as? UINavigationController, primary !== stack,
      primary.topViewController.map({ stack.view.isDescendant(of: $0.view) }) == true
    else {
      restoreGestureBlockers()
      return
    }
    var gestures = [primary.interactivePopGestureRecognizer].compactMap { $0 }
    if #available(iOS 26.0, *), let contentGesture = primary.interactiveContentPopGestureRecognizer {
      gestures.append(contentGesture)
    }
    if gestureBlockers.count == gestures.count,
      zip(gestureBlockers, gestures).allSatisfy({ $0.gesture === $1 && $1.delegate === $0 })
    {
      return
    }
    restoreGestureBlockers()
    gestureBlockers = gestures.map { gesture in
      let blocker = SplitViewRootGestureBlocker(gesture: gesture)
      gesture.delegate = blocker
      return blocker
    }
  }

  private func restoreGestureBlockers() {
    for blocker in gestureBlockers { blocker.restore() }
    gestureBlockers.removeAll()
  }

  // The Stack navigation controller when it rests on this root screen in a collapsed split view.
  func restingRootStack(collapsed: Bool) -> UINavigationController? {
    guard collapsed, active, screenFocused, headerShown, let controller = screenController,
      let stack = controller.navigationController, stack.viewControllers == [controller]
    else { return nil }
    // `transitionCoordinator` also reports the transitions of the columns that contain the Stack.
    if let coordinator = stack.transitionCoordinator,
      [UITransitionContextViewControllerKey.from, .to].contains(where: {
        coordinator.viewController(forKey: $0)?.navigationController === stack
      })
    {
      return nil
    }
    return stack
  }

  func restoreControls() {
    restoreGestureBlockers()
    removeBackAction()
    controlledItem = nil
  }

  private func removeBackAction() {
    if let backAction, controlledItem?.backAction === backAction { controlledItem?.backAction = nil }
    backAction = nil
  }

}
