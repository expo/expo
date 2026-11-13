import Testing
import UIKit

@testable import ExpoRouter

// Uses the react-native-screens controllers by name, as `SplitViewHeaderView` does.
@Suite("SplitViewHeaderView navigation bar visibility")
@MainActor
struct SplitViewHeaderViewTests {
  // react-native-screens builds its split view only with `RNS_GAMMA_ENABLED`, so without it
  // stand-ins with the same names are registered before the header installs its hooks.
  // The hooks install once per process, so this must run before the first `configureNavigationItem`.
  init() {
    if NSClassFromString("RNSSplitScreenController") == nil,
      let screenClass = objc_allocateClassPair(UIViewController.self, "RNSSplitScreenController", 0)
    {
      objc_registerClassPair(screenClass)
    }
    if NSClassFromString("RNSSplitHostController") == nil,
      let hostClass = objc_allocateClassPair(UISplitViewController.self, "RNSSplitHostController", 0)
    {
      // Same as `refreshSecondaryNavBar` of react-native-screens.
      let refreshSecondaryNavBar: @convention(block) (UISplitViewController) -> Void = { host in
        let navigationController = host.viewController(for: .secondary) as? UINavigationController
        navigationController?.setNavigationBarHidden(true, animated: false)
        navigationController?.setNavigationBarHidden(false, animated: false)
      }
      class_addMethod(
        hostClass,
        NSSelectorFromString("refreshSecondaryNavBar"),
        imp_implementationWithBlock(refreshSecondaryNavBar),
        "v@:"
      )
      objc_registerClassPair(hostClass)
    }
  }

  @Test
  func `hides the bar when a hidden column appears`() throws {
    let screenClass = try #require(NSClassFromString("RNSSplitScreenController") as? UIViewController.Type)
    let column = screenClass.init()
    let navigationController = UINavigationController(rootViewController: column)
    let header = SplitViewHeaderView(appContext: nil)
    column.view.addSubview(header)
    header.configureNavigationItem(column.navigationItem)
    header.navigationBarHidden = true

    column.viewWillAppear(false)

    #expect(navigationController.isNavigationBarHidden == true)
  }

  // A cancelled swipe-back calls `viewWillAppear` of the hidden previous column, then of the visible top column.
  @Test
  func `shows the bar again when a swipe-back to a hidden column is cancelled`() throws {
    let screenClass = try #require(NSClassFromString("RNSSplitScreenController") as? UIViewController.Type)
    let previousColumn = screenClass.init()
    let topColumn = screenClass.init()
    let navigationController = UINavigationController()
    navigationController.viewControllers = [previousColumn, topColumn]
    let previousHeader = SplitViewHeaderView(appContext: nil)
    previousHeader.navigationBarHidden = true
    previousColumn.view.addSubview(previousHeader)
    previousHeader.configureNavigationItem(previousColumn.navigationItem)
    let topHeader = SplitViewHeaderView(appContext: nil)
    topColumn.view.addSubview(topHeader)
    topHeader.configureNavigationItem(topColumn.navigationItem)
    // The bar as the hidden previous column left it when the swipe-back started.
    navigationController.setNavigationBarHidden(true, animated: false)

    previousColumn.viewWillAppear(true)
    topColumn.viewWillAppear(true)

    #expect(navigationController.isNavigationBarHidden == false)
  }

  // Collapsed columns share one bar, so a column that is not on screen must not change it.
  @Test
  func `keeps the bar when a column outside a window is updated`() throws {
    let screenClass = try #require(NSClassFromString("RNSSplitScreenController") as? UIViewController.Type)
    let column = screenClass.init()
    let navigationController = UINavigationController(rootViewController: column)
    let header = SplitViewHeaderView(appContext: nil)
    column.view.addSubview(header)
    header.configureNavigationItem(column.navigationItem)

    header.navigationBarHidden = true
    header.apply()

    #expect(navigationController.isNavigationBarHidden == false)
  }

