// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI
import Combine

/**
 A protocol for SwiftUI views that need to access props.
 */
public protocol ExpoSwiftUIView<Props>: SwiftUI.View, AnyArgument {
  associatedtype Props: ExpoSwiftUI.ViewProps

  var props: Props { get }
  static func getDynamicType() -> AnyDynamicType

  init()
}

public extension ExpoSwiftUIView {
  /**
   Returns React's children as SwiftUI views.
   */
  func Children() -> some View { // swiftlint:disable:this identifier_name
    ZStack(alignment: .topLeading) {
      ForEach(props.children ?? []) { $0 }
    }
  }

  /**
   Returns React's children as SwiftUI views, with any nested HostingViews stripped out.
   */
  func UnwrappedChildren<T: View>(  // swiftlint:disable:this identifier_name
    @ViewBuilder transform: @escaping (
      _ child: AnyView, _ isHostingView: Bool
    ) -> T = { child, _ in child }
  ) -> ForEach<Range<Int>, Int, AnyView> { // Return ForEach to enable modifiers like `onDelete`
    // Ensure there's a valid array of children, otherwise return a default empty view
    guard let children = props.children else {
      // Return empty ForEach to match return type's requirements
      return ForEach(0..<1) { _ in AnyView(EmptyView()) }
    }
    let childrenArray = Array(children)
    return ForEach(0..<childrenArray.count, id: \.self) { index in
      let child = childrenArray[index]
      // Wrap if ... else in AnyView to match return type's requirements
      AnyView(
        Group {
          if let hostingView = child.view as? (any ExpoSwiftUI.AnyHostingView) {
            // If it's a hosting view, extract content and props to apply the transformation
            let content = hostingView.getContentView()
            let propsObject =
            hostingView.getProps() as any ObservableObject
            transform(
              AnyView(
                content
                  .environmentObject(propsObject)
                  .environmentObject(ExpoSwiftUI.ShadowNodeProxy.SHADOW_NODE_MOCK_PROXY)
              ),
              true
            )
          } else {
            // If it's not a hosting view, apply the transformation without changes
            transform(AnyView(child), false)
          }
        }
      )
    }
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
    public final class ViewDefinition<Props: ViewProps, ViewType: View<Props>>: ExpoModulesCore.ViewDefinition<HostingView<Props, ViewType>> {
      // To obtain prop and event names from the props object we need to create a dummy instance first.
      // This is not ideal, but RN requires us to provide all names before the view is created
      // and there doesn't seem to be a better way to do this right now.
      private lazy var dummyPropsMirror: Mirror = Mirror(reflecting: Props())

      init(_ viewType: ViewType.Type) {
        // We assume SwiftUI views are exported as named views under the class name
        let nameDefinitionElement = ViewNameDefinition(name: String(describing: viewType))
        super.init(HostingView<Props, ViewType>.self, elements: [nameDefinitionElement])
      }

      init(_ viewType: ViewType.Type, elements: [AnyViewDefinitionElement]) {
        super.init(HostingView<Props, ViewType>.self, elements: elements)
      }

      public override func createView(appContext: AppContext) -> UIView? {
  #if RCT_NEW_ARCH_ENABLED
        let props = Props()
        let view = HostingView(viewType: ViewType.self, props: props, appContext: appContext)

        // Set up events to call view's `dispatchEvent` method.
        // This is supported only on the new architecture, `dispatchEvent` exists only there.
        props.setUpEvents(view.dispatchEvent(_:payload:))

        return view
  #else
        return UnimplementedExpoView(appContext: appContext, text: "Rendering SwiftUI views is possible only with the New Architecture enabled")
  #endif
      }

      public override func getSupportedPropNames() -> [String] {
        return dummyPropsMirror.children.compactMap { (label: String?, value: Any) in
          guard let field = value as? AnyFieldInternal else {
            return nil
          }
          return field.key ?? convertLabelToKey(label)
        }
      }

      public override func getSupportedEventNames() -> [String] {
        return dummyPropsMirror.children.compactMap { (label: String?, value: Any) in
          guard let event = value as? EventDispatcher else {
            return nil
          }
          return event.customName ?? convertLabelToKey(label)
        }
      }
    }
  }
