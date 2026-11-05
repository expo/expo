import RNScreens
import Testing
import UIKit

@testable import ExpoRouter

@MainActor
private final class SplitViewOwnershipFixture {
  let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 600, height: 800))
  let column = UIViewController()
  let screen = UIViewController()
  let coordinator = SplitViewColumnView(appContext: nil)
  let marker = SplitViewStackScreenView(appContext: nil)
  let subtree = UIView()
  let screenContent = UIView()
  let columnNavigation: UINavigationController
  let stack: UINavigationController

  init() {
    columnNavigation = UINavigationController(rootViewController: column)
    stack = UINavigationController(rootViewController: screen)
    window.rootViewController = columnNavigation
    window.isHidden = false
    columnNavigation.view.layoutIfNeeded()
    coordinator.columnId = UUID().uuidString
    column.view.addSubview(coordinator)
    coordinator.attach()

    subtree.frame = column.view.bounds
    column.view.addSubview(subtree)
    column.addChild(stack)
    stack.view.frame = subtree.bounds
    subtree.addSubview(stack.view)
    stack.didMove(toParent: column)
    stack.view.layoutIfNeeded()
    screenContent.frame = screen.view.bounds
    screen.view.addSubview(screenContent)
    marker.columnId = coordinator.columnId
    screenContent.addSubview(marker)
    marker.attach()
    coordinator.reconcile()
  }
}

@Suite("SplitView Stack ownership teardown")
@MainActor
struct SplitViewOwnershipTests {
  @Test
  func `removing a Stack ancestor restores the split header before controller teardown`() {
    let fixture = SplitViewOwnershipFixture()
    defer { fixture.window.isHidden = true }
    #expect(fixture.columnNavigation.isNavigationBarHidden)

    fixture.subtree.removeFromSuperview()

    // Fabric can retain controller containment until a later mounting transaction.
    #expect(fixture.stack.parent === fixture.column)
    #expect(fixture.marker.superview === fixture.screenContent)
    #expect(fixture.marker.window == nil)
    #expect(!fixture.columnNavigation.isNavigationBarHidden)
  }

  @Test
  func `detaching the whole column retains its Stack ownership for full screen presentation`() {
    let fixture = SplitViewOwnershipFixture()
    defer { fixture.window.isHidden = true }
    #expect(fixture.columnNavigation.isNavigationBarHidden)

    // A full-screen presentation detaches the presenting subtree without removing the Stack from its column.
    fixture.window.rootViewController = UIViewController()
    fixture.coordinator.reconcile()

    #expect(fixture.marker.window == nil)
    #expect(fixture.stack.view.isDescendant(of: fixture.column.view))
    #expect(fixture.columnNavigation.isNavigationBarHidden)
  }

  @Test
  func `removing the Stack preserves an explicitly hidden split header`() {
    let fixture = SplitViewOwnershipFixture()
    defer { fixture.window.isHidden = true }
    fixture.coordinator.configuredHidden = true

    fixture.subtree.removeFromSuperview()

    #expect(fixture.columnNavigation.isNavigationBarHidden)
  }
}

@MainActor
@available(iOS 17.0, *)
private final class SplitViewRestingRootFixture {
  let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 393, height: 852))
  let split = UISplitViewController(style: .doubleColumn)
  let primary = UINavigationController(rootViewController: UIViewController())
  let column = UIViewController()
  let content: UINavigationController
  let coordinator = SplitViewColumnView(appContext: nil)
  let root = RNSScreenView(frame: .zero)
  let marker = SplitViewStackScreenView(appContext: nil)

  var stack: UINavigationController? { root.controller.navigationController }

  init() async throws {
    content = UINavigationController(rootViewController: column)
    split.traitOverrides.horizontalSizeClass = .compact
    split.setViewController(primary, for: .primary)
    split.setViewController(content, for: .secondary)
    window.rootViewController = split
    window.makeKeyAndVisible()
    try await Task.sleep(for: .milliseconds(500))
    split.show(.secondary)
    try await waitForTransition(of: primary)
    column.navigationItem.title = "Entry"
    coordinator.columnId = UUID().uuidString
    column.view.addSubview(coordinator)
    coordinator.attach()
    let stackView = RNSScreenStackView(frame: column.view.bounds)
    stackView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    root.activityState = 2
    stackView.insertReactSubview(root, at: 0)
    column.view.addSubview(stackView)
    stackView.setNeedsLayout()
    stackView.layoutIfNeeded()
    root.controller.navigationItem.title = "Settings"
    marker.columnId = coordinator.columnId
    root.addSubview(marker)
    marker.attach()
    coordinator.reconcile()
  }

  func tearDown() {
    primary.delegate = nil
    root.invalidateImpl()
    window.isHidden = true
  }
}

