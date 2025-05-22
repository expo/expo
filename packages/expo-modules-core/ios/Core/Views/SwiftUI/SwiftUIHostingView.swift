// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

/**
 A type-erased protocol that hosting views must conform to.
 */
internal protocol AnyExpoSwiftUIHostingView {
  func updateProps(_ rawProps: [String: Any])
  func getContentView() -> any ExpoSwiftUI.View
  func getProps() -> ExpoSwiftUI.ViewProps
}

extension ExpoSwiftUI {
  /**
   Checks if the child view is wrapped by a `UIViewHost` and matches the specified SwiftUI view type.
   */
  public static func isHostingView(_ view: any AnyChild) -> Bool {
    return view is UIViewHost
  }

  /**
   Checks if the child view is wrapped by a `UIViewHost` and matches the specified SwiftUI view type.
   */
  public static func isHostingViewOfType<Props: ViewProps, ViewType: View<Props>>(view: any AnyChild, viewType: ViewType.Type) -> Bool {
    if let host = view as? UIViewHost {
      return host.view is HostingView<Props, ViewType>
    }
    return false
  }
}

extension ExpoSwiftUI {
  internal typealias AnyHostingView = AnyExpoSwiftUIHostingView

  /**
   For a SwiftUI view to self-contain a HostingView, it can conform to the WithHostingView protocol.
   */
  public protocol WithHostingView {
  }

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
     Additional utilities for controlling shadow node behavior.
     */
    private let shadowNodeProxy: ShadowNodeProxy = ShadowNodeProxy()

    /**
     View controller that embeds the content view into the UIKit view hierarchy.
     */
    private let hostingController: UIViewController

    /**
     Initializes a SwiftUI hosting view with the given SwiftUI view type.
     */
    init(viewType: ContentView.Type, props: Props, appContext: AppContext) {
      self.contentView = ContentView(props: props)
      let rootView = AnyView(contentView.environmentObject(shadowNodeProxy))
      self.props = props
      let controller = UIHostingController(rootView: rootView)

      if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
        controller.sizingOptions = [.intrinsicContentSize]
      }
      self.hostingController = controller

      super.init(appContext: appContext)

      shadowNodeProxy.setViewSize = { size in
        #if RCT_NEW_ARCH_ENABLED
        self.setViewSize(size)
        #endif
      }
      shadowNodeProxy.objectWillChange.send()

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
     Returns the view's props
     */
    public func getProps() -> ExpoSwiftUI.ViewProps {
      return props
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

#if RCT_NEW_ARCH_ENABLED
    /**
     Fabric calls this function when mounting (attaching) a child component view.
     */
    public override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
      var children = props.children ?? []
      let child: any AnyChild
      if let view = childComponentView as AnyObject as? (any ExpoSwiftUI.View) {
        child = view
      } else {
        child = UIViewHost(view: childComponentView)
      }

      children.insert(child, at: index)

      props.children = children
      props.objectWillChange.send()
    }

    /**
     Fabric calls this function when unmounting (detaching) a child component view.
     */
    public override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
      // Make sure the view has no superview, React Native asserts against this.
      childComponentView.removeFromSuperview()

      let childViewId: ObjectIdentifier
      if let child = childComponentView as AnyObject as? (any AnyChild) {
        childViewId = child.id
      } else {
        childViewId = ObjectIdentifier(childComponentView)
      }

      if let children = props.children {
        props.children = children.filter({ $0.id != childViewId })
        #if DEBUG
        assert(props.children?.count == children.count - 1, "Failed to remove child view")
        #endif
        props.objectWillChange.send()
      }
    }
#endif // RCT_NEW_ARCH_ENABLED

    /**
     Setups layout constraints of the hosting controller view to match the layout set by React.
     */
    private func setupHostingViewConstraints() {
      // NSView is not optional in NSViewController in macOS
      guard let view = hostingController.view as UIView? else {
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
        #if !os(macOS)
        if parentController as? UINavigationController == nil {
          // Swift automatically adds the hostingController in the correct place when the parentController
          // is UINavigationController, since it's children are supposed to be only screens
          parentController.addChild(hostingController)
        }
        #else
        parentController.addChild(hostingController)
        #endif
        addSubview(hostingController.view)
        #if os(iOS) || os(tvOS)
        hostingController.didMove(toParent: parentController)
        #endif
        setupHostingViewConstraints()
      } else {
        hostingController.view.removeFromSuperview()
        hostingController.removeFromParent()
      }
    }

#if os(macOS)
    public override func reactViewController() -> NSViewController? {
      var currentView: NSView? = self
      while let view = currentView {
        if let viewController = view.nextResponder as? NSViewController {
          return viewController
        }
        currentView = view.superview
      }
      return self.window?.contentViewController
    }
#endif
  }
}
