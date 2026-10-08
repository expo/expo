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
  public final class HostingView<Props: ViewProps, ContentView: View<Props>>: ExpoView, @MainActor AnyExpoSwiftUIHostingView {
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
    private let hostingController: UIHostingController<AnyView>

    #if os(iOS) || os(tvOS)
    /**
     The hosted scroll view registered as the parent view controller's content scroll view, and that controller.
     */
    private weak var registeredContentScrollView: UIScrollView?
    private weak var contentScrollViewController: UIViewController?
    #endif

    /**
     Initializes a SwiftUI hosting view with the given SwiftUI view type.
     */
    init(viewType: ContentView.Type, props: Props, appContext: AppContext) {
      self.contentView = ContentView(props: props)
      let rootView = AnyView(contentView)
      self.props = props
      let controller = UIHostingController(rootView: rootView)

      if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
        controller.sizingOptions = [.intrinsicContentSize]
      }
      self.hostingController = controller

      super.init(appContext: appContext)

      shadowNodeProxy.setViewSize = { [weak self] size in
        self?.setViewSize(size)
      }

      shadowNodeProxy.setStyleSize = { [weak self] width, height in
        self?.setStyleSize(width, height: height)
      }

      props.shadowNodeProxy = shadowNodeProxy
      (props as? HostingViewAware)?.hostingView = self

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

      if let safeAreaProps = props as? SafeAreaControllable {
        hostingController.setSafeAreaRegions(ignoring: safeAreaProps.ignoreSafeArea)
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

    public override func layoutSubviews() {
      super.layoutSubviews()
      // TODO: Use updateLayoutMetrics from RN. Add support in ExpoFabricView.
      setupHostingViewConstraints()
      #if os(iOS) || os(tvOS)
      // SwiftUI creates the platform views of its content while the hosting controller lays out, which can be after
      // this pass, so look for the scroll view once that has happened.
      DispatchQueue.main.async { [weak self] in
        self?.updateContentScrollView()
      }
      #endif
    }

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

    /**
     Setups layout constraints of the hosting controller view to match the layout set by React.
     */
    private func setupHostingViewConstraints() {
      // NSView is not optional in NSViewController in macOS
      guard let view = hostingController.view as UIView? else {
        return
      }
      let frame = self.bounds
      view.frame = frame
        #if os(iOS) || os(tvOS)
        view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        #elseif os(macOS)
        view.autoresizingMask = [.width, .height]
        #endif
    }

    // MARK: - UIView lifecycle

    public override func didMoveToWindow() {
      super.didMoveToWindow()

      #if os(iOS)
      if let window {
        // SwiftUI content can open a menu, and UIKit passes the tap that closes it through to
        // React Native underneath. The gate stops that tap from reaching the view below.
        SystemMenuTouchGate.install(in: window)
      }
      #endif

      guard window != nil else {
        #if os(iOS) || os(tvOS)
        unregisterContentScrollView()
        #endif
        hostingController.view.removeFromSuperview()
        hostingController.removeFromParent()
        return
      }

      let parentController = reactViewController()
      #if os(macOS)
      // An `NSHostingController` view renders without a parent controller, and a React root view used
      // directly as `NSWindow.contentView` has none in its responder chain, so don't require one.
      parentController?.addChild(hostingController)
      #else
      guard let parentController else {
        hostingController.view.removeFromSuperview()
        hostingController.removeFromParent()
        return
      }
      if parentController as? UINavigationController == nil && parentController as? UITabBarController == nil {
        // Swift automatically adds the hostingController in the correct place when the parentController
        // is UINavigationController, since its children are supposed to be only screens.
        // Similarly, for UITabBarController we expect its children to be only tabs.
        parentController.addChild(hostingController)
      }
      #endif
      addSubview(hostingController.view)
      #if os(iOS) || os(tvOS)
      hostingController.didMove(toParent: parentController)
      #endif
      setupHostingViewConstraints()
    }

#if os(iOS) || os(tvOS)
    // MARK: - Content scroll view

    /**
     Registers the hosted scroll view as the parent view controller's content scroll view, for both the top and bottom
     edges. UIKit looks for it to drive the navigation bar (large title collapse, scroll edge vs standard appearance,
     scroll edge effects) and the toolbar. Without this it only finds scroll views along the first-subview chain of the
     controller's view, which never reaches into the hosting controller.

     It only registers a scroll view that fills this view, and never replaces a content scroll view registered by
     something else, so a `Host` that isn't the screen's main scrolling content (a carousel, a matchContents `Host`
     inside a React Native `ScrollView`) changes nothing.
     */
    private func updateContentScrollView() {
      guard #available(iOS 15.0, tvOS 15.0, *) else {
        return
      }
      guard
        window != nil,
        (props as? ContentScrollViewProviding)?.providesContentScrollView == true,
        let controller = hostingController.parent,
        let scrollView = findFillingScrollView(in: hostingController.view)
      else {
        return
      }
      let current = controller.contentScrollView(for: .top)
      if current === scrollView {
        return
      }
      if current != nil && current !== registeredContentScrollView {
        return
      }
      controller.setContentScrollView(scrollView, for: [.top, .bottom])
      registeredContentScrollView = scrollView
      contentScrollViewController = controller
    }

    private func unregisterContentScrollView() {
      guard #available(iOS 15.0, tvOS 15.0, *) else {
        return
      }
      if let controller = contentScrollViewController,
        let scrollView = registeredContentScrollView,
        controller.contentScrollView(for: .top) === scrollView {
        controller.setContentScrollView(nil, for: [.top, .bottom])
      }
      registeredContentScrollView = nil
      contentScrollViewController = nil
    }

    /**
     Finds the first scrollable scroll view in the hosted view hierarchy whose frame matches this view's bounds.
     */
    private func findFillingScrollView(in view: UIView) -> UIScrollView? {
      if let scrollView = view as? UIScrollView,
        scrollView.isScrollEnabled,
        scrollView.convert(scrollView.bounds, to: self).insetBy(dx: -1, dy: -1).contains(bounds),
        bounds.insetBy(dx: -1, dy: -1).contains(scrollView.convert(scrollView.bounds, to: self)) {
        return scrollView
      }
      for subview in view.subviews {
        if let scrollView = findFillingScrollView(in: subview) {
          return scrollView
        }
      }
      return nil
    }
#endif

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

extension UIHostingController {
  /// Applies the `ignoreSafeArea` mode reactively, restoring the default safe area when `nil` so
  /// clearing the prop re-enables the safe area without an app reload.
  func setSafeAreaRegions(ignoring mode: ExpoSwiftUI.IgnoreSafeArea?) {
    // `safeAreaRegions` needs iOS 16.4+; the precompiled xcframework targets 16.0, so no-op below it.
    guard #available(iOS 16.4, tvOS 16.4, macOS 13.3, *) else {
      return
    }
    var regions: SafeAreaRegions = .all
    if let mode {
      switch mode {
      case .all:
        regions = []
      case .container:
        regions.remove(.container)
      case .keyboard:
        regions.remove(.keyboard)
      }
    }
    if safeAreaRegions != regions {
      safeAreaRegions = regions
    }
  }
}
