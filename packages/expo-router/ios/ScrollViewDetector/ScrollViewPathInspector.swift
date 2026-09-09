import UIKit

/// The role a view plays in the navigation hierarchy, as far as the scroll view detector cares.
enum ScrollViewPathViewKind {
  case screen
  case navigatorHost
  case other
}

/// Where a screen's scrollable content sits relative to the first-child chain that
/// react-native-screens follows when it looks for the screen's content scroll view.
enum ScrollViewPathClassification: Equatable {
  /// The chain reaches a scroll view, so the native scroll integration works.
  case firstChild
  /// The chain reaches a nested navigator, which finds its own content scroll view.
  case nestedNavigator
  /// The screen has no vertical scroll view.
  case none
  /// Several screen-filling vertical scroll views, so there is no single obvious candidate.
  case ambiguous
  /// The only vertical scroll view is too short to be the screen's main scrollable area.
  case embedded
  /// One screen-filling vertical scroll view exists, but the chain misses it.
  case offPath(firstChildPath: [String], scrollViewPath: [String])
}

/// Classifies the subtree of a screen's content container the way react-native-screens sees it.
///
/// `RNSScrollViewFinder` finds a screen's content scroll view by repeatedly taking `subviews[0]`
/// from the screen view. Content such as `<View><Text/><FlatList/></View>` ends that walk at the
/// text, and every feature built on the content scroll view silently stops working. This inspector
/// reproduces the walk and reports why it failed so the developer can be warned.
enum ScrollViewPathInspector {
  /// A scroll view shorter than this fraction of the container counts as embedded content
  /// rather than the screen's main scrollable area.
  static let fillRatio: CGFloat = 0.7
  /// Bounds every traversal so a pathological hierarchy cannot stall the main thread.
  static let maxDepth = 32

  private static let screenClassNames: Set<String> = [
    "RNSScreenView",
    "RNSTabsScreenComponentView",
    "RNSStackScreenComponentView",
    "RNSSplitScreenComponentView"
  ]

  private static let navigatorHostClassNames: Set<String> = [
    "RNSScreenStackView",
    "RNSScreenContainerView",
    "RNSTabsHostComponentView",
    "RNSStackHostComponentView",
    "RNSSplitHostComponentView"
  ]

  /// Matches on class names instead of casting, so expo-router keeps building against any
  /// react-native-screens version that renames or drops these classes.
  static func kind(of view: UIView) -> ScrollViewPathViewKind {
    let name = className(of: view)
    if screenClassNames.contains(name) {
      return .screen
    }
    if navigatorHostClassNames.contains(name) {
      return .navigatorHost
    }
    return .other
  }

  /// Returns `nil` when the container is not worth reporting on: it is not laid out yet, or it is
  /// not itself on the first-child chain of a screen, in which case react-native-screens never
  /// reaches it and the developer has already opted out of the native scroll integration.
  static func classify(
    container: UIView,
    kindOf: (UIView) -> ScrollViewPathViewKind = ScrollViewPathInspector.kind(of:)
  ) -> ScrollViewPathClassification? {
    guard container.bounds.height > 0, isOnFirstChildChainOfScreen(container, kindOf: kindOf) else {
      return nil
    }

    let (chainResult, firstChildPath) = walkFirstChildChain(from: container, kindOf: kindOf)
    if let chainResult {
      return chainResult
    }

    let scrollViewPaths = verticalScrollViewPaths(in: container, kindOf: kindOf)
    guard let scrollViewPath = scrollViewPaths.first, scrollViewPaths.count == 1 else {
      return scrollViewPaths.isEmpty ? ScrollViewPathClassification.none : .ambiguous
    }
    guard let scrollView = scrollViewPath.last,
      scrollView.bounds.height >= fillRatio * container.bounds.height
    else {
      return .embedded
    }
    return .offPath(
      firstChildPath: firstChildPath,
      scrollViewPath: scrollViewPath.map(className(of:))
    )
  }

  private static func className(of view: UIView) -> String {
    return NSStringFromClass(type(of: view))
  }

  /// Every view between the container and its nearest screen ancestor must be its parent's first
  /// subview, otherwise the finder stops before it ever reaches the container.
  private static func isOnFirstChildChainOfScreen(
    _ container: UIView,
    kindOf: (UIView) -> ScrollViewPathViewKind
  ) -> Bool {
    var current = container
    for _ in 0..<maxDepth {
      if kindOf(current) == .screen {
        return true
      }
      guard let parent = current.superview, parent.subviews.first === current else {
        return false
      }
      current = parent
    }
    return false
  }

  /// Repeats the finder's walk from the container and reports the class names it visited.
  private static func walkFirstChildChain(
    from container: UIView,
    kindOf: (UIView) -> ScrollViewPathViewKind
  ) -> (ScrollViewPathClassification?, [String]) {
    var visited: [String] = []
    var current = container
    for _ in 0..<maxDepth {
      guard let child = current.subviews.first else {
        break
      }
      visited.append(className(of: child))
      if child is UIScrollView {
        return (.firstChild, visited)
      }
      if kindOf(child) == .navigatorHost {
        return (.nestedNavigator, visited)
      }
      current = child
    }
    return (nil, visited)
  }

  /// Breadth-first search for vertical scroll views, each returned as the chain of views leading
  /// from a direct child of the container down to the scroll view itself. A nested navigator owns
  /// whatever is below it, and a scroll view's own subtree only holds its content.
  private static func verticalScrollViewPaths(
    in container: UIView,
    kindOf: (UIView) -> ScrollViewPathViewKind
  ) -> [[UIView]] {
    var found: [[UIView]] = []
    var level: [[UIView]] = container.subviews.map { [$0] }
    for _ in 0..<maxDepth where !level.isEmpty {
      var nextLevel: [[UIView]] = []
      for path in level {
        guard let view = path.last, kindOf(view) != .navigatorHost else {
          continue
        }
        if let scrollView = view as? UIScrollView {
          if isVertical(scrollView) {
            found.append(path)
          }
          continue
        }
        nextLevel.append(contentsOf: view.subviews.map { path + [$0] })
      }
      level = nextLevel
    }
    return found
  }

  /// React Native mirrors the `horizontal` prop onto the bounce flags, which makes them a reliable
  /// signal even before the scroll view has any content.
  private static func isVertical(_ scrollView: UIScrollView) -> Bool {
    return scrollView.alwaysBounceVertical || scrollView.contentSize.height > scrollView.bounds.height
  }
}
