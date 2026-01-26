import SwiftUI
import ExpoModulesCore

@objc public class DevLauncherViewController: UIViewController {
  var viewModel = DevLauncherViewModel()

  private lazy var hostingController: UIHostingController<DevLauncherRootView> = {
    let rootView = DevLauncherRootView(viewModel: viewModel)
    let controller = UIHostingController(rootView: rootView)
    controller.view.backgroundColor = UIColor.clear
#if os(macOS)
    controller.view.appearance = NSAppearance(named: .aqua)
#endif
    return controller
  }()

  public override func viewDidLoad() {
    super.viewDidLoad()
    ensureHostingControllerInHierarchy()
  }

#if !os(macOS)
  public override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    addToViewControllerHierarchyIfNeeded()
  }

  private func addToViewControllerHierarchyIfNeeded() {
    guard let window = view.window,
          let rootViewController = window.rootViewController else {
      return
    }

    let isSwiftUIController = NSStringFromClass(type(of: rootViewController)).contains("UIHostingController")
    let isBrownfield = NSStringFromClass(type(of: rootViewController)).contains("UINavigationController")

    if !isSwiftUIController && !isBrownfield && parent != rootViewController {
      rootViewController.addChild(self)
      didMove(toParent: rootViewController)
      view.setNeedsLayout()
      view.layoutIfNeeded()
    }
  }

  public override func viewWillDisappear(_ animated: Bool) {
    super.viewWillDisappear(animated)
    // Only remove if actually being dismissed
    if (isBeingDismissed || isMovingFromParent) && parent != nil {
      willMove(toParent: nil)
      removeFromParent()
    }
  }
#endif

  // Restores the hosting controller's view to the hierarchy after it was orphaned
  // by the React root view replacing DevLauncherViewController.view.
  @objc public func restoreHostingControllerView() {
    ensureHostingControllerInHierarchy()
  }

  private func ensureHostingControllerInHierarchy() {
    // Add as child VC if not already
    if hostingController.parent == nil {
      addChild(hostingController)
#if !os(macOS)
      hostingController.didMove(toParent: self)
#endif
    }

    // Add view if not already in hierarchy (ExpoDevLauncherReactDelegateHandler.devLauncherController(_:didStartWithSuccess:) replaces DevLauncherViewController.view with the React root view)
    if hostingController.view.superview == nil {
      hostingController.view.translatesAutoresizingMaskIntoConstraints = false
      view.addSubview(hostingController.view)
      NSLayoutConstraint.activate([
        hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
        hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
        hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
      ])
    }

#if !os(macOS)
    navigationController?.setNavigationBarHidden(true, animated: false)
#endif
  }
}
