import ExpoModulesCore
import RNScreens
import UIKit

struct TabChangeCommand {
  weak var tabBarController: UITabBarController?
  let tabIndex: Int
  private weak var target: UIViewController?

  init(tabBarController: UITabBarController?, tabIndex: Int) {
    self.tabBarController = tabBarController
    self.tabIndex = tabIndex
    self.target = tabBarController?.viewControllers?.indices.contains(tabIndex) == true
      ? tabBarController?.viewControllers?[tabIndex] : nil
  }

  func perform() {
    guard let tabBarController, let target,
      tabBarController.viewControllers?.indices.contains(tabIndex) == true,
      tabBarController.viewControllers?[tabIndex] === target
    else { return }
    tabBarController.selectedIndex = tabIndex
  }
}

// One UIKit commit owns one immutable selection. Weak references do not pin dismissed routes.
internal final class LinkPreviewActivation {
  private weak var screen: RNSScreenView?
  private weak var stack: RNSScreenStackView?
  let screenId: String?
  private let tabChangeCommands: [TabChangeCommand]
  private var consumed = false

  init(screen: RNSScreenView?, stack: RNSScreenStackView?, tabChangeCommands: [TabChangeCommand]) {
    self.screen = screen
    self.stack = stack
    self.screenId = screen?.screenId
    self.tabChangeCommands = tabChangeCommands
  }

  func cancel() { consumed = true }

  func commit() {
    guard !consumed else { return }
    consumed = true
    if let screenId {
      guard let screen, let stack,
        screen.screenId == screenId,
        stack.reactSubviews().contains(where: { $0 === screen }),
        screen.activityState == 0
      else { return }
      for command in tabChangeCommands { command.perform() }
      screen.activityState = Int32(RNSActivityState.onTop.rawValue)
      stack.markChildUpdated()
      pushModalInnerScreenIfNeeded(screenView: screen)
    } else {
      for command in tabChangeCommands { command.perform() }
    }
  }

  // If screen is a modal with header, it will have an inner stack screen
  // https://github.com/software-mansion/react-native-screens/blob/8b82e081e8fdfa6e0864821134bda9e87a745b00/src/components/ScreenStackItem.tsx#L146-L160
  // In this case we need to set the activity state of the inner screen as well.
  private func pushModalInnerScreenIfNeeded(screenView: RNSScreenView) {
    // If the screen is modal with header then it will have exactly one child - RNSNavigationController.
    if screenView.isModal() && screenView.controller.children.count == 1 {
      // To get the inner screen stack we need to go through RNSNavigationController.
      // The structure is as follows:
      // RNSScreenView (preloadedScreenView)
      //  └── RNSNavigationController (outer stack)
      //       └── RNSScreenStackView (innerScreenStack)
      if let rnsNavController = screenView.controller.children.first
        as? RNSNavigationController,
        // The delegate of RNSNavigationController is RNSScreenStackView.
        let innerScreenStack = rnsNavController.delegate as? RNSScreenStackView,
        // The first and only child of the inner screen stack should be
        // RNSScreenView (<ScreenStackItem>).
        let screenContentView = innerScreenStack.reactSubviews().first as? RNSScreenView
      {
        // Same as above, we let React Native Screens handle the transition.
        // We need to set the activity of inner screen as well, because its
        // react value is the same as the preloaded screen - 0.
        // https://github.com/software-mansion/react-native-screens/blob/8b82e081e8fdfa6e0864821134bda9e87a745b00/src/components/ScreenStackItem.tsx#L151
        guard screenContentView.activityState == 0 else { return }
        screenContentView.activityState = Int32(RNSActivityState.onTop.rawValue)
        innerScreenStack.markChildUpdated()
      }
    }
  }
}

internal class LinkPreviewNativeNavigation {
  private var selection: LinkPreviewActivation?
  private weak var committedActivation: LinkPreviewActivation?
  private let pathWalker = LinkPreviewPathWalker()

  init(logger: ExpoModulesCore.Logger?) {}

  func beginInteraction() {
    committedActivation?.cancel()
    clearPreloadedView()
  }

  func clearPreloadedView() { selection = nil }

  func captureActivation() -> LinkPreviewActivation? {
    let activation = selection
    committedActivation = activation
    selection = nil
    return activation
  }

  func updatePreloadedView(path: [PreviewActivationRoute], responder: UIView) {
    let result = pathWalker.walk(path: path, responder: responder)
    selection = LinkPreviewActivation(
      screen: result.preloadedScreenView as? RNSScreenView,
      stack: result.preloadedStackView as? RNSScreenStackView,
      tabChangeCommands: result.tabChangeCommands
    )
  }
}
