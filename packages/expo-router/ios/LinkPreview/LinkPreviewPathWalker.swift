import UIKit

struct PreviewActivationRoute {
  let key: String
  let name: String
}

struct LinkPreviewPathWalkResult {
  let preloadedScreenView: UIView?
  let preloadedStackView: UIView?
  let tabChangeCommands: [TabChangeCommand]
}

final class LinkPreviewPathWalker {
  private static let screenIdName = "screenId"
  private static let screenIdsName = "screenIds"
  private static let activityStateName = "activityState"
  private static let reactSubviewsName = "reactSubviews"

  private static let screenIdSelector = NSSelectorFromString(screenIdName)
  private static let screenIdsSelector = NSSelectorFromString(screenIdsName)
  private static let activityStateSelector = NSSelectorFromString(activityStateName)
  private static let reactSubviewsSelector = NSSelectorFromString(reactSubviewsName)

  func walk(path: [PreviewActivationRoute], responder: UIView) -> LinkPreviewPathWalkResult {
    guard !path.isEmpty, let (stackView, cursor) = findAnchor(path: path, responder: responder) else {
      // The path cannot be resolved without a route shared by the responder hierarchy.
      return LinkPreviewPathWalkResult(
        preloadedScreenView: nil,
        preloadedStackView: nil,
        tabChangeCommands: []
      )
    }

    var commands: [TabChangeCommand] = []
    let match = descend(view: stackView, cursor: cursor, path: path, commands: &commands)
    // A match contains the screen to activate and any tab changes needed to reach it.
    return LinkPreviewPathWalkResult(
      preloadedScreenView: match?.screenView,
      preloadedStackView: match?.stackView,
      tabChangeCommands: match == nil ? [] : commands
    )
  }

  private func findAnchor(
    path: [PreviewActivationRoute],
    responder: UIView
  ) -> (view: UIView, cursor: Int)? {
    var currentResponder: UIResponder? = responder
    var bestMatch: (view: UIView, cursor: Int)?

    while let nextResponder = currentResponder?.next {
      if let view = nextResponder as? UIView, let screenIds = screenIds(from: view) {
        for (index, route) in path.enumerated() where screenIds.contains(route.key) {
          if bestMatch.map({ index < $0.cursor }) ?? true {
            bestMatch = (view, index)
          }
          break
        }
      }
      currentResponder = nextResponder
    }

    // The earliest path match is the highest usable anchor in the responder hierarchy.
    return bestMatch
  }

  private func descend(
    view: UIView,
    cursor: Int,
    path: [PreviewActivationRoute],
    commands: inout [TabChangeCommand]
  ) -> (screenView: UIView?, stackView: UIView?)? {
    if let screenIds = screenIds(from: view), !screenIds.isEmpty {
      guard
        let routeIndex = path.indices.dropFirst(cursor).first(where: {
          screenIds.contains(path[$0].key)
        }),
        let screenView = children(of: view).first(where: {
          screenId(from: $0) == path[routeIndex].key
        })
      else {
        // This stack does not contain the next route in the activation path.
        return nil
      }

      if routeIndex == path.index(before: path.endIndex) {
        guard activityState(from: screenView) == 0 else {
          // The path matched, but its terminal screen is already active.
          return (nil, nil)
        }
        // The terminal route is a preloaded screen in this stack.
        return (screenView, view)
      }

      if let match = descendChildren(
        of: screenView,
        cursor: path.index(after: routeIndex),
        path: path,
        commands: &commands
      ) {
        if match.screenView == nil,
          match.stackView == nil,
          activityState(from: screenView) == 0
        {
          // A deeper active route matched, so activate its nearest preloaded ancestor instead.
          return (screenView, view)
        }
        // A descendant found the screen to activate or completed a tab-only path.
        return match
      }

      // No descendant of the matched screen contains the remaining path.
      return nil
    }

    if let tabBarController = tabBarController(from: view) {
      let tabViews = tabBarController.viewControllers?.compactMap { $0.view } ?? []
      for routeIndex in path.indices.dropFirst(cursor) {
        guard
          let tabIndex = tabViews.firstIndex(where: {
            RNScreensTabCompat.screenKey(from: $0) == path[routeIndex].name
          })
        else {
          continue
        }

        if tabBarController.selectedIndex != tabIndex {
          commands.append(TabChangeCommand(tabBarController: tabBarController, tabIndex: tabIndex))
        }
        if routeIndex == path.index(before: path.endIndex) {
          // The path ends at a tab, so applying the collected tab changes completes activation.
          return (nil, nil)
        }
        // Continue inside the matched tab to resolve the rest of the path.
        return descendChildren(
          of: tabViews[tabIndex],
          cursor: path.index(after: routeIndex),
          path: path,
          commands: &commands
        )
      }
      // This tab controller does not contain any remaining route in the path.
      return nil
    }

    // This view is not a stack or tab host, so search through its children.
    return descendChildren(of: view, cursor: cursor, path: path, commands: &commands)
  }

  private func descendChildren(
    of view: UIView,
    cursor: Int,
    path: [PreviewActivationRoute],
    commands: inout [TabChangeCommand]
  ) -> (screenView: UIView?, stackView: UIView?)? {
    for child in children(of: view) {
      var branchCommands = commands
      if let match = descend(view: child, cursor: cursor, path: path, commands: &branchCommands) {
        commands = branchCommands
        // Keep only the tab changes collected along the successful child branch.
        return match
      }
    }
    // None of this view's child branches can resolve the remaining path.
    return nil
  }

  private func tabBarController(from view: UIView) -> UITabBarController? {
    RNScreensTabCompat.tabBarController(fromTabScreen: view)
      ?? RNScreensTabCompat.tabBarController(fromTabHost: view)
  }

  private func screenId(from view: UIView) -> String? {
    guard view.responds(to: Self.screenIdSelector) else {
      // Views without `screenId` cannot represent a stack screen.
      return nil
    }
    // The screen ID maps a native screen back to its keyed navigation route.
    return view.value(forKey: Self.screenIdName) as? String
  }

  private func screenIds(from view: UIView) -> [String]? {
    guard view.responds(to: Self.screenIdsSelector) else {
      // Views without `screenIds` cannot represent a screen stack.
      return nil
    }
    // The IDs identify every route currently rendered by this screen stack.
    return view.value(forKey: Self.screenIdsName) as? [String]
  }

  private func activityState(from view: UIView) -> Int? {
    guard view.responds(to: Self.activityStateSelector) else {
      // A missing activity state means the view cannot be classified as active or preloaded.
      return nil
    }
    // React Native Screens uses `0` for a preloaded screen that can be activated.
    return (view.value(forKey: Self.activityStateName) as? NSNumber)?.intValue
  }

  private func children(of view: UIView) -> [UIView] {
    guard view.responds(to: Self.reactSubviewsSelector) else {
      // Plain UIKit views expose their traversable children through `subviews`.
      return view.subviews
    }
    // Prefer React-managed children while falling back to UIKit's hierarchy.
    return view.value(forKey: Self.reactSubviewsName) as? [UIView] ?? view.subviews
  }
}
