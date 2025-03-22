// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

/**
 An NSObject acting as a fake UIView for RCTMountingManager to represent a SwiftUI view.
 This class is the Swift component of SwiftUIVirtualView, as referenced in ExpoFabricView.swift.
 */
extension ExpoSwiftUI {
  final class SwiftUIVirtualView<Props: ViewProps, ContentView: View<Props>>: SwiftUIVirtualViewObjC, ExpoSwiftUIView {
    /**
     A weak reference to the app context associated with this view.
     The app context is injected into the class after the context is initialized.
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
      installEventDispatchers()
    }

    // swiftlint:disable:next unavailable_function - init(props:) is required from ExpoSwiftUIView protocol
    init(props: Props) {
      fatalError("init(props:) is not expected to be called directly")
    }

    func setViewSize(_ size: CGSize) {
      super.setShadowNodeSize(Float(size.width), height: Float(size.height))
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
      guard let appContext else {
        log.error("AppContext is not available, view props cannot be updated for \(self)")
        return
      }
      do {
        try props.updateRawProps(rawProps, appContext: appContext)
      } catch let error {
        log.error("Updating props for \(self) has failed: \(error.localizedDescription)")
      }
    }

    /**
     Returns the view's props
     */
    func getProps() -> ExpoSwiftUI.ViewProps {
      return props
    }

    /**
     Calls lifecycle methods registered by `OnViewDidUpdateProps` definition component.
     */
    override func viewDidUpdateProps() {
      guard let viewDefinition else {
        return
      }
      guard let view = AppleView.from(self) else {
        return
      }
      viewDefinition.callLifecycleMethods(withType: .didUpdateProps, forView: view)
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
    override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
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
