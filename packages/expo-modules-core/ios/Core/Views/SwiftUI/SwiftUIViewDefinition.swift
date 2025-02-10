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
  static func convert(from value: any ExpoSwiftUI.View, appContext: AppContext) throws -> Self

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

  static func getDynamicType() -> AnyDynamicType {
    return DynamicSwiftUIViewType(innerType: Self.self)
  }

  static func convert(from value: any ExpoSwiftUI.View, appContext: AppContext) -> Self {
    return value as! Self
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
