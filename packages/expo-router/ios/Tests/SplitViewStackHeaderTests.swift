import RNScreens
import Testing
import UIKit

@testable import ExpoRouter

@Suite("SplitView Stack headers")
@MainActor
struct SplitViewStackHeaderTests {
  @Test
  func `root uses the column header and every push uses its own header`() {
    let column = RNSSplitScreenComponentView(frame: .zero)
    let columnNavigation = UINavigationController(rootViewController: column.controller)
    let root = RNSScreenView(frame: .zero)
    let stack = RNSNavigationController(rootViewController: root.controller)
    column.controller.addChild(stack)
    column.addSubview(stack.view)
    stack.didMove(toParent: column.controller)
    let header = SplitViewHeaderView(appContext: nil)
    header.headerTitle = "Split title"
    column.addSubview(header)
    header.configureNavigationItem(column.controller.navigationItem)
    let config = RNSScreenStackHeaderConfig(frame: .zero)
    config.show = true
    config.title = "Stack root"

    RNSScreenStackHeaderConfig.willShow(root.controller, animated: false, with: config)
    #expect(stack.isNavigationBarHidden)
    #expect(!columnNavigation.isNavigationBarHidden)
    #expect(column.controller.navigationItem.title == "Split title")

    let first = RNSScreenView(frame: .zero)
    stack.pushViewController(first.controller, animated: false)
    config.title = "First push"
    RNSScreenStackHeaderConfig.willShow(first.controller, animated: false, with: config)
    #expect(!stack.isNavigationBarHidden)
    #expect(columnNavigation.isNavigationBarHidden)
    #expect(first.controller.navigationItem.title == "First push")
    #expect(!first.controller.navigationItem.hidesBackButton)

    let second = RNSScreenView(frame: .zero)
    stack.pushViewController(second.controller, animated: false)
    config.title = "Second push"
    RNSScreenStackHeaderConfig.willShow(second.controller, animated: false, with: config)
    #expect(!stack.isNavigationBarHidden)
    #expect(columnNavigation.isNavigationBarHidden)
    #expect(second.controller.navigationItem.title == "Second push")
    #expect(column.controller.navigationItem.title == "Split title")

    stack.popToRootViewController(animated: false)
    RNSScreenStackHeaderConfig.willShow(root.controller, animated: false, with: config)
    #expect(stack.isNavigationBarHidden)
    #expect(!columnNavigation.isNavigationBarHidden)
  }

  @Test
  func `late header mounting and prop updates preserve stack ownership`() {
    let column = RNSSplitScreenComponentView(frame: .zero)
    let columnNavigation = UINavigationController(rootViewController: column.controller)
    let root = RNSScreenView(frame: .zero)
    let stack = RNSNavigationController(rootViewController: root.controller)
    column.controller.addChild(stack)
    column.addSubview(stack.view)
    stack.didMove(toParent: column.controller)
    let pushed = RNSScreenView(frame: .zero)
    stack.pushViewController(pushed.controller, animated: false)
    let config = RNSScreenStackHeaderConfig(frame: .zero)
    config.show = true
    config.title = "Pushed"
    RNSScreenStackHeaderConfig.willShow(pushed.controller, animated: false, with: config)

    let header = SplitViewHeaderView(appContext: nil)
    column.addSubview(header)
    header.configureNavigationItem(column.controller.navigationItem)
    header.headerTitle = "Updated split"
    header.apply()
    #expect(columnNavigation.isNavigationBarHidden)
    #expect(!stack.isNavigationBarHidden)
    #expect(pushed.controller.navigationItem.title == "Pushed")

    header.navigationBarHidden = true
    stack.popToRootViewController(animated: false)
    RNSScreenStackHeaderConfig.willShow(root.controller, animated: false, with: config)
    #expect(stack.isNavigationBarHidden)
    #expect(columnNavigation.isNavigationBarHidden)
    header.navigationBarHidden = false
    header.apply()
    #expect(!columnNavigation.isNavigationBarHidden)
    #expect(stack.isNavigationBarHidden)
  }

