import SwiftUI
import ExpoModulesCore

@objc public class DevLauncherViewController: UIViewController {
  private var hostingController: UIHostingController<DevLauncherRootView>?
  var viewModel = DevLauncherViewModel()

  public override func viewDidLoad() {
    super.viewDidLoad()
    addHostingController()
  }

#if !os(macOS)
  public override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    updateTopSafeAreaInset()
  }

  private func updateTopSafeAreaInset() {
    let hostingViewInset = hostingController?.view.safeAreaInsets.top ?? 0
    let windowInset = view.window?.safeAreaInsets.top ?? 0
    let newInset: CGFloat = hostingViewInset > 0 ? 0 : windowInset

    if newInset != viewModel.topSafeAreaInset {
      viewModel.topSafeAreaInset = newInset
    }
  }
#endif

  private func setupViewController() {
    view.backgroundColor = UIColor.white

    let rootView = DevLauncherRootView(viewModel: viewModel)
    hostingController = UIHostingController(rootView: rootView)
    hostingController?.view.backgroundColor = UIColor.clear
#if os(macOS)
    hostingController?.view.appearance = NSAppearance(named: .aqua)
#endif
  }

  @objc public func resetHostingController() {
#if !os(macOS)
    if let hostingController {
      hostingController.willMove(toParent: nil)
      hostingController.view.removeFromSuperview()
      hostingController.removeFromParent()
    }
#endif
    hostingController = nil
    if isViewLoaded {
      addHostingController()
    }
  }

  private func addHostingController() {
    if hostingController == nil {
      setupViewController()
    }

    guard let hostingController else {
      return
    }

    addChild(hostingController)
    hostingController.view.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(hostingController.view)

    NSLayoutConstraint.activate([
      hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
      hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
    ])

#if !os(macOS)
    navigationController?.setNavigationBarHidden(true, animated: false)
    hostingController.didMove(toParent: self)
#endif
  }
}