  @Test
  func `hides the bar when a column updated during a transition stays on screen`() throws {
    let screenClass = try #require(NSClassFromString("RNSSplitScreenController") as? UIViewController.Type)
    let column = screenClass.init()
    let navigationController = TransitioningNavigationController(rootViewController: column)
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 400, height: 800))
    // A window without a scene does not show its root controller, so the views are added directly.
    window.addSubview(navigationController.view)
    navigationController.view.layoutIfNeeded()
    let header = SplitViewHeaderView(appContext: nil)
    column.view.addSubview(header)
    header.configureNavigationItem(column.navigationItem)
    let transition = FakeTransitionCoordinator()
    navigationController.transition = transition

    header.navigationBarHidden = true
    header.apply()
    transition.end(cancelled: false)

    #expect(navigationController.isNavigationBarHidden == true)
  }

  // `viewWillAppear` of the column that stays sets the bar when a transition is cancelled.
  @Test
  func `keeps the bar when a column updated during a transition is cancelled`() throws {
    let screenClass = try #require(NSClassFromString("RNSSplitScreenController") as? UIViewController.Type)
    let column = screenClass.init()
    let navigationController = TransitioningNavigationController(rootViewController: column)
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 400, height: 800))
    // A window without a scene does not show its root controller, so the views are added directly.
    window.addSubview(navigationController.view)
    navigationController.view.layoutIfNeeded()
    let header = SplitViewHeaderView(appContext: nil)
    column.view.addSubview(header)
    header.configureNavigationItem(column.navigationItem)
    let transition = FakeTransitionCoordinator()
    navigationController.transition = transition

    header.navigationBarHidden = true
    header.apply()
    transition.end(cancelled: true)

    #expect(navigationController.isNavigationBarHidden == false)
  }

  // `refreshSecondaryNavBar` hides and shows the secondary bar to redraw its buttons.
  @Test
  func `keeps the bar of a hidden secondary column hidden after the split host refreshes it`() throws {
    let hostClass = try #require(NSClassFromString("RNSSplitHostController") as? UISplitViewController.Type)
    let screenClass = try #require(NSClassFromString("RNSSplitScreenController") as? UIViewController.Type)
    let host = hostClass.init(style: .doubleColumn)
    let secondaryColumn = screenClass.init()
    let secondaryNavigationController = UINavigationController(rootViewController: secondaryColumn)
    host.setViewController(UINavigationController(rootViewController: screenClass.init()), for: .primary)
    host.setViewController(secondaryNavigationController, for: .secondary)
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 400, height: 800))
    // A split view without a scene does not lay out its columns, so the secondary column is added directly.
    window.addSubview(secondaryNavigationController.view)
    secondaryNavigationController.view.layoutIfNeeded()
    let header = SplitViewHeaderView(appContext: nil)
    header.navigationBarHidden = true
    secondaryColumn.view.addSubview(header)
    header.configureNavigationItem(secondaryColumn.navigationItem)

    host.perform(NSSelectorFromString("refreshSecondaryNavBar"))

    #expect(secondaryNavigationController.isNavigationBarHidden == true)
  }

  // When collapsed, the secondary column can be off screen while another column shows the shared bar.
  @Test
  func `keeps the bar of an off-screen secondary column after the split host refreshes it`() throws {
    let hostClass = try #require(NSClassFromString("RNSSplitHostController") as? UISplitViewController.Type)
    let screenClass = try #require(NSClassFromString("RNSSplitScreenController") as? UIViewController.Type)
    let host = hostClass.init(style: .doubleColumn)
    let secondaryColumn = screenClass.init()
    let secondaryNavigationController = UINavigationController(rootViewController: secondaryColumn)
    host.setViewController(UINavigationController(rootViewController: screenClass.init()), for: .primary)
    host.setViewController(secondaryNavigationController, for: .secondary)
    let header = SplitViewHeaderView(appContext: nil)
    header.navigationBarHidden = true
    secondaryColumn.view.addSubview(header)
    header.configureNavigationItem(secondaryColumn.navigationItem)

    host.perform(NSSelectorFromString("refreshSecondaryNavBar"))

    #expect(secondaryNavigationController.isNavigationBarHidden == false)
  }
}

private final class TransitioningNavigationController: UINavigationController {
  var transition: UIViewControllerTransitionCoordinator?

  override var transitionCoordinator: UIViewControllerTransitionCoordinator? {
    transition
  }
}

// Runs the completions of `animate(alongsideTransition:completion:)` when the test ends the transition.
private final class FakeTransitionCoordinator: NSObject, UIViewControllerTransitionCoordinator {
  private(set) var isCancelled = false
  private var completions: [(UIViewControllerTransitionCoordinatorContext) -> Void] = []

  func end(cancelled: Bool) {
    isCancelled = cancelled
    for completion in completions {
      completion(self)
    }
  }

  func animate(
    alongsideTransition animation: ((UIViewControllerTransitionCoordinatorContext) -> Void)?,
    completion: ((UIViewControllerTransitionCoordinatorContext) -> Void)? = nil
  ) -> Bool {
    if let completion {
      completions.append(completion)
    }
    return true
  }

  func animateAlongsideTransition(
    in view: UIView?,
    animation: ((UIViewControllerTransitionCoordinatorContext) -> Void)?,
    completion: ((UIViewControllerTransitionCoordinatorContext) -> Void)? = nil
  ) -> Bool {
    return false
  }

  func notifyWhenInteractionEnds(_ handler: @escaping (UIViewControllerTransitionCoordinatorContext) -> Void) {}
  func notifyWhenInteractionChanges(_ handler: @escaping (UIViewControllerTransitionCoordinatorContext) -> Void) {}
  var isAnimated: Bool { true }
  var presentationStyle: UIModalPresentationStyle { .none }
  var initiallyInteractive: Bool { false }
  var isInterruptible: Bool { false }
  var isInteractive: Bool { false }
  var transitionDuration: TimeInterval { 0 }
  var percentComplete: CGFloat { 0 }
  var completionVelocity: CGFloat { 1 }
  var completionCurve: UIView.AnimationCurve { .linear }
  var containerView: UIView { UIView() }
  var targetTransform: CGAffineTransform { .identity }
  func viewController(forKey key: UITransitionContextViewControllerKey) -> UIViewController? { nil }
  func view(forKey key: UITransitionContextViewKey) -> UIView? { nil }
}