  @Test
  func `ordinary and deeper nested stacks keep their root headers`() {
    let column = RNSSplitScreenComponentView(frame: .zero)
    let columnNavigation = UINavigationController(rootViewController: column.controller)
    let root = RNSScreenView(frame: .zero)
    let stack = RNSNavigationController(rootViewController: root.controller)
    column.controller.addChild(stack)
    column.addSubview(stack.view)
    stack.didMove(toParent: column.controller)
    let header = SplitViewHeaderView(appContext: nil)
    column.addSubview(header)
    header.configureNavigationItem(column.controller.navigationItem)
    let config = RNSScreenStackHeaderConfig(frame: .zero)
    config.show = true
    RNSScreenStackHeaderConfig.willShow(root.controller, animated: false, with: config)

    let nestedRoot = RNSScreenView(frame: .zero)
    let nestedStack = RNSNavigationController(rootViewController: nestedRoot.controller)
    root.controller.addChild(nestedStack)
    root.addSubview(nestedStack.view)
    nestedStack.didMove(toParent: root.controller)
    RNSScreenStackHeaderConfig.willShow(nestedRoot.controller, animated: false, with: config)
    #expect(!nestedStack.isNavigationBarHidden)
    #expect(stack.isNavigationBarHidden)
    #expect(!columnNavigation.isNavigationBarHidden)

    let ordinaryRoot = RNSScreenView(frame: .zero)
    let ordinaryStack = RNSNavigationController(rootViewController: ordinaryRoot.controller)
    RNSScreenStackHeaderConfig.willShow(ordinaryRoot.controller, animated: false, with: config)
    #expect(!ordinaryStack.isNavigationBarHidden)
    #expect(stack.isNavigationBarHidden)
  }

  @Test
  func `header handoff surrounds completed and cancelled transitions`() async throws {
    let column = RNSSplitScreenComponentView(frame: .zero)
    let columnNavigation = UINavigationController(rootViewController: column.controller)
    let stackView = RNSScreenStackView(frame: CGRect(x: 0, y: 0, width: 393, height: 700))
    // Screens exposes its navigation controller through the React view-controller API.
    let stack = try #require(stackView.reactViewController() as? RNSNavigationController)
    let root = RNSScreenView(frame: stackView.bounds)
    root.activityState = 2
    let rootConfig = HeaderTestConfig(frame: .zero)
    rootConfig.show = true
    rootConfig.title = "Stack root"
    try mountHeaderTestChild(rootConfig, in: root, index: 0)
    try mountHeaderTestChild(root, in: stackView, index: 0)
    column.addSubview(stackView)
    let header = SplitViewHeaderView(appContext: nil)
    header.headerTitle = "Split root"
    column.addSubview(header)
    header.configureNavigationItem(column.controller.navigationItem)
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 393, height: 852))
    window.rootViewController = columnNavigation
    window.makeKeyAndVisible()
    defer { window.isHidden = true }
    columnNavigation.view.layoutIfNeeded()
    #expect(stack.isNavigationBarHidden)
    #expect(!columnNavigation.isNavigationBarHidden)

    // Screens declares its UIKit delegate conformance in the Objective-C implementation.
    let originalDelegate = try #require(stackView as? UINavigationControllerDelegate)
    let delegate = HeaderTransitionDelegate(forwarding: originalDelegate)
    stack.delegate = delegate
    let pushed = RNSScreenView(frame: stackView.bounds)
    pushed.activityState = 2
    let pushedConfig = HeaderTestConfig(frame: .zero)
    pushedConfig.show = true
    pushedConfig.title = "Pushed"
    try mountHeaderTestChild(pushedConfig, in: pushed, index: 0)
    try mountHeaderTestChild(pushed, in: stackView, index: 1)
    delegate.beforeWillShow = {
      #expect(!stack.isNavigationBarHidden)
      #expect(columnNavigation.isNavigationBarHidden)
      #expect(root.controller.navigationItem.title == "Stack root")
    }

    let selector = NSSelectorFromString("setPushViewControllers:")
    typealias UpdateStack = @convention(c) (RNSScreenStackView, Selector, NSArray) -> Void
    let update = unsafeBitCast(stackView.method(for: selector), to: UpdateStack.self)
    update(stackView, selector, [root.controller, pushed.controller] as NSArray)
    delegate.beforeWillShow = nil
    #expect(!stack.isNavigationBarHidden)
    #expect(columnNavigation.isNavigationBarHidden)
    try await finishHeaderTransition(stack)

    delegate.interaction = UIPercentDrivenInteractiveTransition()
    stack.popViewController(animated: true)
    delegate.interaction?.update(0.4)
    #expect(!stack.isNavigationBarHidden)
    #expect(columnNavigation.isNavigationBarHidden)
    delegate.interaction?.cancel()
    try await finishHeaderTransition(stack)
    delegate.interaction = nil
    #expect(stack.topViewController === pushed.controller)
    #expect(!stack.isNavigationBarHidden)
    #expect(columnNavigation.isNavigationBarHidden)

    stack.popViewController(animated: true)
    #expect(!stack.isNavigationBarHidden)
    #expect(columnNavigation.isNavigationBarHidden)
    try await finishHeaderTransition(stack)
    #expect(stack.topViewController === root.controller)
    #expect(stack.isNavigationBarHidden)
    #expect(!columnNavigation.isNavigationBarHidden)
    #expect(column.controller.navigationItem.title == "Split root")
  }

  @Test
  func `offscreen column props cannot change the shared bar but appearance can`() {
    let first = RNSSplitScreenComponentView(frame: .zero)
    let second = RNSSplitScreenComponentView(frame: .zero)
    let navigation = UINavigationController()
    navigation.viewControllers = [first.controller, second.controller]
    let firstHeader = SplitViewHeaderView(appContext: nil)
    first.addSubview(firstHeader)
    firstHeader.configureNavigationItem(first.controller.navigationItem)
    let secondHeader = SplitViewHeaderView(appContext: nil)
    second.addSubview(secondHeader)
    secondHeader.configureNavigationItem(second.controller.navigationItem)

    firstHeader.navigationBarHidden = true
    firstHeader.apply()
    #expect(!navigation.isNavigationBarHidden)

    // UIKit announces the incoming column before necessarily replacing the top controller.
    first.controller.beginAppearanceTransition(true, animated: false)
    first.controller.endAppearanceTransition()
    #expect(navigation.isNavigationBarHidden)
    second.controller.beginAppearanceTransition(true, animated: false)
    second.controller.endAppearanceTransition()
    #expect(!navigation.isNavigationBarHidden)
  }
}

