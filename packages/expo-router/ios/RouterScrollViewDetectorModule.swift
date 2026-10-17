import ExpoModulesCore
import UIKit

public final class RouterScrollViewDetectorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoRouterScrollViewDetector")

    View(RouterScrollViewDetectorView.self) {
      Prop("containerType") { (view: RouterScrollViewDetectorView, containerType: String) in
        view.containerType = containerType
      }
    }
  }
}

final class RouterScrollViewDetectorView: RouterViewWithLogger {
  var containerType: String? {
    didSet {
      scheduleCheck()
    }
  }

  private var hasWarned = false
  private var isCheckScheduled = false
  private var remainingChecks = 6

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil {
      remainingChecks = 6
    }
    scheduleCheck()
  }

  private func scheduleCheck() {
    guard window != nil, !hasWarned, !isCheckScheduled, remainingChecks > 0 else {
      return
    }

    isCheckScheduled = true
    DispatchQueue.main.async { [weak self] in
      self?.runScheduledCheck()
    }
  }

  private func runScheduledCheck() {
    guard window != nil, !hasWarned, remainingChecks > 0 else {
      isCheckScheduled = false
      return
    }

    remainingChecks -= 1
    checkHierarchy()

    if !hasWarned && remainingChecks > 0 {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
        self?.runScheduledCheck()
      }
    } else {
      isCheckScheduled = false
    }
  }

  private func checkHierarchy() {
    guard
      let containerType,
      let screenView = findScreenAncestor(containerType: containerType),
      Self.hasScrollViewOutsideFirstSubviewChain(in: screenView)
    else {
      return
    }

    hasWarned = true
    logger?.warn(Self.warning(for: containerType))
  }

  private func findScreenAncestor(containerType: String) -> UIView? {
    let expectedClassNames: Set<String>
    switch containerType {
    case "nativeTabs":
      expectedClassNames = ["RNSTabsScreenComponentView"]
    case "stack":
      expectedClassNames = ["RNSScreenView", "RNSStackScreenComponentView"]
    default:
      return nil
    }

    var currentView = superview
    while let view = currentView {
      let className = NSStringFromClass(type(of: view)).split(separator: ".").last.map(String.init)
      if let className, expectedClassNames.contains(className) {
        return view
      }
      currentView = view.superview
    }
    return nil
  }

  static func hasScrollViewOutsideFirstSubviewChain(in rootView: UIView) -> Bool {
    if findContentScrollViewInFirstSubviewChain(from: rootView) != nil {
      return false
    }

    var views = rootView.subviews
    var visitedViewCount = 0
    while let view = views.popLast(), visitedViewCount < 2_000 {
      visitedViewCount += 1
      if view.isHidden || view.alpha == 0 {
        continue
      }
      if view is UIScrollView {
        return true
      }
      views.append(contentsOf: view.subviews)
    }
    return false
  }

  private static func findContentScrollViewInFirstSubviewChain(from rootView: UIView) -> UIScrollView? {
    let providerSelector = NSSelectorFromString("findContentScrollView")
    var currentView: UIView? = rootView

    while let view = currentView {
      if let scrollView = view as? UIScrollView {
        return scrollView
      }
      if let scrollView = contentScrollView(from: view, providerSelector: providerSelector) ??
        contentScrollView(from: view.next, providerSelector: providerSelector) {
        return scrollView
      }
      currentView = view.subviews.first
    }
    return nil
  }

  private static func contentScrollView(
    from responder: UIResponder?,
    providerSelector: Selector
  ) -> UIScrollView? {
    guard responder?.responds(to: providerSelector) == true else {
      return nil
    }
    return responder?.perform(providerSelector)?.takeUnretainedValue() as? UIScrollView
  }

  private static func warning(for containerType: String) -> String {
    if containerType == "nativeTabs" {
      return "[expo-router] A scroll view is not on the first-child path of a NativeTabs screen. Native tab bar behavior and automatic content insets may not work. Make the scroll view the first child of each wrapping view."
    }
    return "[expo-router] A scroll view is not on the first-child path of a Stack screen with a native header. Header behavior and automatic content insets may not work. Make the scroll view the first child of each wrapping view."
  }
}
