import UIKit
import SwiftUI

@objc public class DevLauncherViewController: UIViewController {
  private var hostingController: UIHostingController<DevLauncherRootView>?
  var viewModel = DevLauncherViewModel()

  public override var view: UIView! {
    didSet {
      if view is EXDevLauncherDeferredRCTRootView {
        addHostingController()
      }
    }
  }

  @objc public override init(nibName: String?, bundle: Bundle?) {
    super.init(nibName: nibName, bundle: bundle)
    setupViewController()
  }

  @objc public convenience init() {
    self.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setupViewController()
  }

  private func setupViewController() {
    view.backgroundColor = UIColor.white

    let rootView = DevLauncherRootView(viewModel: viewModel)
    hostingController = UIHostingController(rootView: rootView)
    hostingController?.view.backgroundColor = UIColor.clear
  }

  @objc public func resetHostingController() {
    hostingController = nil
    view = UIView()
    addHostingController()
  }

  private func addHostingController() {
    if hostingController == nil {
      setupViewController()
    }

    guard let hostingController else {
      return
    }

    addChild(hostingController)
    view.addSubview(hostingController.view)

    hostingController.view.frame = view.bounds
    hostingController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    hostingController.didMove(toParent: self)
    navigationController?.setNavigationBarHidden(true, animated: false)
  }

  public override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    hostingController?.view.frame = view.bounds
  }
}
