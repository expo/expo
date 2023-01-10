// Copyright 2022-present 650 Industries. All rights reserved.

import UIKit
import SwiftUI

internal protocol AnySwiftUIHostingView {
  func setRawProps(_ props: [String: Any])
}

internal final class SwiftUIHostingView<ViewType: SwiftUI.View, PropsType: ViewProps>: UIView, AnySwiftUIHostingView {
  typealias RenderFunction = (_ props: PropsType) -> ViewType
  typealias RootView = SwiftUIRootView<ViewType, PropsType>

  let rootView: RootView
  let hostingController: UIHostingController<RootView>
  let viewProps = PropsType()

  init(_ render: @escaping RenderFunction) {
    rootView = RootView(props: viewProps, render: render)
    hostingController = UIHostingController(rootView: rootView)
    super.init(frame: .zero)

    // Hosting controller has white background by default,
    // but we always want it to be transparent.
    hostingController.view.backgroundColor = .clear
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  internal func setRawProps(_ props: [String: Any]) {
    try? viewProps.update(withDict: props)
    viewProps.rawValue = props
  }

  // MARK: - UIView lifecycle

  override func didMoveToWindow() {
    super.didMoveToWindow()

    if window != nil, let parentController = reactViewController() {
      parentController.addChild(hostingController)
      addSubview(hostingController.view)
      hostingController.didMove(toParent: parentController)
      setupHostingViewConstraints()
    } else {
      hostingController.removeFromParent()
    }
  }

  // MARK: - Privates

  private func setupHostingViewConstraints() {
    guard let view = hostingController.view else {
      return
    }
    view.translatesAutoresizingMaskIntoConstraints = false

    NSLayoutConstraint.activate([
      view.topAnchor.constraint(equalTo: topAnchor),
      view.bottomAnchor.constraint(equalTo: bottomAnchor),
      view.leftAnchor.constraint(equalTo: leftAnchor),
      view.rightAnchor.constraint(equalTo: rightAnchor)
    ])
  }
}
