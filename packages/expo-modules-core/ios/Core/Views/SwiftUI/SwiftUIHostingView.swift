// Copyright 2022-present 650 Industries. All rights reserved.

import UIKit
import SwiftUI

internal protocol AnySwiftUIHostingView {
  func updateRawProps(_ rawProps: [String: Any], appContext: AppContext)
}

/**
 
 */
public final class SwiftUIHostingView<Props: ViewProps, ContentView: ExpoSwiftUIView<Props>>: UIView, AnySwiftUIHostingView {
  /**
   Root view for the hosting controller that provides props as the environment object.
   */
  struct RootView: SwiftUI.View {
    let contentView = ContentView()
    let props: Props

    var body: some View {
      return contentView.environmentObject(props)
    }
  }

  /**
   Props object that stores all the props for this particular view.
   It's an environment object that is observed by the content view.
   */
  private let props = Props()

  /**
   Controller that allows embedding the content view into the UIKit view hierarchy.
   */
  private let hostingController: UIHostingController<RootView>

  /**
   Initializes a SwiftUI hosting view with the given SwiftUI view type.
   */
  init(viewType: ContentView.Type) {
    let rootView = RootView(props: self.props)
    self.hostingController = UIHostingController(rootView: rootView)

    super.init(frame: .zero)

    // Hosting controller has white background by default,
    // but we always want it to be transparent.
    hostingController.view.backgroundColor = .clear
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  /**
   Updates the environment object with props, based on the given dictionary with raw props.
   */
  internal func updateRawProps(_ rawProps: [String: Any], appContext: AppContext) {
    try? props.updateRawProps(rawProps, appContext: appContext)
  }

  /**
   Setups layout constraints of the hosting controller view to match the layout set by React.
   */
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

  // MARK: - UIView lifecycle

  public override func didMoveToWindow() {
    super.didMoveToWindow()

    if window != nil, let parentController = reactViewController() {
      parentController.addChild(hostingController)
      addSubview(hostingController.view)
      hostingController.didMove(toParent: parentController)
      setupHostingViewConstraints()
    } else {
      hostingController.view.removeFromSuperview()
      hostingController.removeFromParent()
    }
  }
}
