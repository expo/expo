import ExpoModulesCore
import RNScreens
import UIKit

// A child controller observes UIKit transitions without taking a Screens delegate.
final class SplitViewLifecycleObserver: UIViewController, RNSViewControllerDelegate {
  var update: (() -> Void)?

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

private final class SplitViewRootGestureDelegate: NSObject, UIGestureRecognizerDelegate {
  weak var screen: SplitViewStackScreenView?
  weak var gesture: UIGestureRecognizer?
  let original: UIGestureRecognizerDelegate?

  init(screen: SplitViewStackScreenView, gesture: UIGestureRecognizer) {
    self.screen = screen
    self.gesture = gesture
    (gesture.delegate as? SplitViewRootGestureDelegate)?.restore()
    original = gesture.delegate
  }

  func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    guard screen?.canBeginRootGesture(gestureRecognizer) == true else { return false }
    return original?.gestureRecognizerShouldBegin?(gestureRecognizer) ?? true
  }

  // UIKit's private admission callback rejects hidden bars. Preserve its public gesture policy.
  private func isPublicCallback(_ selector: Selector) -> Bool {
    guard let delegateProtocol = objc_getProtocol("UIGestureRecognizerDelegate") else { return false }
    return protocol_getMethodDescription(delegateProtocol, selector, false, true).name != nil
  }

  override func responds(to selector: Selector!) -> Bool {
    super.responds(to: selector) || (isPublicCallback(selector) && original?.responds(to: selector) == true)
  }

  override func forwardingTarget(for selector: Selector!) -> Any? {
    isPublicCallback(selector) ? original : super.forwardingTarget(for: selector)
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
  private var lastOwnership: [String: Bool]?
  private var reconciling = false

  var configuredHidden = false {
    didSet { reconcile() }
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    if superview == nil {
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
    let hidden = configuredHidden || owner != nil
    if navigation.isNavigationBarHidden != hidden {
      navigation.setNavigationBarHidden(hidden, animated: false)
    }
    if owner != nil {
      hideSharedBarDuringPop(of: navigation)
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
    let ownership = [
      "ownsHeader": owner != nil, "isCollapsed": collapsed, "showsSidebarButton": showsSidebarButton,
    ]
    if lastOwnership != ownership {
      lastOwnership = ownership
      onOwnershipChange(ownership)
    }
  }

  // When collapsed, this navigation controller is nested in the primary one and shares its bar.
  // Popping it animates that bar over the leaving Stack header, so the bar stays invisible until the pop ends.
  private func hideSharedBarDuringPop(of navigation: UINavigationController) {
    guard navigation.isMovingFromParent, let primary = navigation.navigationController,
      let coordinator = primary.transitionCoordinator, primary.navigationBar.layer.mask == nil
    else { return }
    let bar = primary.navigationBar
    // UIKit animates the alpha of the bar during the transition, so an empty mask hides it instead.
    bar.layer.mask = CALayer()
    coordinator.animate(alongsideTransition: nil) { context in
      bar.layer.mask = nil
      if !context.isCancelled {
        let fade = CATransition()
        fade.type = .fade
        bar.layer.add(fade, forKey: nil)
      }
    }
  }

  func showSidebar() {
    column?.splitViewController?.show(.primary)
  }

  private func restoreNavigation() {
    controlledNavigation?.setNavigationBarHidden(originalHidden, animated: false)
    controlledNavigation = nil
  }
}

final class SplitViewStackScreenView: ExpoView {
  static let pending = NSHashTable<SplitViewStackScreenView>.weakObjects()
  var columnId = ""
  var active = true
  private(set) weak var screenController: UIViewController?
  private weak var owner: SplitViewColumnView?
  private let observer = SplitViewLifecycleObserver()
  private var backAction: UIAction?
  private weak var controlledItem: UINavigationItem?
  private var lastSize = CGSize.zero
  private var rootGestureDelegates: [SplitViewRootGestureDelegate] = []

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
      if navigation.viewControllers.first === controller, item.backAction == nil,
        split.viewController(for: previous) != nil
      {
        item.backAction = UIAction(title: "Back") { [weak split] _ in split?.show(previous) }
        backAction = item.backAction
      }
    } else {
      removeBackAction()
    }
    updateRootGesture()
  }

  fileprivate func canBeginRootGesture(_ gesture: UIGestureRecognizer) -> Bool {
    guard let navigation = rootGestureNavigation,
      navigation.transitionCoordinator == nil,
      screenController?.transitionCoordinator == nil
    else { return false }
    if navigation.interactivePopGestureRecognizer === gesture { return true }
    if #available(iOS 26.0, *) {
      return navigation.interactiveContentPopGestureRecognizer === gesture
    }
    return false
  }

  private var rootGestureNavigation: UINavigationController? {
    guard active, owner != nil, let controller = screenController,
      let stack = controller.navigationController, stack.viewControllers.count == 1,
      stack.topViewController === controller, stack.view.window != nil,
      (controller.view as? RNSScreenView)?.gestureEnabled != false,
      controller.presentedViewController == nil, stack.presentedViewController == nil,
      let split = stack.splitViewController, split.isCollapsed, split.presentedViewController == nil,
      let primary = split.viewController(for: .primary) as? UINavigationController,
      primary !== stack, primary.viewControllers.count > 1, primary.presentedViewController == nil,
      let top = primary.topViewController, stack.view.isDescendant(of: top.view)
    else { return nil }
    return primary
  }

  private func updateRootGesture() {
    guard let navigation = rootGestureNavigation else {
      restoreRootGestures()
      return
    }
    var gestures = [navigation.interactivePopGestureRecognizer].compactMap { $0 }
    if #available(iOS 26.0, *), let contentGesture = navigation.interactiveContentPopGestureRecognizer {
      gestures.append(contentGesture)
    }
    if rootGestureDelegates.count != gestures.count
      || zip(rootGestureDelegates, gestures).contains(where: {
        $0.gesture !== $1 || $1.delegate !== $0
      })
    {
      restoreRootGestures()
      rootGestureDelegates = gestures.map { gesture in
        let delegate = SplitViewRootGestureDelegate(screen: self, gesture: gesture)
        gesture.delegate = delegate
        return delegate
      }
    }
  }

  private func restoreRootGestures() {
    for delegate in rootGestureDelegates { delegate.restore() }
    rootGestureDelegates.removeAll()
  }

  func restoreControls() {
    restoreRootGestures()
    removeBackAction()
    controlledItem = nil
  }

  private func removeBackAction() {
    if let backAction, controlledItem?.backAction === backAction { controlledItem?.backAction = nil }
    backAction = nil
  }

}