@MainActor
private func waitForTransition(of navigation: UINavigationController) async throws {
  try await Task.sleep(for: .milliseconds(50))
  for _ in 0..<40 where navigation.transitionCoordinator != nil {
    try await Task.sleep(for: .milliseconds(50))
  }
  #expect(navigation.transitionCoordinator == nil)
}

@Suite("SplitView resting Stack root")
@MainActor
struct SplitViewRestingRootTests {
  @Test
  @available(iOS 17.0, *)
  func `a resting Stack root shows its item in the shared bar`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let stack = try #require(fixture.stack)

    #expect(!fixture.content.isNavigationBarHidden)
    #expect(fixture.column.navigationItem.title == "Settings")
    #expect(stack.isNavigationBarHidden)
  }

  @Test
  @available(iOS 17.0, *)
  func `the root items move to the shared bar and back`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let source = fixture.root.controller.navigationItem
    let plain = UIBarButtonItem(title: "Add", primaryAction: nil, menu: nil)
    let custom = UIBarButtonItem(customView: UILabel())
    source.rightBarButtonItems = [plain, custom]
    try await Task.sleep(for: .milliseconds(50))

    // An item shows in one bar at a time.
    #expect(fixture.column.navigationItem.rightBarButtonItems?.count == 2)
    #expect(fixture.column.navigationItem.rightBarButtonItems?.first === plain)
    #expect(source.rightBarButtonItems == nil)
    fixture.marker.screenFocused = false
    fixture.coordinator.reconcile()
    #expect(source.rightBarButtonItems?.count == 2)
    #expect(source.rightBarButtonItems?.last === custom)
    #expect(fixture.column.navigationItem.rightBarButtonItems == nil)
  }

  @Test
  @available(iOS 17.0, *)
  func `a Screens header update keeps the moved views of the root`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let stack = try #require(fixture.stack)
    let source = fixture.root.controller.navigationItem
    let custom = UIBarButtonItem(customView: UILabel())
    source.rightBarButtonItems = [custom]
    try await Task.sleep(for: .milliseconds(50))
    #expect(fixture.column.navigationItem.rightBarButtonItems?.first === custom)

    // Screens rebuilds the item from its subviews in this order, then shows its header.
    source.title = "Updated"
    source.titleView = nil
    source.leftBarButtonItems = nil
    source.rightBarButtonItems = nil
    source.rightBarButtonItems = (source.rightBarButtonItems ?? []) + [custom]
    source.leftBarButtonItems = source.leftBarButtonItems
    source.rightBarButtonItems = source.rightBarButtonItems
    stack.setNavigationBarHidden(false, animated: false)
    try await Task.sleep(for: .milliseconds(50))

    #expect(fixture.column.navigationItem.title == "Updated")
    #expect(fixture.column.navigationItem.rightBarButtonItems?.first === custom)
    #expect(source.rightBarButtonItems == nil)
    fixture.marker.screenFocused = false
    fixture.coordinator.reconcile()
    #expect(source.rightBarButtonItems?.first === custom)
    #expect(fixture.column.navigationItem.rightBarButtonItems == nil)
  }

  @Test
  @available(iOS 17.0, *)
  func `column header updates while the root is shown are kept for later`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let header = SplitViewHeaderView(appContext: nil)
    fixture.column.view.addSubview(header)
    header.headerTitle = "Entry 2"
    header.configureNavigationItem(fixture.column.navigationItem)

    #expect(fixture.column.navigationItem.title == "Settings")
    fixture.marker.screenFocused = false
    fixture.coordinator.reconcile()
    #expect(fixture.column.navigationItem.title == "Entry 2")
  }

  @Test
  @available(iOS 17.0, *)
  func `a replaced root returns the views of the previous root`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let stack = try #require(fixture.stack)
    let custom = UIBarButtonItem(customView: UILabel())
    let oldItem = fixture.root.controller.navigationItem
    oldItem.rightBarButtonItems = [custom]
    try await Task.sleep(for: .milliseconds(50))
    #expect(oldItem.rightBarButtonItems == nil)

    let replacement = UIViewController()
    replacement.navigationItem.title = "Replacement"
    stack.setViewControllers([replacement], animated: false)
    stack.view.layoutIfNeeded()
    let marker = SplitViewStackScreenView(appContext: nil)
    marker.columnId = fixture.coordinator.columnId
    replacement.view.addSubview(marker)
    marker.attach()
    fixture.marker.active = false
    fixture.coordinator.reconcile()

    #expect(oldItem.rightBarButtonItems?.first === custom)
    #expect(fixture.column.navigationItem.title == "Replacement")
    marker.removeFromSuperview()
  }

  @Test
  @available(iOS 17.0, *)
  func `options of the resting root update the shared bar`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let stack = try #require(fixture.stack)

    // Screens shows its header again whenever it applies the screen options.
    fixture.root.controller.navigationItem.title = "Updated"
    stack.setNavigationBarHidden(false, animated: false)

    #expect(stack.navigationBar.isHidden)
    try await Task.sleep(for: .milliseconds(50))
    #expect(stack.isNavigationBarHidden)
    #expect(fixture.column.navigationItem.title == "Updated")
  }

  @Test
  @available(iOS 17.0, *)
  func `a push from the root returns the header to the Stack`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let stack = try #require(fixture.stack)

    // A push makes the root lose focus in the same mounting transaction.
    fixture.marker.screenFocused = false
    fixture.coordinator.reconcile()

    #expect(fixture.content.isNavigationBarHidden)
    #expect(!stack.isNavigationBarHidden)
    #expect(fixture.column.navigationItem.title == "Entry")
    fixture.marker.screenFocused = true
    fixture.coordinator.reconcile()
    #expect(!fixture.content.isNavigationBarHidden)
    #expect(fixture.column.navigationItem.title == "Settings")
    #expect(stack.isNavigationBarHidden)
  }

  @Test
  @available(iOS 17.0, *)
  func `a hidden Stack root header hides the shared bar`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let stack = try #require(fixture.stack)

    fixture.marker.headerShown = false
    stack.setNavigationBarHidden(true, animated: false)
    fixture.coordinator.reconcile()

    #expect(fixture.content.isNavigationBarHidden)
    #expect(stack.isNavigationBarHidden)
    #expect(fixture.column.navigationItem.title == "Entry")
  }

  @Test
  @available(iOS 17.0, *)
  func `popping the column animates the shared bar from the Stack root item`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let stack = try #require(fixture.stack)

    fixture.primary.popViewController(animated: true)
    try await Task.sleep(for: .milliseconds(50))

    #expect(fixture.primary.transitionCoordinator != nil)
    #expect(fixture.column.navigationItem.title == "Settings")
    #expect(stack.isNavigationBarHidden)
    try await waitForTransition(of: fixture.primary)
  }

  @Test
  @available(iOS 17.0, *)
  func `a cancelled column pop keeps the Stack root item in the shared bar`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let stack = try #require(fixture.stack)
    // A custom interactive transition stands in for the edge swipe, which tests cannot cancel.
    let driver = SplitViewPopDriver()
    fixture.primary.delegate = driver

    fixture.primary.popViewController(animated: true)
    try await Task.sleep(for: .milliseconds(50))
    driver.interaction.update(0.4)
    try await Task.sleep(for: .milliseconds(50))
    #expect(fixture.primary.transitionCoordinator?.isInteractive == true)
    driver.interaction.cancel()
    try await waitForTransition(of: fixture.primary)

    #expect(fixture.primary.topViewController === fixture.content)
    #expect(!fixture.content.isNavigationBarHidden)
    // Without a header config, Screens clears the root title when the root appears again.
    #expect(fixture.column.navigationItem.title == fixture.root.controller.navigationItem.title)
    #expect(stack.isNavigationBarHidden)
  }

  @Test(arguments: [false, true])
  @available(iOS 26.0, *)
  func `a Stack root with disabled gestures blocks the swipe back to the previous column`(contentPop: Bool) async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let gesture = try #require(
      contentPop
        ? fixture.primary.interactiveContentPopGestureRecognizer
        : fixture.primary.interactivePopGestureRecognizer
    )
    let original = gesture.delegate

    fixture.marker.gestureEnabled = false
    fixture.coordinator.reconcile()
    #expect(gesture.delegate?.gestureRecognizerShouldBegin?(gesture) == false)

    fixture.marker.gestureEnabled = true
    fixture.coordinator.reconcile()
    #expect(gesture.delegate === original)
  }

  @Test
  @available(iOS 17.0, *)
  func `the gesture block ends when another column is on top`() async throws {
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 393, height: 852))
    let split = UISplitViewController(style: .tripleColumn)
    split.traitOverrides.horizontalSizeClass = .compact
    let primary = UINavigationController(rootViewController: UIViewController())
    let middle = UINavigationController(rootViewController: UIViewController())
    let column = UIViewController()
    split.setViewController(primary, for: .primary)
    split.setViewController(middle, for: .supplementary)
    split.setViewController(UINavigationController(rootViewController: column), for: .secondary)
    window.rootViewController = split
    window.makeKeyAndVisible()
    defer { window.isHidden = true }
    try await Task.sleep(for: .milliseconds(500))
    split.show(.supplementary)
    try await waitForTransition(of: primary)
    split.show(.secondary)
    try await waitForTransition(of: primary)
    let gesture = try #require(primary.interactivePopGestureRecognizer)
    let original = gesture.delegate
    let coordinator = SplitViewColumnView(appContext: nil)
    coordinator.columnId = UUID().uuidString
    column.view.addSubview(coordinator)
    coordinator.attach()
    let stackView = RNSScreenStackView(frame: column.view.bounds)
    let root = RNSScreenView(frame: .zero)
    root.activityState = 2
    stackView.insertReactSubview(root, at: 0)
    column.view.addSubview(stackView)
    stackView.layoutIfNeeded()
    let marker = SplitViewStackScreenView(appContext: nil)
    marker.columnId = coordinator.columnId
    marker.gestureEnabled = false
    root.addSubview(marker)
    marker.attach()
    coordinator.reconcile()
    #expect(gesture.delegate !== original)

    split.show(.supplementary)
    try await waitForTransition(of: primary)
    coordinator.reconcile()

    #expect(primary.topViewController === middle)
    #expect(gesture.delegate === original)
    root.invalidateImpl()
  }

  @Test
  @available(iOS 17.0, *)
  func `the shared bar shows a custom view again after a cancelled column pop removed it`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let view = UILabel()
    fixture.root.controller.navigationItem.rightBarButtonItems = [UIBarButtonItem(customView: view)]
    try await Task.sleep(for: .milliseconds(100))
    #expect(view.isDescendant(of: fixture.primary.navigationBar))
    let driver = SplitViewPopDriver()
    fixture.primary.delegate = driver

    fixture.primary.popViewController(animated: true)
    try await Task.sleep(for: .milliseconds(50))
    driver.interaction.update(0.4)
    try await Task.sleep(for: .milliseconds(50))
    driver.interaction.cancel()
    try await waitForTransition(of: fixture.primary)
    // The bar removes the views it showed for the cancelled pop, after the transition ends.
    view.removeFromSuperview()
    // The repair checks after the removal run within this wait.
    try await Task.sleep(for: .milliseconds(200))

    #expect(view.isDescendant(of: fixture.primary.navigationBar))
  }

  @Test
  @available(iOS 17.0, *)
  func `the shared bar shows a custom view again after the column is shown again`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let view = UILabel()
    fixture.root.controller.navigationItem.rightBarButtonItems = [UIBarButtonItem(customView: view)]
    try await Task.sleep(for: .milliseconds(100))
    fixture.primary.popViewController(animated: true)
    try await waitForTransition(of: fixture.primary)

    fixture.split.show(.secondary)
    try await waitForTransition(of: fixture.primary)
    // The bar that animated the earlier pop removes the view in a later layout.
    view.removeFromSuperview()
    // The repair checks after the removal run within this wait.
    try await Task.sleep(for: .milliseconds(200))

    #expect(fixture.primary.topViewController === fixture.content)
    #expect(view.isDescendant(of: fixture.primary.navigationBar))
  }

  @Test
  @available(iOS 17.0, *)
  func `the shared bar shows a custom view again after Screens wraps it in a new item`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let view = UILabel()
    fixture.root.controller.navigationItem.rightBarButtonItems = [UIBarButtonItem(customView: view)]
    try await Task.sleep(for: .milliseconds(100))

    // Screens creates a new item for the same view when it applies the options again. The hidden Stack bar then
    // removes that view from the shared bar.
    fixture.root.controller.navigationItem.rightBarButtonItems = [UIBarButtonItem(customView: view)]
    try await Task.sleep(for: .milliseconds(50))
    view.removeFromSuperview()
    // The repair checks after the removal run within this wait.
    try await Task.sleep(for: .milliseconds(200))

    #expect(view.isDescendant(of: fixture.primary.navigationBar))
  }

  @Test
  @available(iOS 17.0, *)
  func `the shared bar does not clear custom views that it still shows`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let view = UILabel()
    fixture.root.controller.navigationItem.rightBarButtonItems = [UIBarButtonItem(customView: view)]
    try await Task.sleep(for: .milliseconds(100))
    var cleared = false
    let observation = fixture.column.navigationItem.observe(\.rightBarButtonItems) { item, _ in
      if item.rightBarButtonItems == nil { cleared = true }
    }
    defer { observation.invalidate() }

    // An options update wraps the view again. A pressed button or an open menu keeps its state when the view stays.
    fixture.root.controller.navigationItem.rightBarButtonItems = [UIBarButtonItem(customView: view)]
    try await Task.sleep(for: .milliseconds(1500))

    #expect(view.isDescendant(of: fixture.primary.navigationBar))
    #expect(!cleared)
  }

  @Test
  @available(iOS 17.0, *)
  func `the shared bar leaves a custom view outside the bar after the checks end`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let view = UILabel()
    fixture.root.controller.navigationItem.rightBarButtonItems = [UIBarButtonItem(customView: view)]
    // The checks after the views moved end after about one second.
    try await Task.sleep(for: .milliseconds(1500))

    // UIKit moves a custom view out of the bar on purpose, for example into the overflow menu.
    view.removeFromSuperview()
    fixture.coordinator.reconcile()
    try await Task.sleep(for: .milliseconds(200))

    #expect(view.superview == nil)
  }

  @Test
  @available(iOS 17.0, *)
  func `the column reports the shared bar height while it shows the root`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    var heights: [Double] = []
    fixture.coordinator.onOwnershipChange.onEventSent = { heights.append($0["mirroredHeaderHeight"] as? Double ?? -1) }

    fixture.marker.screenFocused = false
    fixture.coordinator.reconcile()
    #expect(heights.last == 0)
    fixture.marker.screenFocused = true
    fixture.coordinator.reconcile()
    try await Task.sleep(for: .milliseconds(50))

    let bar = fixture.primary.navigationBar
    #expect(bar.frame.maxY > 0)
    #expect(heights.last == Double(bar.frame.maxY))
  }

  @Test
  @available(iOS 17.0, *)
  func `the expanded layout keeps the Stack header`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let stack = try #require(fixture.stack)

    fixture.split.traitOverrides.horizontalSizeClass = .regular
    try await Task.sleep(for: .milliseconds(500))

    #expect(!fixture.split.isCollapsed)
    #expect(!stack.isNavigationBarHidden)
    #expect(fixture.column.navigationItem.title == "Entry")
  }

  @Test
  @available(iOS 17.0, *)
  func `removing the Stack or the column restores both headers`() async throws {
    let fixture = try await SplitViewRestingRootFixture()
    defer { fixture.tearDown() }
    let stack = try #require(fixture.stack)

    fixture.marker.removeFromSuperview()
    #expect(!stack.isNavigationBarHidden)
    #expect(fixture.column.navigationItem.title == "Entry")
    fixture.root.addSubview(fixture.marker)
    fixture.marker.attach()
    fixture.coordinator.reconcile()
    #expect(stack.isNavigationBarHidden)
    fixture.coordinator.removeFromSuperview()
    #expect(!stack.isNavigationBarHidden)
    #expect(fixture.column.navigationItem.title == "Entry")
  }

  @Test
  @available(iOS 17.0, *)
  func `removing the window releases the split hierarchy`() async throws {
    weak var releasedMarker: SplitViewStackScreenView?
    weak var releasedStack: UINavigationController?
    weak var releasedSplit: UISplitViewController?
    do {
      let fixture = try await SplitViewRestingRootFixture()
      #expect(fixture.stack?.isNavigationBarHidden == true)
      releasedMarker = fixture.marker
      releasedStack = fixture.stack
      releasedSplit = fixture.split
      fixture.window.rootViewController = nil
      // Fabric invalidates screens on unmount to release their view-controller cycle.
      fixture.tearDown()
    }
    try await Task.sleep(for: .milliseconds(500))
    #expect(releasedMarker == nil)
    #expect(releasedStack == nil)
    #expect(releasedSplit == nil)
  }
}

