// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class DevMenuViewController: UIViewController {
  private let manager: DevMenuManager
  private var hostingController: UIHostingController<DevMenuRootView>?

  init(manager: DevMenuManager) {
    self.manager = manager
    super.init(nibName: nil, bundle: nil)

#if !os(macOS)
    edgesForExtendedLayout = UIRectEdge.init(rawValue: 0)
    extendedLayoutIncludesOpaqueBars = true
#endif
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    setupSwiftUIView()
  }

  #if !os(tvOS) && !os(macOS)
  override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
    return UIInterfaceOrientationMask.all
  }
  #endif

#if !os(macOS)
  override var overrideUserInterfaceStyle: UIUserInterfaceStyle {
    get {
      return manager.userInterfaceStyle
    }
    set {}
  }
#endif

  private func setupSwiftUIView() {
    let rootView = DevMenuRootView()
    let hostingController = UIHostingController(rootView: rootView)

    #if os(tvOS)
    hostingController.view.backgroundColor =
      preferredUserInterfaceStyle == .dark ? UIColor.systemGray.withAlphaComponent(0.8) : UIColor.white.withAlphaComponent(0.8)
    #else
    hostingController.view.backgroundColor = UIColor.clear
    #endif

    addChild(hostingController)
    view.addSubview(hostingController.view)
#if !os(macOS)
    hostingController.didMove(toParent: self)
#endif

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