@MainActor
private final class HeaderTestConfig: RNSScreenStackHeaderConfig {
  // This UIKit fixture has no Fabric shadow tree to receive layout updates.
  override func updateShadowState(with size: CGSize, edgeInsets: NSDirectionalEdgeInsets, frameOrigin: CGPoint) {}
}

@MainActor
private func mountHeaderTestChild(_ child: UIView, in parent: UIView, index: Int) throws {
  // Fabric's mounting method is implemented by Screens but omitted from its Swift-facing headers.
  let selector = NSSelectorFromString("mountChildComponentView:index:")
  try #require(parent.responds(to: selector))
  typealias Mount = @convention(c) (UIView, Selector, UIView, Int) -> Void
  let mount = unsafeBitCast(parent.method(for: selector), to: Mount.self)
  mount(parent, selector, child, index)
}

@MainActor
private final class HeaderTransitionDelegate: NSObject, UINavigationControllerDelegate, UIViewControllerAnimatedTransitioning {
  let forwarding: UINavigationControllerDelegate
  var beforeWillShow: (() -> Void)?
  var interaction: UIPercentDrivenInteractiveTransition?

  init(forwarding: UINavigationControllerDelegate) {
    self.forwarding = forwarding
  }

  func navigationController(_ navigationController: UINavigationController, willShow viewController: UIViewController, animated: Bool) {
    beforeWillShow?()
    forwarding.navigationController?(navigationController, willShow: viewController, animated: animated)
  }

  func navigationController(_ navigationController: UINavigationController, didShow viewController: UIViewController, animated: Bool) {
    forwarding.navigationController?(navigationController, didShow: viewController, animated: animated)
  }

  func navigationController(
    _ navigationController: UINavigationController,
    animationControllerFor operation: UINavigationController.Operation,
    from fromVC: UIViewController,
    to toVC: UIViewController
  ) -> UIViewControllerAnimatedTransitioning? {
    return self
  }

  func navigationController(
    _ navigationController: UINavigationController,
    interactionControllerFor animationController: UIViewControllerAnimatedTransitioning
  ) -> UIViewControllerInteractiveTransitioning? {
    return interaction
  }

  func transitionDuration(using transitionContext: UIViewControllerContextTransitioning?) -> TimeInterval {
    return 0.2
  }

  func animateTransition(using transitionContext: UIViewControllerContextTransitioning) {
    guard let destination = transitionContext.viewController(forKey: .to) else { return }
    transitionContext.containerView.addSubview(destination.view)
    destination.view.frame = transitionContext.finalFrame(for: destination)
    destination.view.alpha = 0
    UIView.animate(withDuration: 0.2) {
      destination.view.alpha = 1
    } completion: { _ in
      transitionContext.completeTransition(!transitionContext.transitionWasCancelled)
    }
  }
}

@MainActor
private func finishHeaderTransition(_ stack: UINavigationController) async throws {
  let coordinator = try #require(stack.transitionCoordinator)
  await withCheckedContinuation { continuation in
    coordinator.animate(alongsideTransition: nil) { _ in
      continuation.resume()
    }
  }
  // UIKit sends didShow after the coordinator's completion callbacks.
  await Task.yield()
}
