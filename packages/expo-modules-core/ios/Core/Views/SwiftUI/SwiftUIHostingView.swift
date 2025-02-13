// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

/**
 A type-erased protocol that hosting views must conform to.
 */
internal protocol AnyExpoSwiftUIHostingView {
  func updateProps(_ rawProps: [String: Any])
  func getContentView() -> any ExpoSwiftUI.View
}

extension ExpoSwiftUI {
  typealias AnyHostingView = AnyExpoSwiftUIHostingView

  /**
   A hosting view that renders a SwiftUI view inside the UIKit view hierarchy.
   */
  public final class HostingView<Props: ViewProps, ContentView: View<Props>>: ExpoView, AnyExpoSwiftUIHostingView {
    /**
     Props object that stores all the props for this particular view.
     It's an environment object that is observed by the content view.
     */
    private let props: Props
    private let contentView: any ExpoSwiftUI.View

    /**
     View controller that embeds the content view into the UIKit view hierarchy.
     */
    private let hostingController: UIViewController

    /**
     Initializes a SwiftUI hosting view with the given SwiftUI view type.
     */
    init(viewType: ContentView.Type, props: Props, appContext: AppContext) {
      self.contentView = ContentView()
      let rootView = AnyView(contentView.environmentObject(props))
      self.props = props
      self.hostingController = UIHostingController(rootView: rootView)

      super.init(appContext: appContext)

      #if os(iOS) || os(tvOS)
      // Hosting controller has white background by default,
      // but we always want it to be transparent.
      hostingController.view.backgroundColor = .clear
      #endif
    }

    @available(*, unavailable)
    required public init(appContext: AppContext? = nil) {
      fatalError("init(appContext:) has not been implemented")
    }

    // MARK: - ExpoFabricViewInterface

    /**
     Updates the environment object with props, based on the given dictionary with raw props.
     */
    public override func updateProps(_ rawProps: [String: Any]) {
      guard let appContext else {
        log.error("AppContext is not available, view props cannot be updated for \(ContentView.self)")
        return
      }
      do {
        try props.updateRawProps(rawProps, appContext: appContext)
      } catch let error {
        log.error("Updating props for \(ContentView.self) has failed: \(error.localizedDescription)")
      }
    }

    /**
     Returns inner SwiftUI view.
     */
    public func getContentView() -> any ExpoSwiftUI.View {
      return contentView
    }

    /**
     Returns a bool value whether the view supports prop with the given name.
     */
    public override func supportsProp(withName name: String) -> Bool {
      // It doesn't hurt much to just allow all prop names here, just for SwiftUI views.
      // Otherwise we would have to re-iterate over ViewProps fields which might be an expensive operation.
      // TODO: ViewProps should lazy load and cache an array of fields
      return true
    }

#if os(iOS) || os(tvOS)
#if RCT_NEW_ARCH_ENABLED
    /**
     Fabric calls this function when mounting (attaching) a child component view.
     */
    public override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
      var children = props.children ?? []
      let child = Child(view: childComponentView)

      children.insert(child, at: index)

      props.children = children
    }

    /**
     Fabric calls this function when unmounting (detaching) a child component view.
     */
    public override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
      // Make sure the view has no superview, React Native asserts against this.
      childComponentView.removeFromSuperview()

      if let children = props.children {
        props.children = children.filter({ $0.view != childComponentView })
      }
    }
#endif // RCT_NEW_ARCH_ENABLED

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
