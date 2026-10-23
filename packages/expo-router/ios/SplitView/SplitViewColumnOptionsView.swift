import ExpoModulesCore
import UIKit

// Applies header options to the split view column that contains this view.
// The column controller is the first view controller in the responder chain.
// The split view can reset the navigation bar later, so the options are written again on layout changes.
class SplitViewColumnOptionsView: ExpoView {
  var title: String?
  var headerLargeTitle: Bool?
  var headerShown: Bool?
  var showSecondaryToggleButton = false {
    didSet {
      // Screens' `refreshSecondaryNavBar` hides and then shows the detail bar after this change,
      // which undoes `headerShown: false`. Write again on the next turn.
      if oldValue != showSecondaryToggleButton {
        DispatchQueue.main.async { [weak self] in
          self?.applyOptions()
        }
      }
    }
  }

  fileprivate private(set) weak var columnController: UIViewController?
  private weak var navigationController: UINavigationController?

  // Item values seen before the first write, so that removing an option restores them.
  private var originalTitle: String?
  private var originalLargeTitleDisplayMode = UINavigationItem.LargeTitleDisplayMode.automatic
  private var didWriteTitle = false
  private var didWriteLargeTitleDisplayMode = false

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      // A covered column leaves the window, so the column on top can own the bar again.
      if let navigationController {
        SplitViewNavigationBarState.of(navigationController).update(navigationController)
      }
    } else {
      applyOptions()
    }
  }

  override func didMoveToSuperview() {
    super.didMoveToSuperview()
    // The view is unmounted, so restore the item and the bar.
    if superview == nil, let column = columnController {
      writeTitle(nil, to: column.navigationItem)
      writeLargeTitleDisplayMode(nil, to: column.navigationItem)
      attach(to: nil)
      columnController = nil
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    applyOptions()
  }

  override func safeAreaInsetsDidChange() {
    super.safeAreaInsetsDidChange()
    applyOptions()
  }

  func applyOptions() {
    guard window != nil, let column = findColumnController() else {
      return
    }
    writeTitle(title, to: column.navigationItem)
    writeLargeTitleDisplayMode(headerLargeTitle, to: column.navigationItem)
    attach(to: column.navigationController)
  }

  // The column can move to another navigation controller when the split view collapses or expands.
  private func attach(to newNavigationController: UINavigationController?) {
    if let previous = navigationController, previous !== newNavigationController {
      let state = SplitViewNavigationBarState.of(previous)
      state.views.remove(self)
      state.update(previous)
    }
    navigationController = newNavigationController
    if let newNavigationController {
      let state = SplitViewNavigationBarState.of(newNavigationController)
      state.views.add(self)
      state.update(newNavigationController)
    }
  }

  private func findColumnController() -> UIViewController? {
    if let columnController {
      return columnController
    }
    var responder: UIResponder? = self
    while let current = responder {
      if let controller = current as? UIViewController {
        columnController = controller
        return controller
      }
      responder = current.next
    }
    return nil
  }

  private func writeTitle(_ title: String?, to item: UINavigationItem) {
    if let title {
      if !didWriteTitle {
        originalTitle = item.title
        didWriteTitle = true
      }
      if item.title != title {
        item.title = title
      }
    } else if didWriteTitle {
      item.title = originalTitle
      didWriteTitle = false
    }
  }

  private func writeLargeTitleDisplayMode(_ largeTitle: Bool?, to item: UINavigationItem) {
    if let largeTitle {
      if !didWriteLargeTitleDisplayMode {
        originalLargeTitleDisplayMode = item.largeTitleDisplayMode
        didWriteLargeTitleDisplayMode = true
      }
      let displayMode: UINavigationItem.LargeTitleDisplayMode = largeTitle ? .always : .never
      if item.largeTitleDisplayMode != displayMode {
        item.largeTitleDisplayMode = displayMode
      }
    } else if didWriteLargeTitleDisplayMode {
      item.largeTitleDisplayMode = originalLargeTitleDisplayMode
      didWriteLargeTitleDisplayMode = false
    }
  }
}

// Bar values belong to the navigation controller. In compact width, all columns share one navigation
// controller, so the bar follows the options of the column on top of its stack.
private final class SplitViewNavigationBarState {
  private static let states =
    NSMapTable<UINavigationController, SplitViewNavigationBarState>.weakToStrongObjects()

  static func of(_ navigationController: UINavigationController) -> SplitViewNavigationBarState {
    if let state = states.object(forKey: navigationController) {
      return state
    }
    let state = SplitViewNavigationBarState()
    states.setObject(state, forKey: navigationController)
    return state
  }

  let views = NSHashTable<SplitViewColumnOptionsView>.weakObjects()
  // Bar values seen before the first bar write by any column.
  private var originalPrefersLargeTitles = false
  private var originalNavigationBarHidden = false
  private var didWrite = false
  private var waitsForTransition = false

  func update(_ navigationController: UINavigationController) {
    let stack = navigationController.viewControllers
    let stackViews = views.allObjects.filter { view in
      view.columnController.map { stack.contains($0) } ?? false
    }
    let largeTitles = stackViews.compactMap(\.headerLargeTitle)
    let topView = stackViews.first { $0.columnController === navigationController.topViewController }
    let hidden = topView?.headerShown.map { !$0 }

    if !didWrite {
      if largeTitles.isEmpty && hidden == nil {
        return
      }
      originalPrefersLargeTitles = navigationController.navigationBar.prefersLargeTitles
      originalNavigationBarHidden = navigationController.isNavigationBarHidden
      didWrite = true
    }

    // Items of columns without a large title option keep their display mode, so they follow this value.
    let prefersLargeTitles = largeTitles.isEmpty ? originalPrefersLargeTitles : largeTitles.contains(true)
    if navigationController.navigationBar.prefersLargeTitles != prefersLargeTitles {
      navigationController.navigationBar.prefersLargeTitles = prefersLargeTitles
    }
    let navigationBarHidden = hidden ?? originalNavigationBarHidden
    if navigationController.isNavigationBarHidden != navigationBarHidden {
      // During a push or pop, an animated change runs alongside the transition instead of before it.
      navigationController.setNavigationBarHidden(
        navigationBarHidden,
        animated: navigationController.transitionCoordinator != nil
      )
    }

    // A cancelled interactive pop keeps the previous top column, so update again after the transition.
    if let coordinator = navigationController.transitionCoordinator, !waitsForTransition {
      waitsForTransition = true
      let willComplete = coordinator.animate(alongsideTransition: nil) {
        [weak self, weak navigationController] _ in
        self?.waitsForTransition = false
        if let navigationController {
          self?.update(navigationController)
        }
      }
      // The completion does not run when the coordinator cannot queue it.
      if !willComplete {
        waitsForTransition = false
      }
    }
  }
}
