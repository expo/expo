// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

// MARK: - Production class (NSObject base)

extension ExpoSwiftUI {
  /**
   An NSObject acting as a fake UIView for RCTMountingManager to represent a SwiftUI view.
   This class is the Swift component of SwiftUIVirtualView, as referenced in ExpoFabricView.swift.
   Used in production builds for minimal overhead.
   */
  final class SwiftUIVirtualView<Props: ViewProps, ContentView: View<Props>>: SwiftUIVirtualViewObjC, @MainActor ExpoSwiftUIView {
    var uiView: UIView?

    /**
     A weak reference to the app context associated with this view.
     */
    weak var appContext: AppContext?

    /**
     The view definition that setup from `ExpoFabricView.create()`.
     */
    private var viewDefinition: AnyViewDefinition?

    /**
     Props object that stores all the props for this particular view.
     It's an observed object that is passed into the content view.
     */
    let props: Props

    /**
     The actual SwiftUI view.
     */
    let contentView: ContentView

    /**
     Initializes a SwiftUI hosting view with the given SwiftUI view type.
     */
    init(viewType: ContentView.Type, props: Props, viewDefinition: AnyViewDefinition?, appContext: AppContext) {
      self.contentView = ContentView(props: props)
      self.props = props
      self.viewDefinition = viewDefinition
      self.appContext = appContext
      super.init()
      self.componentName = String(describing: viewType)

      props.shadowNodeProxy.setViewSize = { [weak self] size in
        self?.setShadowNodeSize(Float(size.width), height: Float(size.height))
      }
      props.shadowNodeProxy.setStyleSize = { [weak self] width, height in
        self?.setStyleSize(width, height: height)
      }

      installEventDispatchers()
    }

    // swiftlint:disable:next unavailable_function - init(props:) is required from ExpoSwiftUIView protocol
    init(props: Props) {
      fatalError("init(props:) is not expected to be called directly")
    }

    // MARK: - ExpoSwiftUIView implementations

    var body: some SwiftUI.View {
      contentView
    }

    var childView: some SwiftUI.View {
      contentView
    }

    var id: ObjectIdentifier {
      ObjectIdentifier(self)
    }

    // MARK: - SwiftUIVirtualViewObjC implementations

    /**
     Updates the environment object with props, based on the given dictionary with raw props.
     */
    override func updateProps(_ rawProps: [String: Any]) {
      virtualViewUpdateProps(rawProps, props: props, appContext: appContext)
    }

    /**
     Returns the view's props.
     */
    func getProps() -> ExpoSwiftUI.ViewProps {
      return props
    }

    /**
     Calls lifecycle methods registered by `OnViewDidUpdateProps` definition component.
     */
    @MainActor
    override func viewDidUpdateProps() {
      virtualViewDidUpdateProps(viewDefinition: viewDefinition, appleView: .swiftui(self))
    }

    /**
     Returns a bool value whether the view supports prop with the given name.
     */
    override func supportsProp(withName name: String) -> Bool {
      // It doesn't hurt much to just allow all prop names here, just for SwiftUI views.
      // Otherwise we would have to re-iterate over ViewProps fields which might be an expensive operation.
      // TODO: ViewProps should lazy load and cache an array of fields
      return true
    }

    /**
     Fabric calls this function when mounting (attaching) a child component view.
     */
    override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
      virtualViewMountChild(childComponentView, index: index, props: props)
    }

    /**
     Fabric calls this function when unmounting (detaching) a child component view.
     */
    override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
      virtualViewUnmountChild(childComponentView, index: index, props: props)
    }

    override func removeFromSuperview() {
      virtualViewRemoveFromSuperview(contentView: contentView)
      super.removeFromSuperview()
    }

    // MARK: - Privates

    /**
     Installs convenient event dispatchers for declared events, so the view can just invoke the block to dispatch the proper event.
     */
    private func installEventDispatchers() {
      viewDefinition?.eventNames.forEach { eventName in
        installEventDispatcher(forEvent: eventName, onView: self) { [weak self] (body: [String: Any]) in
          if let self = self {
            self.dispatchEvent(eventName, payload: body)
          } else {
            log.error("Cannot dispatch an event while the managing ExpoFabricView is deallocated")
          }
        }
      }
    }
  }
}

// MARK: - ViewWrapper (Production)

extension ExpoSwiftUI.SwiftUIVirtualView: @MainActor ExpoSwiftUI.ViewWrapper {
  func getWrappedView() -> Any {
    if let wrapper = contentView as? ExpoSwiftUI.ViewWrapper {
      return wrapper.getWrappedView()
    }
    return contentView
  }
}

// MARK: - Dev class (UIView base)

extension ExpoSwiftUI {
  /**
   A UIView-based variant of SwiftUIVirtualView used in dev mode.
   Because it inherits from UIView, `insertSubview:` won't crash when the component
   is incorrectly placed without a `<Host>` wrapper. Instead, `didMoveToSuperview`
   emits an RCTLogError.
   */
  final class SwiftUIVirtualViewDev<Props: ViewProps, ContentView: View<Props>>: SwiftUIVirtualViewObjCDev, @MainActor ExpoSwiftUIView {
    var uiView: UIView?

    /**
     A weak reference to the app context associated with this view.
     */
    weak var appContext: AppContext?

    /**
     The view definition that setup from `ExpoFabricView.create()`.
     */
    private var viewDefinition: AnyViewDefinition?

    /**
     Props object that stores all the props for this particular view.
     It's an observed object that is passed into the content view.
     */
    let props: Props

    /**
     The actual SwiftUI view.
     */
    let contentView: ContentView

