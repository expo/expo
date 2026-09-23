import UIKit

struct PreviewActivationRoute {
  let key: String
}

struct LinkPreviewPathWalkResult {
  let preloadedScreenView: UIView?
  let preloadedStackView: UIView?
  let tabChangeCommands: [TabChangeCommand]
  let resolved: Bool
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
    guard !path.isEmpty, let (anchorView, cursor) = findAnchor(path: path, responder: responder) else {
      // The path cannot be resolved without a route shared by the responder hierarchy.
      return LinkPreviewPathWalkResult(
        preloadedScreenView: nil,
        preloadedStackView: nil,
        tabChangeCommands: [],
        resolved: false
      )
    }

    var commands: [TabChangeCommand] = []
    let match = descend(view: anchorView, cursor: cursor, path: path, commands: &commands)
    return LinkPreviewPathWalkResult(
      preloadedScreenView: match?.screenView,
      preloadedStackView: match?.stackView,
      tabChangeCommands: match == nil ? [] : commands,
      resolved: match != nil
    )
  }

  private func findAnchor(
    path: [PreviewActivationRoute],
    responder: UIView
  ) -> (view: UIView, cursor: Int)? {
    var currentResponder: UIResponder? = responder
    var bestMatch: (view: UIView, cursor: Int)?

    while let nextResponder = currentResponder?.next {
      if let view = nextResponder as? UIView,
        let cursor = anchorCursor(for: view, path: path),
        bestMatch.map({ cursor < $0.cursor }) ?? true
      {
        bestMatch = (view, cursor)
      }
      currentResponder = nextResponder
    }

    // The earliest path match is the highest usable anchor in the responder hierarchy.
    return bestMatch
  }

  private func anchorCursor(for view: UIView, path: [PreviewActivationRoute]) -> Int? {
    var cursor: Int?
    if let screenIds = screenIds(from: view) {
      cursor = path.firstIndex(where: { screenIds.contains($0.key) })
    }

    if let tabBarController = tabBarController(from: view) {
      let tabViews = tabBarController.viewControllers?.compactMap(\.view) ?? []
      if let tabCursor = path.firstIndex(where: { route in
        tabViews.contains(where: { RNScreensTabCompat.routeKey(from: $0) == route.key })
      }) {
        if cursor.map({ tabCursor < $0 }) ?? true {
          cursor = tabCursor
        }
      }
    }
    return cursor
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
        return nil
      }

      if routeIndex == path.index(before: path.endIndex) {
        guard activityState(from: screenView) == 0 else {
          // The path matched, but its terminal screen is already active.
          return (nil, nil)
        }
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
        return match
      }

      return nil
    }

    if let tabBarController = tabBarController(from: view) {
      let tabViews = tabBarController.viewControllers?.compactMap { $0.view } ?? []
      for routeIndex in path.indices.dropFirst(cursor) {
        guard
          let tabIndex = tabViews.firstIndex(where: {
            RNScreensTabCompat.routeKey(from: $0) == path[routeIndex].key
          })
        else {
          continue
        }

        if tabBarController.selectedIndex != tabIndex {
          commands.append(TabChangeCommand(tabBarController: tabBarController, tabIndex: tabIndex))
        }
        if routeIndex == path.index(before: path.endIndex) {
          return (nil, nil)
        }
        return descendChildren(
          of: tabViews[tabIndex],
          cursor: path.index(after: routeIndex),
          path: path,
          commands: &commands
        )
      }
      return nil
    }

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
        return match
      }
    }
    return nil
  }

  private func tabBarController(from view: UIView) -> UITabBarController? {
    RNScreensTabCompat.tabBarController(fromTabScreen: view)
      ?? RNScreensTabCompat.tabBarController(fromTabHost: view)
  }

  private func screenId(from view: UIView) -> String? {
    guard view.responds(to: Self.screenIdSelector) else {
      return nil
    }
    return view.value(forKey: Self.screenIdName) as? String
  }

  private func screenIds(from view: UIView) -> [String]? {
    guard view.responds(to: Self.screenIdsSelector) else {
      return nil
    }
    return view.value(forKey: Self.screenIdsName) as? [String]
  }

  private func activityState(from view: UIView) -> Int? {
    guard view.responds(to: Self.activityStateSelector) else {
      return nil
    }
    // React Native Screens uses `0` for a preloaded screen that can be activated.
    return (view.value(forKey: Self.activityStateName) as? NSNumber)?.intValue
  }

  private func children(of view: UIView) -> [UIView] {
    guard view.responds(to: Self.reactSubviewsSelector) else {
      return view.subviews
    }
    // Prefer React-managed children while falling back to UIKit's hierarchy.
    return view.value(forKey: Self.reactSubviewsName) as? [UIView] ?? view.subviews
  }
}
