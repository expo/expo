import ExpoModulesCore
import RNScreens
import UIKit

struct TabChangeCommand {
  weak var tabBarController: UITabBarController?
  let tabIndex: Int
}

internal class LinkPreviewNativeNavigation {
  private weak var preloadedScreenView: RNSScreenView?
  private weak var preloadedStackView: RNSScreenStackView?
  private var tabChangeCommands: [TabChangeCommand] = []
  private let logger: ExpoModulesCore.Logger?
  private let pathWalker = LinkPreviewPathWalker()

  init(logger: ExpoModulesCore.Logger?) {
    self.logger = logger
  }

  func pushPreloadedView() {
    self.performTabChanges()

    guard let preloadedScreenView,
      let preloadedStackView
    else {
      // Check if there were any tab change commands to perform
      // If there were, the preview transition could be to a different tab only
      if self.tabChangeCommands.isEmpty {
        logger?.warn(
          "[expo-router] No preloaded screen view to push. Link.Preview transition is only supported inside a native stack or native tabs navigators."
        )
      }
      return
    }

    // Instead of pushing the preloaded screen view, we set its activity state
    // React native screens will then handle the rest.
    preloadedScreenView.activityState = Int32(RNSActivityState.onTop.rawValue)
    preloadedStackView.markChildUpdated()
    self.pushModalInnerScreenIfNeeded(screenView: preloadedScreenView)
  }

  func updatePreloadedView(path: [PreviewActivationRoute], responder: UIView) {
    preloadedScreenView = nil
    preloadedStackView = nil

    let result = pathWalker.walk(path: path, responder: responder)
    tabChangeCommands = result.tabChangeCommands
    if let stackView = result.preloadedStackView as? RNSScreenStackView,
      let screenView = result.preloadedScreenView as? RNSScreenView
    {
      setPreloadedView(stackView: stackView, screenView: screenView)
    }
  }

  private func performTabChanges() {
    for command in self.tabChangeCommands {
      command.tabBarController?.selectedIndex = command.tabIndex
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
        screenContentView.activityState = Int32(RNSActivityState.onTop.rawValue)
        innerScreenStack.markChildUpdated()
      }
    }
  }

  private func setPreloadedView(
    stackView: RNSScreenStackView,
    screenView: RNSScreenView
  ) {
    guard screenView.activityState == 0 else {
      return
    }
    preloadedScreenView = screenView
    preloadedStackView = stackView
  }
}
