// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI
import Combine

/**
 A protocol for SwiftUI views that need to access props.
 */
public protocol ExpoSwiftUIView<Props>: SwiftUI.View, AnyArgument, ExpoSwiftUI.AnyChild {
  associatedtype Props: ExpoSwiftUI.ViewProps

  var props: Props { get }
  static func getDynamicType() -> AnyDynamicType

  init(props: Props)
}

public extension ExpoSwiftUIView {
  /**
   Returns React's children as SwiftUI views.
   */
  func Children() -> some View { // swiftlint:disable:this identifier_name
    ForEach(props.children ?? [], id: \.id) { child in
      let view: any View = child.childView
      AnyView(view)
    }
  }

  /**
   Returns React's children as SwiftUI views, with any nested HostingViews stripped out.
   */
  func UnwrappedChildren<T: View>( // swiftlint:disable:this identifier_name
    children: [(any ExpoSwiftUI.AnyChild)?]? = nil,
    @ViewBuilder transform: @escaping (_ child: AnyView, _ isHostingView: Bool)
    -> T = { child, _ in  child }
  ) -> some View {
    guard let children = children ?? props.children else {
      return AnyView(EmptyView())
    }
    let childrenArray = Array(children)
    return AnyView(
      ForEach(0..<childrenArray.count, id: \.self) { index in
        if let child = childrenArray[index] {
          if let hostingView = child as? ExpoSwiftUI.UIViewHost {
            let content = hostingView.childView
            transform(
              AnyView(
                content
                  .environmentObject(ExpoSwiftUI.ShadowNodeProxy.SHADOW_NODE_MOCK_PROXY)), true)
          } else {
            let view: any View = child
            transform(AnyView(view), false)
          }
        }
      }
    )
  }

  static func getDynamicType() -> AnyDynamicType {
    return DynamicSwiftUIViewType(innerType: Self.self)
  }
}

extension ExpoSwiftUI {
  public typealias View = ExpoSwiftUIView

  /**
   A definition representing the native SwiftUI view to export to React.
   */
  public final class ViewDefinition<Props: ViewProps, ViewType: View<Props>>: ObjectDefinition, AnyViewDefinition {
    /**
     An array of view props definitions.
     */
    public var props: [any AnyViewProp]

    /**
     Name of the defined view. Falls back to the type name if not provided in the definition.
     */
    public var name: String

    /**
     Names of the events that the view can send to JavaScript.
     */
    public var eventNames: [String]

    /**
     An array of the view lifecycle methods.
     */
    let lifecycleMethods: [AnyViewLifecycleMethod]

    // To obtain prop and event names from the props object we need to create a dummy instance first.
    // This is not ideal, but RN requires us to provide all names before the view is created
    // and there doesn't seem to be a better way to do this right now.
    private lazy var dummyPropsMirror: Mirror = Mirror(reflecting: Props())

    convenience init(_ viewType: ViewType.Type) {
      // We assume SwiftUI views are exported as named views under the class name
      let nameDefinitionElement = ViewNameDefinition(name: String(describing: viewType))
      self.init(viewType, elements: [nameDefinitionElement])
    }

    init(_ viewType: ViewType.Type, elements: [AnyViewDefinitionElement]) {
      self.props = elements
        .compactMap { $0 as? AnyViewProp }

      self.name = elements
        .compactMap { $0 as? ViewNameDefinition }
        .last?
        .name ?? String(describing: viewType)

      self.eventNames = Array(
        elements
          .compactMap { ($0 as? EventsDefinition)?.names }
          .joined()
      )

      self.lifecycleMethods = elements
        .compactMap { $0 as? AnyViewLifecycleMethod }

      super.init(definitions: elements)
    }

    public func createView(appContext: AppContext) -> AppleView? {
#if RCT_NEW_ARCH_ENABLED
      let props = Props()

      if ViewType.self is WithHostingView.Type {
        let view = HostingView(viewType: ViewType.self, props: props, appContext: appContext)
        // Set up events to call view's `dispatchEvent` method.
        // This is supported only on the new architecture, `dispatchEvent` exists only there.
        props.setUpEvents(view.dispatchEvent(_:payload:))
        return AppleView.from(view)
      }

      let view = SwiftUIVirtualView(viewType: ViewType.self, props: props, viewDefinition: self, appContext: appContext)
      // Set up events to call view's `dispatchEvent` method.
      // This is supported only on the new architecture, `dispatchEvent` exists only there.
      props.setUpEvents(view.dispatchEvent(_:payload:))
      return AppleView.from(view)
#else
      return AppleView.from(UnimplementedExpoView(appContext: appContext, text: "Rendering SwiftUI views is possible only with the New Architecture enabled"))
#endif
    }

    public func propsDict() -> [String: any AnyViewProp] {
      return props.reduce(into: [String: AnyViewProp]()) { acc, prop in
        acc[prop.name] = prop
      }
    }

    public func getSupportedPropNames() -> [String] {
      return dummyPropsMirror.children.compactMap { (label: String?, value: Any) in
        guard let field = value as? AnyFieldInternal else {
          return nil
        }
        return field.key ?? convertLabelToKey(label)
      }
    }

    public func getSupportedEventNames() -> [String] {
      return dummyPropsMirror.children.compactMap { (label: String?, value: Any) in
        guard let event = value as? EventDispatcher else {
          return nil
        }
        return event.customName ?? convertLabelToKey(label)
      }
    }

    public func callLifecycleMethods(withType type: ViewLifecycleMethodType, forView view: AppleView) {
      for method in lifecycleMethods where method.type == type {
        method(view)
      }
    }

    public func createReactComponentPrototype(appContext: AppContext) throws -> JavaScriptObject {
      let prototype = try appContext.runtime.createObject()

      try decorateWithFunctions(object: prototype, appContext: appContext)

      return prototype
    }
  }
}
