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
      return LinkPreviewPathWalkResult(
        preloadedScreenView: nil,
        preloadedStackView: nil,
        tabChangeCommands: []
      )
    }

    var commands: [TabChangeCommand] = []
    let match = descend(view: stackView, cursor: cursor, path: path, commands: &commands)
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

    return bestMatch
  }

  private func descend(
    view: UIView,
    cursor: Int,
    path: [PreviewActivationRoute],
    commands: inout [TabChangeCommand]
  ) -> (screenView: UIView?, stackView: UIView?)? {
    if let screenIds = screenIds(from: view), !screenIds.isEmpty {
      guard let routeIndex = path.indices.dropFirst(cursor).first(where: {
        screenIds.contains(path[$0].key)
      }), let screenView = children(of: view).first(where: {
        screenId(from: $0) == path[routeIndex].key
      }) else {
        return nil
      }

      if routeIndex == path.index(before: path.endIndex) {
        guard activityState(from: screenView) == 0 else {
          return (nil, nil)
        }
        return (screenView, view)
      }

      return descendChildren(
        of: screenView,
        cursor: path.index(after: routeIndex),
        path: path,
        commands: &commands
      )
    }

    if let tabBarController = tabBarController(from: view) {
      let tabViews = tabBarController.viewControllers?.compactMap { $0.view } ?? []
      for routeIndex in path.indices.dropFirst(cursor) {
        guard let tabIndex = tabViews.firstIndex(where: {
          RNScreensTabCompat.screenKey(from: $0) == path[routeIndex].name
        }) else {
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
    return (view.value(forKey: Self.activityStateName) as? NSNumber)?.intValue
  }

  private func children(of view: UIView) -> [UIView] {
    guard view.responds(to: Self.reactSubviewsSelector) else {
      return view.subviews
    }
    return view.value(forKey: Self.reactSubviewsName) as? [UIView] ?? view.subviews
  }
}
