import ExpoModulesCore
import RNScreens
import UIKit

struct TabChangeCommand {
  weak var tabBarController: UITabBarController?
  let tabIndex: Int
}

internal class LinkPreviewNativeNavigation {
  private var preloadedScreenView: RNSScreenView?
  private var preloadedStackView: RNSScreenStackView?
  private var tabChangeCommands: [TabChangeCommand] = []
  private let logger: Logger?

  init(logger: Logger?) {
    self.logger = logger
  }

  func pushPreloadedView() {
    self.tabChangeCommands.forEach { command in
      command.tabBarController?.selectedIndex = command.tabIndex
    }
    guard let preloadedScreenView,
      let preloadedStackView
    else {
      if self.tabChangeCommands.isEmpty {
        logger?.warn(
          "expo-router: No preloaded screen view to push. You should only use Link.Preview when navigating inside a stack or native tabs navigator."
        )
      }
      return
    }

    // Instead of pushing the preloaded screen view, we set its activity state
    // React native screens will then handle the rest.
    preloadedScreenView.activityState = Int32(RNSActivityState.onTop.rawValue)
    preloadedStackView.markChildUpdated()

    // If the screen is modal with header then it will have exactly one child -
    // RNSNavigationController.
    // https://github.com/software-mansion/react-native-screens/blob/8b82e081e8fdfa6e0864821134bda9e87a745b00/src/components/ScreenStackItem.tsx#L146-L160
    if preloadedScreenView.isModal() && preloadedScreenView.controller.children.count == 1 {
      // The first child should be RNSNavigationController (<ScreenStack>).
      if let rnsNavController = preloadedScreenView.controller.children.first
        as? RNSNavigationController {
        // The delegate of RNSNavigationController is RNSScreenStackView.
        if let innerScreenStack = rnsNavController.delegate as? RNSScreenStackView {
          // The first and only child of the inner screen stack should be
          // RNSScreenView (<ScreenStackItem>).
          if let screenContentView = innerScreenStack.reactSubviews().first as? RNSScreenView {
            // Same as above, we let React Native Screens handle the transition.
            // We need to set the activity of inner screen as well, because its
            // react value is the same as the preloaded screen - 0.
            // https://github.com/software-mansion/react-native-screens/blob/8b82e081e8fdfa6e0864821134bda9e87a745b00/src/components/ScreenStackItem.tsx#L151
            screenContentView.activityState = Int32(RNSActivityState.onTop.rawValue)
            innerScreenStack.markChildUpdated()
          }
        }
      }
    }
  }

  func updatePreloadedView(screenId: String?, tabPath: TabPathPayload?, responder: UIView) {
    self.tabChangeCommands = []
    let oldTabKeys = tabPath?.path.map { $0.oldTabKey } ?? []
    if let stackOrTabView = findStackViewWithScreenIdOrTabBarController(
      screenId: screenId, tabKeys: oldTabKeys, responder: responder) {
      if let tabView = stackOrTabView as? RNSBottomTabsScreenComponentView {
        let newTabKeys = tabPath?.path.map { $0.newTabKey } ?? []
        // The order is important here. findStackViewWithScreenIdInSubViews must be called
        // even if screenId is nil to compute the tabChangeCommands.
        if let stackView = findStackViewWithScreenIdInSubViews(
          screenId: screenId, tabKeys: newTabKeys, rootView: tabView), let screenId {
          setPreloadedView(stackView: stackView, screenId: screenId)
        }
      } else if let stackView = stackOrTabView as? RNSScreenStackView, let screenId {
        setPreloadedView(stackView: stackView, screenId: screenId)
      }
    } else {
      logger?.warn(
        "expo-router: No view found for link preview navigation. You should only use Link.Preview when navigating inside a stack or native tabs navigator."
      )
    }
  }

  private func setPreloadedView(
    stackView: RNSScreenStackView, screenId: String
  ) {
    let screenViews = stackView.reactSubviews()
    if let screenView = screenViews?.first(where: {
      ($0 as? RNSScreenView)?.screenId == screenId
    }) as? RNSScreenView {
      preloadedScreenView = screenView
      preloadedStackView = stackView
    }
  }

  // Allowing for null screenId to support preloading tab navigators
  // Even if the desired screenId is not found, we still need to compute the tabChangeCommands
  private func findStackViewWithScreenIdInSubViews(
    screenId: String?, tabKeys: [String], rootView: UIView
  ) -> RNSScreenStackView? {
    if let rootView = rootView as? RNSScreenStackView,
      let screenId {
      if rootView.screenIds.contains(screenId) {
        return rootView
      }
    } else if let tabBarController =
      (rootView as? RNSBottomTabsScreenComponentView)?.reactViewController()?.tabBarController
      as? UITabBarController
      ?? (rootView as? RNSBottomTabsHostComponentView)?.controller as? UITabBarController {
      let views = tabBarController.viewControllers?.compactMap { $0.view } ?? []
      let enumeratedViews = views.enumerated()
      if let (tabIndex, tabView) =
        enumeratedViews
        .first(where: { _, view in
          guard let tabView = view as? RNSBottomTabsScreenComponentView, let tabKey = tabView.tabKey
          else {
            return false
          }
          return tabKeys.contains(tabKey)
        }) {
        self.tabChangeCommands.append(
          TabChangeCommand(tabBarController: tabBarController, tabIndex: tabIndex))
        for subview in tabView.subviews {
          if let result = findStackViewWithScreenIdInSubViews(
            screenId: screenId, tabKeys: tabKeys, rootView: subview) {
            return result
          }
        }
      }
    } else {
      for subview in rootView.subviews {
        let result = findStackViewWithScreenIdInSubViews(
          screenId: screenId, tabKeys: tabKeys, rootView: subview)
        if result != nil {
          return result
        }
      }
    }

    return nil
  }

  private func findStackViewWithScreenIdOrTabBarController(
    screenId: String?, tabKeys: [String], responder: UIView
  ) -> UIView? {
    var currentResponder: UIResponder? = responder

    while let nextResponder = currentResponder?.next {
      if let view = nextResponder as? RNSScreenStackView,
        let screenId {
        if view.screenIds.contains(screenId) {
          return view
        }
      } else if let tabView = nextResponder as? RNSBottomTabsScreenComponentView {
        if let tabKey = tabView.tabKey, tabKeys.contains(tabKey) {
          return tabView
        }
      }
      currentResponder = nextResponder
    }
    return nil
  }
}