    /**
     Initializes a SwiftUI hosting view with the given SwiftUI view type.
     */
    init(viewType: ContentView.Type, props: Props, viewDefinition: AnyViewDefinition?, appContext: AppContext) {
      self.contentView = ContentView(props: props)
      self.props = props
      self.viewDefinition = viewDefinition
      self.appContext = appContext
      super.init()
      self.componentName = String(describing: viewType)

      props.shadowNodeProxy.setViewSize = { [weak self] size in
        self?.setShadowNodeSize(Float(size.width), height: Float(size.height))
      }
      props.shadowNodeProxy.setStyleSize = { [weak self] width, height in
        self?.setStyleSize(width, height: height)
      }

      installEventDispatchers()
    }

    required init?(coder: NSCoder) {
      fatalError("init(coder:) is not expected to be called directly")
    }

    // swiftlint:disable:next unavailable_function - init(props:) is required from ExpoSwiftUIView protocol
    init(props: Props) {
      fatalError("init(props:) is not expected to be called directly")
    }

    // MARK: - ExpoSwiftUIView implementations

    var body: some SwiftUI.View {
      contentView
    }

    var childView: some SwiftUI.View {
      contentView
    }

    var id: ObjectIdentifier {
      ObjectIdentifier(self)
    }

    // MARK: - SwiftUIVirtualViewObjCDev implementations

    /**
     Updates the environment object with props, based on the given dictionary with raw props.
     */
    override func updateProps(_ rawProps: [String: Any]) {
      virtualViewUpdateProps(rawProps, props: props, appContext: appContext)
    }

    /**
     Returns the view's props.
     */
    func getProps() -> ExpoSwiftUI.ViewProps {
      return props
    }

    /**
     Calls lifecycle methods registered by `OnViewDidUpdateProps` definition component.
     */
    @MainActor
    override func viewDidUpdateProps() {
      virtualViewDidUpdateProps(viewDefinition: viewDefinition, appleView: .swiftui(self))
    }

    /**
     Returns a bool value whether the view supports prop with the given name.
     */
    override func supportsProp(withName name: String) -> Bool {
      // It doesn't hurt much to just allow all prop names here, just for SwiftUI views.
      // Otherwise we would have to re-iterate over ViewProps fields which might be an expensive operation.
      // TODO: ViewProps should lazy load and cache an array of fields
      return true
    }

    /**
     Fabric calls this function when mounting (attaching) a child component view.
     */
    override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
      virtualViewMountChild(childComponentView, index: index, props: props)
    }

    /**
     Fabric calls this function when unmounting (detaching) a child component view.
     */
    override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
      virtualViewUnmountChild(childComponentView, index: index, props: props)
    }

    override func removeFromSuperview() {
      virtualViewRemoveFromSuperview(contentView: contentView)
      super.removeFromSuperview()
    }

    // MARK: - Privates

    /**
     Installs convenient event dispatchers for declared events, so the view can just invoke the block to dispatch the proper event.
     */
    private func installEventDispatchers() {
      viewDefinition?.eventNames.forEach { eventName in
        installEventDispatcher(forEvent: eventName, onView: self) { [weak self] (body: [String: Any]) in
          if let self = self {
            self.dispatchEvent(eventName, payload: body)
          } else {
            log.error("Cannot dispatch an event while the managing ExpoFabricView is deallocated")
          }
        }
      }
    }
  }
}

// MARK: - ViewWrapper (Dev)

extension ExpoSwiftUI.SwiftUIVirtualViewDev: @MainActor ExpoSwiftUI.ViewWrapper {
  func getWrappedView() -> Any {
    if let wrapper = contentView as? ExpoSwiftUI.ViewWrapper {
      return wrapper.getWrappedView()
    }
    return contentView
  }
}

// MARK: - Shared helpers

private func virtualViewUpdateProps<Props: ExpoSwiftUI.ViewProps>(_ rawProps: [String: Any], props: Props, appContext: AppContext?) {
  guard let appContext else {
    log.error("AppContext is not available, view props cannot be updated")
    return
  }
  do {
    try props.updateRawProps(rawProps, appContext: appContext)
  } catch let error {
    log.error("Updating props has failed: \(error.localizedDescription)")
  }
}

@MainActor
private func virtualViewDidUpdateProps(viewDefinition: AnyViewDefinition?, appleView: AppleView) {
  guard let viewDefinition else {
    return
  }
  viewDefinition.callLifecycleMethods(withType: .didUpdateProps, forView: appleView)
}

private func virtualViewMountChild<Props: ExpoSwiftUI.ViewProps>(_ childComponentView: UIView, index: Int, props: Props) {
  var children = props.children ?? []
  let child: any ExpoSwiftUI.AnyChild
  if let view = childComponentView as AnyObject as? (any ExpoSwiftUI.View) {
    child = view
  } else {
    child = ExpoSwiftUI.UIViewHost(view: childComponentView)
  }
  children.insert(child, at: index)

  props.children = children
  props.objectWillChange.send()
}

@MainActor
private func virtualViewUnmountChild<Props: ExpoSwiftUI.ViewProps>(_ childComponentView: UIView, index: Int, props: Props) {
  // Make sure the view has no superview, React Native asserts against this.
  childComponentView.removeFromSuperview()

  let childViewId: ObjectIdentifier
  if let child = childComponentView as AnyObject as? (any ExpoSwiftUI.AnyChild) {
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

private func virtualViewRemoveFromSuperview<ContentView: SwiftUI.View>(contentView: ContentView) {
  // When the view is unmounted, the focus on TextFieldView stays active and it causes a crash, so we blur it here
  // UIView does something similar to resign the first responder in removeFromSuperview, so we do the same for our virtual view
  if let focusableView = contentView as? any ExpoSwiftUI.FocusableView {
    focusableView.forceResignFirstResponder()
  }
}
