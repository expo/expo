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

  // Some hosts (e.g. SwiftUI or brownfield apps) do not pass the window's safe area down to the launcher.
  private func updateTopSafeAreaInset() {
    guard let hostingController else {
      return
    }
    let additionalInset = hostingController.additionalSafeAreaInsets.top
    let inheritedInset = hostingController.view.safeAreaInsets.top - additionalInset
    let windowInset = view.window?.safeAreaInsets.top ?? 0
    let newInset: CGFloat = inheritedInset > 0 ? 0 : windowInset

    if newInset != additionalInset {
      hostingController.additionalSafeAreaInsets.top = newInset
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
      hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
    ])

#if !os(macOS)
    navigationController?.setNavigationBarHidden(true, animated: false)
    hostingController.didMove(toParent: self)
#endif
  }
}
