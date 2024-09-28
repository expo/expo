// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

/**
 A type-erased protocol that hosting views must conform to.
 */
internal protocol AnyExpoSwiftUIHostingView {
  func updateRawProps(_ rawProps: [String: Any], appContext: AppContext)
}

extension ExpoSwiftUI {
  typealias AnyHostingView = AnyExpoSwiftUIHostingView

  /**
   A hosting view that renders a SwiftUI view inside the UIKit view hierarchy.
   */
  public final class HostingView<Props: ViewProps, ContentView: View<Props>>: UIView, AnyExpoSwiftUIHostingView {
    /**
     Props object that stores all the props for this particular view.
     It's an environment object that is observed by the content view.
     */
    private let props: Props

    /**
     View controller that embeds the content view into the UIKit view hierarchy.
     */
    private let hostingController: UIViewController

    /**
     Initializes a SwiftUI hosting view with the given SwiftUI view type.
     */
    init(viewType: ContentView.Type, props: Props) {
      let rootView = ContentView().environmentObject(props)

      self.props = props
      self.hostingController = UIHostingController(rootView: rootView)

      super.init(frame: .zero)

      #if os(iOS) || os(tvOS)
      // Hosting controller has white background by default,
      // but we always want it to be transparent.
      hostingController.view.backgroundColor = .clear
      #endif
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

#if os(iOS) || os(tvOS)
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
#endif
  }
}
