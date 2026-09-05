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
  /**
   A weak handle to the UIKit view that hosts a SwiftUI tree. Exposed through the environment so RNHostView
   can convert its geometry into the coordinate space of the view Yoga laid out.
   */
  public final class HostingViewReference: @unchecked Sendable {
    public internal(set) weak var view: UIView?
  }

  internal struct HostingViewEnvironmentKey: EnvironmentKey {
    static let defaultValue: HostingViewReference? = nil
  }
}

extension EnvironmentValues {
  public var expoHostingView: ExpoSwiftUI.HostingViewReference? {
    get { self[ExpoSwiftUI.HostingViewEnvironmentKey.self] }
    set { self[ExpoSwiftUI.HostingViewEnvironmentKey.self] = newValue }
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

    /**
     The last size a content-sized axis asked for, before the safe-area insets are added.
     */
    private var requestedStyleSize: (width: NSNumber?, height: NSNumber?)?

    /**
     Handed to the SwiftUI root through the environment, so RNHostView content can convert its geometry
     into this view's coordinate space.
     */
    private let hostingViewReference = HostingViewReference()

    /**
     Initializes a SwiftUI hosting view with the given SwiftUI view type.
     */
    init(viewType: ContentView.Type, props: Props, appContext: AppContext) {
      let content = ContentView(props: props)
      self.contentView = content
      let rootView = AnyView(content.environment(\.expoHostingView, hostingViewReference))
      self.props = props
      let controller = UIHostingController(rootView: rootView)

      if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
        controller.sizingOptions = [.intrinsicContentSize]
      }
      self.hostingController = controller

      super.init(appContext: appContext)

      hostingViewReference.view = self

      // Initialise with default props
      if let safeAreaProps = props as? SafeAreaControllable {
        hostingController.setSafeAreaRegions(ignoring: safeAreaProps.ignoreSafeArea)
      }

      shadowNodeProxy.setViewSize = { [weak self] size in
        self?.setViewSize(size)
      }

      shadowNodeProxy.setStyleSize = { [weak self] width, height in
        self?.requestedStyleSize = (width, height)
        self?.applyRequestedStyleSize()
      }

      props.shadowNodeProxy = shadowNodeProxy

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

      let appliedContainerInsets = appliesContainerInsets
      if let safeAreaProps = props as? SafeAreaControllable {
        hostingController.setSafeAreaRegions(ignoring: safeAreaProps.ignoreSafeArea)
      }
      if appliesContainerInsets != appliedContainerInsets {
        applyRequestedStyleSize()
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
    }

    #if os(iOS) || os(tvOS)
    public override func safeAreaInsetsDidChange() {
      super.safeAreaInsetsDidChange()
      applyRequestedStyleSize()
    }

    private var movingEdges: UIRectEdge = []

    public override func updateLayoutMetrics(_ frame: CGRect, oldFrame: CGRect) {
      super.updateLayoutMetrics(frame, oldFrame: oldFrame)
      // The first update carries React Native's empty metrics, a -1 by -1 frame, which say nothing about anchoring.
      // `CGRect.width` never goes negative, so read the raw size.
      guard oldFrame.size.width >= 0, oldFrame.size.height >= 0 else {
        return
      }
      var edges = movingEdges
      func set(_ edge: UIRectEdge, moving: Bool) {
        if moving { edges.insert(edge) } else { edges.remove(edge) }
      }
      if abs(oldFrame.height - frame.height) >= 0.01 {
        set(.top, moving: abs(oldFrame.minY - frame.minY) >= 0.01)
        set(.bottom, moving: abs(oldFrame.maxY - frame.maxY) >= 0.01)
      }
      if abs(oldFrame.width - frame.width) >= 0.01 {
        set(.left, moving: abs(oldFrame.minX - frame.minX) >= 0.01)
        set(.right, moving: abs(oldFrame.maxX - frame.maxX) >= 0.01)
      }
      if edges != movingEdges {
        movingEdges = edges
        applyRequestedStyleSize()
      }
    }
    #endif

    private var appliesContainerInsets: Bool {
      #if os(iOS) || os(tvOS)
      if #available(iOS 16.4, tvOS 16.4, *) {
        return hostingController.safeAreaRegions.contains(.container)
      }
      #endif
      return false
    }

    /**
     Applies the last requested style size along with container safe area insets
     */
    private func applyRequestedStyleSize() {
      guard let requested = requestedStyleSize else {
        return
      }
      var horizontal = 0.0
      var vertical = 0.0
      #if os(iOS) || os(tvOS)
      if appliesContainerInsets {
        let overlap = safeAreaInsets
        let screen = reactViewController()?.view.safeAreaInsets ?? overlap
        func inset(_ edge: UIRectEdge, _ overlap: CGFloat, _ screen: CGFloat) -> CGFloat {
          return movingEdges.contains(edge) && overlap > 0 ? screen : overlap
        }
        horizontal = Double(inset(.left, overlap.left, screen.left) + inset(.right, overlap.right, screen.right))
        vertical = Double(inset(.top, overlap.top, screen.top) + inset(.bottom, overlap.bottom, screen.bottom))
      }
      #endif
      let width = requested.width.map { NSNumber(value: $0.doubleValue + horizontal) }
      let height = requested.height.map { NSNumber(value: $0.doubleValue + vertical) }
      setStyleSize(width, height: height)
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

      if window != nil, let parentController = reactViewController() {
        #if !os(macOS)
        if parentController as? UINavigationController == nil && parentController as? UITabBarController == nil {
          // Swift automatically adds the hostingController in the correct place when the parentController
          // is UINavigationController, since its children are supposed to be only screens.
          // Similarly, for UITabBarController we expect its children to be only tabs.
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

extension UIHostingController {
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
      case .none:
        break
      }
    }
    if safeAreaRegions != regions {
      safeAreaRegions = regions
    }
  }
}
