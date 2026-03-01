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

  func updatePreloadedView(screenId: String?, tabPath: TabPathPayload?, responder: UIView) {
    self.tabChangeCommands = []
    let oldTabKeys = tabPath?.path.map { $0.oldTabKey } ?? []
    let stackOrTabView = findStackViewWithScreenIdOrTabBarController(
      screenId: screenId, tabKeys: oldTabKeys, responder: responder)
    guard let stackOrTabView else {
      return
    }
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
  }

  private func performTabChanges() {
    self.tabChangeCommands.forEach { command in
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
        let screenContentView = innerScreenStack.reactSubviews().first as? RNSScreenView {
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
    } else if let tabBarController = getTabBarControllerFromTabView(view: rootView) {
      if let (tabIndex, tabView) = getIndexAndViewOfFirstTabWithKey(
        tabBarController: tabBarController, tabKeys: tabKeys) {
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

  private func getIndexAndViewOfFirstTabWithKey(
    tabBarController: UITabBarController, tabKeys: [String]
  ) -> (tabIndex: Int, tabView: UIView)? {
    let views = tabBarController.viewControllers?.compactMap { $0.view } ?? []
    let enumeratedViews = views.enumerated()
    if let result =
      enumeratedViews
      .first(where: { _, view in
        guard let tabView = view as? RNSBottomTabsScreenComponentView, let tabKey = tabView.tabKey
        else {
          return false
        }
        return tabKeys.contains(tabKey)
      }) {
      return (result.offset, result.element)
    }
    return nil
  }

  private func getTabBarControllerFromTabView(view: UIView) -> UITabBarController? {
    if let tabScreenView = view as? RNSBottomTabsScreenComponentView {
      return tabScreenView.reactViewController()?.tabBarController as? UITabBarController
    }
    if let tabHostView = view as? RNSBottomTabsHostComponentView {
      return tabHostView.controller as? UITabBarController
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