@Suite("SplitView sidebar button")
@MainActor
struct SplitViewSidebarButtonTests {
  @Test
  @available(iOS 17.0, *)
  func `the content column reports the sidebar button only without a column beside it`() async throws {
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 1366, height: 1024))
    let split = UISplitViewController(style: .doubleColumn)
    split.traitOverrides.horizontalSizeClass = .regular
    split.preferredSplitBehavior = .tile
    split.preferredDisplayMode = .oneBesideSecondary
    let column = UIViewController()
    split.setViewController(UINavigationController(rootViewController: UIViewController()), for: .primary)
    split.setViewController(UINavigationController(rootViewController: column), for: .secondary)
    window.rootViewController = split
    window.makeKeyAndVisible()
    defer { window.isHidden = true }
    try await Task.sleep(for: .milliseconds(500))
    let coordinator = SplitViewColumnView(appContext: nil)
    var ownership: [String: Any]?
    coordinator.onOwnershipChange.onEventSent = { ownership = $0 }
    coordinator.columnId = UUID().uuidString
    column.view.addSubview(coordinator)
    coordinator.attach()
    #expect(split.displayMode == .oneBesideSecondary)
    #expect(ownership?["showsSidebarButton"] as? Bool == false)

    split.preferredDisplayMode = .secondaryOnly
    try await Task.sleep(for: .milliseconds(500))
    coordinator.reconcile()

    #expect(split.displayMode == .secondaryOnly)
    #expect(ownership?["showsSidebarButton"] as? Bool == true)
  }
}

