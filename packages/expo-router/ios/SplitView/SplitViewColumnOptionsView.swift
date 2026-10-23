import ExpoModulesCore
import UIKit

// Applies header options to the split view column that contains this view.
// Uses only UIKit types: the column controller is the first view controller in the responder chain,
// and its `navigationController` is the column navigation controller.
class SplitViewColumnOptionsView: RouterViewWithLogger {
  var title: String?
  var headerLargeTitle: Bool?
  var headerShown: Bool?
  var showSecondaryToggleButton = false {
    didSet {
      // Screens toggles the secondary navigation bar after this prop changes, so apply again on the next turn.
      if oldValue != showSecondaryToggleButton && strategy != "viewNoAsync" {
        DispatchQueue.main.async { [weak self] in
          self?.apply(reason: "showSecondaryToggleButton async")
        }
      }
    }
  }
  var strategy = "view"

  private weak var columnController: UIViewController?
  private var appearanceController: SplitViewColumnOptionsViewController?

  // Values seen before the first write, so that removing an option restores them.
  private weak var originalsNavigationController: UINavigationController?
  private var originalTitle: String?
  private var originalPrefersLargeTitles = false
  private var originalLargeTitleDisplayMode = UINavigationItem.LargeTitleDisplayMode.automatic
  private var originalNavigationBarHidden = false
  private var didWriteTitle = false
  private var didWriteLargeTitle = false
  private var didWriteHeaderShown = false

  func propsDidUpdate() {
    apply(reason: "props")
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil {
      appearanceController?.willMove(toParent: nil)
      appearanceController?.view.removeFromSuperview()
      appearanceController?.removeFromParent()
      appearanceController = nil
      columnController = nil
      return
    }
    if strategy == "childViewController" {
      installAppearanceController()
      log(reason: "didMoveToWindow (child VC installed)")
    } else {
      apply(reason: "didMoveToWindow")
    }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    if strategy == "childViewController" {
      log(reason: "layoutSubviews (no write)")
    } else {
      apply(reason: "layoutSubviews")
    }
  }

  override func safeAreaInsetsDidChange() {
    super.safeAreaInsetsDidChange()
    if strategy != "childViewController" {
      apply(reason: "safeAreaInsetsDidChange")
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

  private func installAppearanceController() {
    guard appearanceController == nil, let column = findColumnController() else {
      return
    }
    let controller = SplitViewColumnOptionsViewController()
    controller.onWillAppear = { [weak self] in
      self?.apply(reason: "child viewWillAppear")
    }
    column.addChild(controller)
    controller.view.frame = .zero
    addSubview(controller.view)
    controller.didMove(toParent: column)
    appearanceController = controller
  }

  func apply(reason: String) {
    guard window != nil, let column = findColumnController() else {
      spikeLog("\(reason) title=\(title ?? "-") skipped: no window or column")
      return
    }

    let navigationController = column.navigationController
    if let navigationController {
      spikeLog("\(reason) before write: title=\(title ?? "-") hidden=\(navigationController.isNavigationBarHidden)")
    }
    if let navigationController, originalsNavigationController !== navigationController {
      originalsNavigationController = navigationController
      originalTitle = column.navigationItem.title
      originalPrefersLargeTitles = navigationController.navigationBar.prefersLargeTitles
      originalLargeTitleDisplayMode = column.navigationItem.largeTitleDisplayMode
      originalNavigationBarHidden = navigationController.isNavigationBarHidden
    }

    if let title {
      column.navigationItem.title = title
      didWriteTitle = true
    } else if didWriteTitle {
      column.navigationItem.title = originalTitle
      didWriteTitle = false
    }

    guard let navigationController else {
      log(reason: "\(reason) (no navigation controller)")
      return
    }

    if let headerLargeTitle {
      navigationController.navigationBar.prefersLargeTitles = headerLargeTitle
      column.navigationItem.largeTitleDisplayMode = headerLargeTitle ? .always : .never
      didWriteLargeTitle = true
    } else if didWriteLargeTitle {
      navigationController.navigationBar.prefersLargeTitles = originalPrefersLargeTitles
      column.navigationItem.largeTitleDisplayMode = originalLargeTitleDisplayMode
      didWriteLargeTitle = false
    }

    let hidden: Bool? =
      headerShown.map { !$0 } ?? (didWriteHeaderShown ? originalNavigationBarHidden : nil)
    didWriteHeaderShown = headerShown != nil
    if let hidden, navigationController.isNavigationBarHidden != hidden {
      navigationController.setNavigationBarHidden(hidden, animated: false)
    }

    log(reason: reason)
  }

  private func log(reason: String) {
    let navigationController = columnController?.navigationController
    let bar = navigationController?.navigationBar
    let nav = navigationController.map { "\(Unmanaged.passUnretained($0).toOpaque())" } ?? "nil"
    let hidden = navigationController.map { "\($0.isNavigationBarHidden)" } ?? "-"
    let large = bar.map { "\($0.prefersLargeTitles)" } ?? "-"
    let frame = bar.map { NSCoder.string(for: $0.frame) } ?? "-"
    spikeLog(
      "\(reason) title=\(title ?? "-") nav=\(nav) hidden=\(hidden) prefersLargeTitles=\(large) barFrame=\(frame)"
    )
  }

  // Spike only: mirrors native logs to Metro, because EAS simulator device logs are not reachable here.
  private func spikeLog(_ message: String) {
    let line = String(format: "[SplitHeaderSpike] t=%.4f %@", CACurrentMediaTime(), message)
    NSLog("%@", line)
    logger?.info(line)
  }
}

// Spike only: applies options in `viewWillAppear` of the column controller.
class SplitViewColumnOptionsViewController: UIViewController {
  var onWillAppear: (() -> Void)?

  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    onWillAppear?()
  }
}
