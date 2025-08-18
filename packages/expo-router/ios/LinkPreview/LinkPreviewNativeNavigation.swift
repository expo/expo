import UIKit

struct TabChangeCommand {
  weak var tabBarController: UITabBarController?
  let tabIndex: Int
}

internal class LinkPreviewNativeNavigation {
  private var preloadedView: UIView?
  private var preloadedStackView: UIView?
  private var tabChangeCommands: [TabChangeCommand] = []

  init() {}

  func pushPreloadedView() {
    self.tabChangeCommands.forEach { command in
      command.tabBarController?.selectedIndex = command.tabIndex
    }
    guard let preloadedView,
      let preloadedStackView
    else {
      return
    }
    LinkPreviewNativeNavigationObjC.pushPreloadedView(
      preloadedView, ontoStackView: preloadedStackView)
  }

  func updatePreloadedView(screenId: String?, tabPath: TabPathPayload?, responder: UIView) {
    self.tabChangeCommands = []
    let oldTabKeys = tabPath?.path.map { $0.oldTabKey } ?? []
    let stackOrTabView = findStackViewWithScreenIdOrTabBarController(
      screenId: screenId, tabKeys: oldTabKeys, responder: responder)
    if let stackOrTabView = stackOrTabView {
      if LinkPreviewNativeNavigationObjC.isRNSBottomTabsScreenComponentView(stackOrTabView) {
        let tabView = stackOrTabView
        let newTabKeys = tabPath?.path.map { $0.newTabKey } ?? []
        let stackView = findStackViewWithScreenIdInSubViews(
          screenId: screenId, tabKeys: newTabKeys, rootView: tabView)
        if let stackView = stackView {
          let screenViews = LinkPreviewNativeNavigationObjC.getScreenViews(stackView)
          if let screenView = screenViews.first(where: {
            LinkPreviewNativeNavigationObjC.getScreenId($0) == screenId
          }) {
            preloadedView = screenView
            preloadedStackView = stackView
            print("LinkPreviewNativeNavigation: Preloaded view for screenId \(screenId).")
          }
        }
      } else if LinkPreviewNativeNavigationObjC.isRNSScreenStackView(stackOrTabView) {
        let stackView = stackOrTabView
        let screenViews = LinkPreviewNativeNavigationObjC.getScreenViews(stackView)
        if let screenView = screenViews.first(where: {
          LinkPreviewNativeNavigationObjC.getScreenId($0) == screenId
        }) {
          preloadedView = screenView
          preloadedStackView = stackView
          print("LinkPreviewNativeNavigation: Preloaded view for screenId \(screenId).")
        }
      }
    } else {
      print("LinkPreviewNativeNavigation: No stack view found for screenId \(screenId).")
    }
  }

  private func findStackViewWithScreenIdInSubViews(
    screenId: String?, tabKeys: [String], rootView: UIView
  ) -> UIView? {
    if LinkPreviewNativeNavigationObjC.isRNSScreenStackView(rootView),
      let _screenId = screenId {
      let screenIds = LinkPreviewNativeNavigationObjC.getStackViewScreenIds(rootView)
      if screenIds.contains(_screenId) {
        return rootView
      }
    } else if LinkPreviewNativeNavigationObjC.isRNSBottomTabsScreenComponentView(rootView)
      || LinkPreviewNativeNavigationObjC.isRNSBottomTabsHostComponentView(rootView) {
      let tabBarController = LinkPreviewNativeNavigationObjC.getBottomTabController(from: rootView)
      if let tabBarController = tabBarController {
        let views = tabBarController.viewControllers?.compactMap { $0.view } ?? []
        let enumeratedViews = views.enumerated()
        if let (tabIndex, tabView) =
          enumeratedViews
          .first(where: { _, view in
            LinkPreviewNativeNavigationObjC.isRNSBottomTabsScreenComponentView(view)
              && tabKeys.contains(LinkPreviewNativeNavigationObjC.getTabKey(view))
          }) {
          self.tabChangeCommands.append(
            TabChangeCommand(tabBarController: tabBarController, tabIndex: tabIndex))
          let test = tabBarController.viewControllers

          for subview in tabView.subviews {
            let result = findStackViewWithScreenIdInSubViews(
              screenId: screenId, tabKeys: tabKeys, rootView: subview)
            if result != nil {
              return result
            }
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
      if let view = nextResponder as? UIView,
        LinkPreviewNativeNavigationObjC.isRNSScreenStackView(view),
        let _screenId = screenId {
        let screenIds = LinkPreviewNativeNavigationObjC.getStackViewScreenIds(view)
        if screenIds.contains(_screenId) {
          return view
        }
      } else if let tabView = nextResponder as? UIView,
        LinkPreviewNativeNavigationObjC.isRNSBottomTabsScreenComponentView(tabView) {
        let tabKey = LinkPreviewNativeNavigationObjC.getTabKey(tabView)
        if tabKeys.contains(tabKey) {
          return tabView
        }
      }
      currentResponder = nextResponder
    }
    return nil
  }
}
