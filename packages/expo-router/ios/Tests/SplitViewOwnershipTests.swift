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

@Suite("SplitView root edge gesture")
@MainActor
struct SplitViewRootGestureTests {
  @Test(.enabled(if: NSClassFromString("RNSSplitHostController") != nil), arguments: [false, true])
  @available(iOS 26.0, *)
  func `Screens columns install both root delegates`(contentPop: Bool) async throws {
    // These Fabric classes are NSObject stubs when Screens Gamma is disabled.
    let host = try #require(RNSSplitHostComponentView() as? UIView)
    let sidebar = try #require(RNSSplitScreenComponentView() as? UIView)
    let column = try #require(RNSSplitScreenComponentView() as? UIView)
    let columns = try #require(
      host.perform(NSSelectorFromString("reactSubviews"))?.takeUnretainedValue() as? NSMutableArray
    )
    columns.addObjects(from: [sidebar, column])
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 393, height: 852))
    let container = UIViewController()
    window.rootViewController = container
    host.frame = window.bounds
    container.view.addSubview(host)
    window.makeKeyAndVisible()
    defer { window.isHidden = true }
    let split = try #require(
      host.perform(NSSelectorFromString("splitHostController"))?.takeUnretainedValue()
        as? UISplitViewController
    )
    split.traitOverrides.horizontalSizeClass = .compact
    split.perform(NSSelectorFromString("setNeedsUpdateOfChildViewControllers"))
    split.perform(NSSelectorFromString("updateChildViewControllersIfNeeded"))
    try await Task.sleep(for: .milliseconds(500))
    split.show(.secondary)
    try await Task.sleep(for: .milliseconds(500))
    let primary = try #require(split.viewController(for: .primary) as? UINavigationController)
    #expect(String(describing: type(of: primary)) == "RNSSplitNavigationController")
    #expect(primary.viewControllers.count == 2)
    let gesture = try #require(
      contentPop ? primary.interactiveContentPopGestureRecognizer : primary.interactivePopGestureRecognizer
    )
    let original = try #require(gesture.delegate)
    let coordinator = SplitViewColumnView(appContext: nil)
    coordinator.columnId = UUID().uuidString
    column.addSubview(coordinator)
    coordinator.attach()
    let stackView = RNSScreenStackView(frame: column.bounds)
    stackView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    let root = RNSScreenView(frame: .zero)
    root.activityState = 2
    stackView.insertReactSubview(root, at: 0)
    column.addSubview(stackView)
    stackView.setNeedsLayout()
    stackView.layoutIfNeeded()
    let marker = SplitViewStackScreenView(appContext: nil)
    marker.columnId = coordinator.columnId
    root.addSubview(marker)
    marker.attach()
    coordinator.reconcile()
    try await Task.sleep(for: .milliseconds(500))
    coordinator.reconcile()
    #expect(
      marker.screenController?.navigationController?.parent?.navigationController?
        .isNavigationBarHidden == true
    )
    #expect(gesture.delegate !== original)
    #expect(gesture.delegate?.gestureRecognizerShouldBegin?(gesture) == true)
    marker.removeFromSuperview()
    #expect(gesture.delegate === original)
    root.invalidateImpl()
  }

  @Test(arguments: [false, true])
  @available(iOS 26.0, *)
  func `the root restores gesture delegates through navigation`(contentPop: Bool) async throws {
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 393, height: 852))
    let split = UISplitViewController(style: .tripleColumn)
    split.traitOverrides.horizontalSizeClass = .compact
    let primary = UINavigationController(rootViewController: UIViewController())
    let middle = UINavigationController(rootViewController: UIViewController())
    let column = UIViewController()
    let content = UINavigationController(rootViewController: column)
    split.setViewController(primary, for: .primary)
    split.setViewController(middle, for: .supplementary)
    split.setViewController(content, for: .secondary)
    window.rootViewController = split
    window.makeKeyAndVisible()
    defer { window.isHidden = true }
    try await Task.sleep(for: .milliseconds(500))
    split.show(.supplementary)
    try await Task.sleep(for: .milliseconds(500))
    split.show(.secondary)
    try await Task.sleep(for: .milliseconds(500))
    #expect(primary.viewControllers.count == 3)
    let gesture = try #require(
      contentPop ? primary.interactiveContentPopGestureRecognizer : primary.interactivePopGestureRecognizer
    )
    let originalDelegate = try #require(gesture.delegate)
    let originalGestureView = gesture.view

    let coordinator = SplitViewColumnView(appContext: nil)
    coordinator.columnId = UUID().uuidString
    column.view.addSubview(coordinator)
    coordinator.attach()
    let stackView = RNSScreenStackView(frame: column.view.bounds)
    stackView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    let root = RNSScreenView(frame: .zero)
    root.activityState = 2
    stackView.insertReactSubview(root, at: 0)
    column.view.addSubview(stackView)
    stackView.setNeedsLayout()
    stackView.layoutIfNeeded()
    let navigation = try #require(stackView.reactViewController() as? UINavigationController)
    let innerGesture = try #require(navigation.interactivePopGestureRecognizer)
    let innerDelegate = innerGesture.delegate
    let marker = SplitViewStackScreenView(appContext: nil)
    marker.columnId = coordinator.columnId
    root.addSubview(marker)
    marker.attach()
    coordinator.reconcile()
    #expect(marker.screenController === root.controller)
    #expect(content.isNavigationBarHidden)
    #expect(gesture.delegate !== originalDelegate)
    #expect(gesture.delegate?.gestureRecognizerShouldBegin?(gesture) == true)
    #expect(gesture.view === originalGestureView)
    #expect(innerGesture.delegate === innerDelegate)

    let pushed = RNSScreenView(frame: .zero)
    root.activityState = 1
    pushed.activityState = 2
    stackView.insertReactSubview(pushed, at: 1)
    stackView.markChildUpdated()
    try await Task.sleep(for: .milliseconds(500))
    coordinator.reconcile()
    #expect(navigation.viewControllers.count == 2)
    #expect(gesture.delegate === originalDelegate)
    stackView.removeReactSubview(pushed)
    root.activityState = 2
    stackView.markChildUpdated()
    try await Task.sleep(for: .milliseconds(500))
    coordinator.reconcile()
    #expect(navigation.viewControllers.count == 1)
    #expect(gesture.delegate !== originalDelegate)

    split.traitOverrides.horizontalSizeClass = .regular
    try await Task.sleep(for: .milliseconds(500))
    coordinator.reconcile()
    #expect(!split.isCollapsed)
    #expect(gesture.delegate === originalDelegate)
    split.traitOverrides.horizontalSizeClass = .compact
    try await Task.sleep(for: .milliseconds(500))
    split.show(.supplementary)
    try await Task.sleep(for: .milliseconds(500))
    split.show(.secondary)
    try await Task.sleep(for: .milliseconds(500))
    coordinator.reconcile()
    #expect(primary.topViewController === content)
    #expect(gesture.delegate !== originalDelegate)
    split.show(.supplementary)
    try await Task.sleep(for: .milliseconds(500))
    coordinator.reconcile()
    #expect(primary.topViewController === middle)
    #expect(gesture.delegate === originalDelegate)
    split.show(.secondary)
    try await Task.sleep(for: .milliseconds(500))
    coordinator.reconcile()
    #expect(gesture.delegate !== originalDelegate)
    marker.removeFromSuperview()
    #expect(gesture.delegate === originalDelegate)
    #expect(gesture.view === originalGestureView)
    #expect(innerGesture.delegate === innerDelegate)
  }

  @Test(arguments: [false, true])
  @available(iOS 26.0, *)
  func `new ownership survives late cleanup`(contentPop: Bool) async throws {
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 393, height: 852))
    let split = UISplitViewController(style: .doubleColumn)
    split.traitOverrides.horizontalSizeClass = .compact
    let primary = UINavigationController(rootViewController: UIViewController())
    let column = UIViewController()
    let content = UINavigationController(rootViewController: column)
    split.setViewController(primary, for: .primary)
    split.setViewController(content, for: .secondary)
    window.rootViewController = split
    window.makeKeyAndVisible()
    defer { window.isHidden = true }
    try await Task.sleep(for: .milliseconds(500))
    split.show(.secondary)
    try await Task.sleep(for: .milliseconds(500))
    let gesture = try #require(
      contentPop ? primary.interactiveContentPopGestureRecognizer : primary.interactivePopGestureRecognizer
    )
    let original = SplitViewGesturePolicy()
    gesture.delegate = original
    let coordinator = SplitViewColumnView(appContext: nil)
    coordinator.columnId = UUID().uuidString
    column.view.addSubview(coordinator)
    coordinator.attach()
    let stackView = RNSScreenStackView(frame: column.view.bounds)
    stackView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    let root = RNSScreenView(frame: .zero)
    root.activityState = 2
    stackView.insertReactSubview(root, at: 0)
    column.view.addSubview(stackView)
    stackView.setNeedsLayout()
    stackView.layoutIfNeeded()
    let oldOwner = SplitViewStackScreenView(appContext: nil)
    oldOwner.columnId = coordinator.columnId
    root.addSubview(oldOwner)
    oldOwner.attach()
    coordinator.reconcile()
    weak var oldProxy = gesture.delegate
    #expect(oldProxy !== original)

    let newOwner = SplitViewStackScreenView(appContext: nil)
    newOwner.active = false
    newOwner.columnId = coordinator.columnId
    root.addSubview(newOwner)
    newOwner.attach()
    oldOwner.active = false
    newOwner.active = true
    // Reconciliation across owners can install the new delegate before restoring the old one.
    newOwner.installControls(split: split, previousColumn: "primary")
    let newProxy = try #require(gesture.delegate)
    #expect(newProxy !== oldProxy)
    #expect(newProxy.gestureRecognizerShouldBegin?(gesture) == true)
    oldOwner.restoreControls()
    #expect(gesture.delegate === newProxy)
    #expect(oldProxy == nil)

    original.allowsBegin = false
    #expect(newProxy.gestureRecognizerShouldBegin?(gesture) == false)
    original.allowsBegin = true
    #expect(newProxy.gestureRecognizerShouldBegin?(gesture) == true)
    let otherGesture = UIPanGestureRecognizer()
    #expect(newProxy.gestureRecognizer?(gesture, shouldRequireFailureOf: otherGesture) == true)
    #expect(original.receivedGesture === gesture)
    #expect(original.receivedOtherGesture === otherGesture)
    #expect(
      !newProxy.responds(
        to:
          #selector(UIGestureRecognizerDelegate.gestureRecognizer(_:shouldRecognizeSimultaneouslyWith:))
      )
    )
    #expect(original.responds(to: NSSelectorFromString("_gestureRecognizer:shouldReceiveEvent:")))
    #expect(!newProxy.responds(to: NSSelectorFromString("_gestureRecognizer:shouldReceiveEvent:")))

    newOwner.restoreControls()
    #expect(gesture.delegate === original)
    newOwner.installControls(split: split, previousColumn: "primary")
    #expect(gesture.delegate?.gestureRecognizerShouldBegin?(gesture) == true)
    newOwner.restoreControls()
    #expect(gesture.delegate === original)
  }

  @Test
  @available(iOS 17.0, *)
  func `removing the window releases an owned split hierarchy`() async throws {
    weak var releasedMarker: SplitViewStackScreenView?
    weak var releasedScreen: UIViewController?
    weak var releasedStack: UINavigationController?
    weak var releasedPrimary: UINavigationController?
    weak var releasedSplit: UISplitViewController?
    weak var releasedDelegate: UIGestureRecognizerDelegate?
    do {
      let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 393, height: 852))
      let split = UISplitViewController(style: .doubleColumn)
      split.traitOverrides.horizontalSizeClass = .compact
      let primary = UINavigationController(rootViewController: UIViewController())
      let column = UIViewController()
      let content = UINavigationController(rootViewController: column)
      split.setViewController(primary, for: .primary)
      split.setViewController(content, for: .secondary)
      window.rootViewController = split
      window.makeKeyAndVisible()
      try await Task.sleep(for: .milliseconds(500))
      split.show(.secondary)
      try await Task.sleep(for: .milliseconds(500))
      let gesture = try #require(primary.interactivePopGestureRecognizer)
      releasedDelegate = gesture.delegate
      let coordinator = SplitViewColumnView(appContext: nil)
      coordinator.columnId = UUID().uuidString
      column.view.addSubview(coordinator)
      coordinator.attach()
      let stackView = RNSScreenStackView(frame: column.view.bounds)
      stackView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      let root = RNSScreenView(frame: .zero)
      root.activityState = 2
      stackView.insertReactSubview(root, at: 0)
      column.view.addSubview(stackView)
      stackView.setNeedsLayout()
      stackView.layoutIfNeeded()
      let marker = SplitViewStackScreenView(appContext: nil)
      marker.columnId = coordinator.columnId
      root.addSubview(marker)
      marker.attach()
      coordinator.reconcile()
      #expect(releasedDelegate != nil)
      #expect(gesture.delegate !== releasedDelegate)
      marker.removeFromSuperview()
      #expect(gesture.delegate === releasedDelegate)
      root.addSubview(marker)
      marker.attach()
      coordinator.reconcile()
      #expect(gesture.delegate !== releasedDelegate)
      marker.removeFromSuperview()
      #expect(gesture.delegate === releasedDelegate)
      root.addSubview(marker)
      marker.attach()
      coordinator.reconcile()
      #expect(gesture.delegate !== releasedDelegate)
      releasedMarker = marker
      releasedScreen = root.controller
      releasedStack = root.controller.navigationController
      releasedPrimary = primary
      releasedSplit = split
      window.isHidden = true
      window.rootViewController = nil
      // Fabric invalidates screens on unmount to release their view-controller cycle.
      root.invalidateImpl()
    }
    try await Task.sleep(for: .milliseconds(500))
    #expect(releasedMarker == nil)
    #expect(releasedScreen == nil)
    #expect(releasedStack == nil)
    #expect(releasedPrimary == nil)
    #expect(releasedSplit == nil)
    #expect(releasedDelegate == nil)
  }
}

private final class SplitViewGesturePolicy: NSObject, UIGestureRecognizerDelegate {
  var allowsBegin = true
  weak var receivedGesture: UIGestureRecognizer?
  weak var receivedOtherGesture: UIGestureRecognizer?

  func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    allowsBegin
  }

  func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldRequireFailureOf otherGestureRecognizer: UIGestureRecognizer
  ) -> Bool {
    receivedGesture = gestureRecognizer
    receivedOtherGesture = otherGestureRecognizer
    return true
  }

  @objc(_gestureRecognizer:shouldReceiveEvent:)
  func privateAdmission(_ gestureRecognizer: UIGestureRecognizer, event: UIEvent) -> Bool {
    false
  }
}
