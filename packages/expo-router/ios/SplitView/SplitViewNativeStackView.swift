import ExpoModulesCore
import UIKit

// Opt-in spike: a persistent Stack must fill the secondary column. UIKit recognizes a column's
// first child navigation controller; Screens normally hides it behind a second navigation controller.
enum SplitViewNativeStackIntegration {
  static let columns = NSMapTable<UISplitViewController, UIViewController>.weakToWeakObjects()
  static let probes = NSHashTable<SplitViewNativeStackView>.weakObjects()

  @discardableResult
  static func adopt(column: UIViewController, in split: UISplitViewController) -> Bool {
    guard column.children.count == 1, column.children.first is UINavigationController,
      let wrapper = split.viewController(for: .secondary) as? UINavigationController,
      wrapper.viewControllers == [column], column.parent === wrapper,
      split.transitionCoordinator == nil, wrapper.presentedViewController == nil
    else { return false }

    // Register before reparenting: UIKit can synchronously call Screens' display-mode delegate.
    columns.setObject(column, forKey: split)
    wrapper.setViewControllers([], animated: false)
    split.setViewController(column, for: .secondary)
    return true
  }

  static func scheduleReconcile() {
    for probe in probes.allObjects { probe.scheduleReconcile() }
  }

  static let installHooks: Bool = {
    let attachSelector = NSSelectorFromString("reactAddControllerToClosestParent:")
    let columnsSelector = NSSelectorFromString("splitScreenControllers")
    let refreshSelector = NSSelectorFromString("refreshSecondaryNavBar")
    guard let stackClass = NSClassFromString("RNSScreenStackView"),
      let hostClass = NSClassFromString("RNSSplitHostController"),
      let attach = class_getInstanceMethod(stackClass, attachSelector),
      let visible = class_getInstanceMethod(hostClass, columnsSelector),
      let refresh = class_getInstanceMethod(hostClass, refreshSelector),
      class_getInstanceVariable(hostClass, "_visibleColumns") != nil
    else { return false }

    typealias Attach = @convention(c) (UIView, Selector, UIViewController) -> Void
    let originalAttach = unsafeBitCast(method_getImplementation(attach), to: Attach.self)
    let attachBlock: @convention(block) (UIView, UIViewController) -> Void = { view, controller in
      originalAttach(view, attachSelector, controller)
      scheduleReconcile()
    }
    replace(stackClass, selector: attachSelector, method: attach, block: attachBlock)

    typealias Columns = @convention(c) (UISplitViewController, Selector) -> NSArray
    let originalColumns = unsafeBitCast(method_getImplementation(visible), to: Columns.self)
    let columnsBlock: @convention(block) (UISplitViewController) -> NSArray = { split in
      guard columns.object(forKey: split) != nil else { return originalColumns(split, columnsSelector) }
      // Keep Screens' visibility filter: querying a hidden column's top controller is unsafe on collapse.
      let visibleColumns = split.value(forKey: "visibleColumns") as? Set<NSNumber> ?? []
      return visibleColumns.compactMap { number -> UIViewController? in
        guard let position = UISplitViewController.Column(rawValue: number.intValue),
          let controller = split.viewController(for: position)
        else { return nil }
        let column = (controller as? UINavigationController)?.topViewController ?? controller
        guard NSStringFromClass(type(of: column)) == "RNSSplitScreenController" else { return nil }
        return column
      } as NSArray
    }
    replace(hostClass, selector: columnsSelector, method: visible, block: columnsBlock)

    typealias Refresh = @convention(c) (UISplitViewController, Selector) -> Void
    let originalRefresh = unsafeBitCast(method_getImplementation(refresh), to: Refresh.self)
    let refreshBlock: @convention(block) (UISplitViewController) -> Void = { split in
      guard let column = columns.object(forKey: split),
        split.viewController(for: .secondary) === column,
        let navigation = column.children.first as? UINavigationController
      else {
        originalRefresh(split, refreshSelector)
        return
      }
      // Screens refreshes the sidebar toggle by hiding/showing the column's bar.
      let hidden = navigation.isNavigationBarHidden
      navigation.setNavigationBarHidden(true, animated: false)
      navigation.setNavigationBarHidden(hidden, animated: false)
    }
    replace(hostClass, selector: refreshSelector, method: refresh, block: refreshBlock)
    return true
  }()

  private static func replace(_ cls: AnyClass, selector: Selector, method: Method, block: Any) {
    let implementation = imp_implementationWithBlock(block)
    if !class_addMethod(cls, selector, implementation, method_getTypeEncoding(method)) {
      method_setImplementation(method, implementation)
    }
  }
}

final class SplitViewNativeStackView: ExpoView {
  let onOwnershipChange = EventDispatcher()
  private var scheduled = false
  private var lastReport: NSDictionary?

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    if superview != nil {
      _ = SplitViewNativeStackIntegration.installHooks
      SplitViewNativeStackIntegration.probes.add(self)
      scheduleReconcile()
    } else {
      SplitViewNativeStackIntegration.probes.remove(self)
    }
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    scheduleReconcile()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    scheduleReconcile()
  }

  func scheduleReconcile() {
    guard !scheduled else { return }
    scheduled = true
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      self.scheduled = false
      self.reconcile()
    }
  }

  private func reconcile() {
    guard window != nil else { return }
    var responder: UIResponder? = superview
    while let current = responder, NSStringFromClass(type(of: current)) != "RNSSplitScreenController" {
      responder = current.next
    }
    guard let column = responder as? UIViewController, let split = column.splitViewController else { return }
    let hooksInstalled = SplitViewNativeStackIntegration.installHooks
    if hooksInstalled, SplitViewNativeStackIntegration.columns.object(forKey: split) == nil {
      SplitViewNativeStackIntegration.adopt(column: column, in: split)
    }
    let navigation = column.children.first as? UINavigationController
    let integrated = split.viewController(for: .secondary) === column && navigation != nil
    let report: [String: Any] = [
      "hooksInstalled": hooksInstalled,
      "integrated": integrated,
      "collapsed": split.isCollapsed,
      "columnClass": NSStringFromClass(type(of: column)),
      "columnChildren": column.children.map { NSStringFromClass(type(of: $0)) },
      "secondaryClass": split.viewController(for: .secondary).map { NSStringFromClass(type(of: $0)) } ?? "nil",
      "stackDepth": navigation?.viewControllers.count ?? 0,
      "topItemIsScreenItem": navigation.map { $0.navigationBar.topItem === $0.topViewController?.navigationItem }
        ?? false,
      "navigationBarHidden": navigation?.isNavigationBarHidden ?? true,
      "barHeight": navigation?.navigationBar.frame.height ?? 0,
      "columnSafeAreaTop": column.view.safeAreaInsets.top,
      "stackSafeAreaTop": navigation?.view.safeAreaInsets.top ?? 0,
      "hasPresentedController": navigation?.presentedViewController != nil,
    ]
    if lastReport?.isEqual(to: report) != true {
      lastReport = report as NSDictionary
      onOwnershipChange(report)
    }
  }
}
