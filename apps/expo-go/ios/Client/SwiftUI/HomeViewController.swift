// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit
import SwiftUI

@objc public class HomeViewController: UIViewController {
  private var hostingController: UIHostingController<HomeRootView>?
  var viewModel = HomeViewModel()

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
    view.backgroundColor = UIColor.systemBackground

    let rootView = HomeRootView(viewModel: viewModel)
    hostingController = UIHostingController(rootView: rootView)
    hostingController?.view.backgroundColor = UIColor.clear
  }

  public override func viewDidLoad() {
    super.viewDidLoad()

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
  }

  public override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    hostingController?.view.frame = view.bounds
  }

  public override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
    viewModel.onViewWillAppear()
  }

  public override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    viewModel.onViewDidDisappear()
  }
}
