import SwiftUI
import ExpoModulesCore

@objc public class DevLauncherViewController: UIViewController {
  private var hostingController: UIHostingController<DevLauncherRootView>?
  var viewModel = DevLauncherViewModel()

  public override func viewDidLoad() {
    super.viewDidLoad()
    addHostingController()
  }

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
    if let hostingController {
      hostingController.willMove(toParent: nil)
      hostingController.view.removeFromSuperview()
      hostingController.removeFromParent()
    }
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
