// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

@MainActor
class DevMenuViewController: UIViewController {
  private let manager: DevMenuManager
  private var hostingController: UIHostingController<DevMenuRootView>?

  init(manager: DevMenuManager) {
    self.manager = manager
    super.init(nibName: nil, bundle: nil)

    edgesForExtendedLayout = UIRectEdge.init(rawValue: 0)
    extendedLayoutIncludesOpaqueBars = true
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    setupSwiftUIView()
  }

  override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
    return .all
  }

  override var overrideUserInterfaceStyle: UIUserInterfaceStyle {
    get {
      return .unspecified
    }
    set {}
  }

  private func setupSwiftUIView() {
    let rootView = DevMenuRootView()
    let hostingController = UIHostingController(rootView: rootView)

    hostingController.view.backgroundColor = .clear

    addChild(hostingController)
    view.addSubview(hostingController.view)
    hostingController.didMove(toParent: self)

    hostingController.view.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
      hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
    ])

    self.hostingController = hostingController
  }
}