private final class SplitViewPopDriver: NSObject, UINavigationControllerDelegate,
  UIViewControllerAnimatedTransitioning
{
  let interaction = UIPercentDrivenInteractiveTransition()

  func navigationController(
    _ navigationController: UINavigationController,
    animationControllerFor operation: UINavigationController.Operation,
    from fromVC: UIViewController,
    to toVC: UIViewController
  ) -> UIViewControllerAnimatedTransitioning? {
    self
  }

  func navigationController(
    _ navigationController: UINavigationController,
    interactionControllerFor animationController: UIViewControllerAnimatedTransitioning
  ) -> UIViewControllerInteractiveTransitioning? {
    interaction
  }

  func transitionDuration(using transitionContext: UIViewControllerContextTransitioning?) -> TimeInterval {
    0.3
  }

  func animateTransition(using transitionContext: UIViewControllerContextTransitioning) {
    guard let from = transitionContext.view(forKey: .from), let to = transitionContext.view(forKey: .to) else {
      return
    }
    transitionContext.containerView.insertSubview(to, belowSubview: from)
    UIView.animate(withDuration: 0.3) {
      from.transform = CGAffineTransform(translationX: from.bounds.width, y: 0)
    } completion: { _ in
      from.transform = .identity
      transitionContext.completeTransition(!transitionContext.transitionWasCancelled)
    }
  }
}
