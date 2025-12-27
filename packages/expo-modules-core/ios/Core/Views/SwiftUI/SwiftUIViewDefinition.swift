// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI
import Combine

/**
 A protocol for SwiftUI views that need to access props.
 */
public protocol ExpoSwiftUIView<Props>: SwiftUI.View, AnyArgument, ExpoSwiftUI.AnyChild, Sendable {
  associatedtype Props: ExpoSwiftUI.ViewProps

  var props: Props { get }

  init(props: Props)
}

extension ExpoSwiftUIView {
  /**
   Returns React's children as SwiftUI views.
   */
  // swiftlint:disable:next identifier_name
  public func Children() -> ForEach<[any ExpoSwiftUI.AnyChild], ObjectIdentifier, AnyView> {
    ForEach(props.children ?? [], id: \.id) { child in
      let view: any View = child.childView
      AnyView(view)
    }
  }

  /**
   Returns React's children as SwiftUI views, with any nested HostingViews stripped out.
   */
  public func UnwrappedChildren<T: View>( // swiftlint:disable:this identifier_name
    children: [(any ExpoSwiftUI.AnyChild)?]? = nil,
    @ViewBuilder transform: @escaping (_ child: AnyView, _ isHostingView: Bool)
    -> T = { child, _ in  child }
  ) -> ForEach<Range<Int>, Int, AnyView> {
    guard let children = children ?? props.children else {
      return ForEach(0..<1) { _ in AnyView(EmptyView()) }
    }
    let childrenArray = Array(children)

    return ForEach(0..<childrenArray.count, id: \.self) { index in
      guard let child = childrenArray[index] else {
        return AnyView(EmptyView())
      }
      return AnyView(
        Group {
          if let hostingView = child as? ExpoSwiftUI.UIViewHost,
            let hostingUIView = hostingView.view as? (any ExpoSwiftUI.AnyHostingView) {
            let content = hostingUIView.getContentView()
            transform(
              AnyView(
                content
                  .environmentObject(ExpoSwiftUI.ShadowNodeProxy.SHADOW_NODE_MOCK_PROXY)), true)
          } else {
            let view: any View = child
            transform(AnyView(view), false)
          }
        }
      )
    }
  }

  public nonisolated static func getDynamicType() -> AnyDynamicType {
    return DynamicSwiftUIViewType(innerType: Self.self)
  }

  public var appContext: AppContext? {
    return props.appContext
  }
}

extension ExpoSwiftUI {
  public typealias View = ExpoSwiftUIView

  /// Typealias for backward compatibility - ViewDefinition inside ExpoSwiftUI namespace
  public typealias ViewDefinition = SwiftUIViewDefinition
}

/// A definition representing the native SwiftUI view to export to React.
/// Renamed from ExpoSwiftUI.ViewDefinition to avoid collision with the base ViewDefinition class.
  public final class SwiftUIViewDefinition<Props: ExpoSwiftUI.ViewProps, ViewType: ExpoSwiftUI.View<Props>>: ViewDefinition<ViewType>, @unchecked Sendable {
    // To obtain prop and event names from the props object we need to create a dummy instance first.
    // This is not ideal, but RN requires us to provide all names before the view is created
    // and there doesn't seem to be a better way to do this right now.
    private lazy var dummyPropsMirror: Mirror = Mirror(reflecting: Props())

    convenience init(_ viewType: ViewType.Type) {
      // We assume SwiftUI views are exported as named views under the class name
      let nameDefinitionElement = ViewNameDefinition(name: String(describing: viewType))
      self.init(viewType, elements: [nameDefinitionElement])
    }

    public override func createView(appContext: AppContext) -> AppleView? {
      // It's assumed that this function is called only from the main thread.
      // In the ideal scenario it would be marked as `@MainActor`, but then `ViewModuleWrapper`
      // would be incompatible with `RCTViewManager` as it doesn't specify the actor.
      return MainActor.assumeIsolated {
#if RCT_NEW_ARCH_ENABLED
        let props = Props()
        props.appContext = appContext
        
        if ViewType.self is ExpoSwiftUI.WithHostingView.Type {
          let view = ExpoSwiftUI.HostingView(viewType: ViewType.self, props: props, appContext: appContext)
          // Set up events to call view's `dispatchEvent` method.
          // This is supported only on the new architecture, `dispatchEvent` exists only there.
          props.setUpEvents(view.dispatchEvent(_:payload:))
          return AppleView.from(view)
        }
        
        let view = ExpoSwiftUI.SwiftUIVirtualView(viewType: ViewType.self, props: props, viewDefinition: self, appContext: appContext)
        // Set up events to call view's `dispatchEvent` method.
        // This is supported only on the new architecture, `dispatchEvent` exists only there.
        props.setUpEvents(view.dispatchEvent(_:payload:))
        return AppleView.from(view)
#else
        return AppleView.from(UnimplementedExpoView(appContext: appContext, text: "Rendering SwiftUI views is possible only with the New Architecture enabled"))
#endif
      }
    }

    public override func getSupportedPropNames() -> [String] {
      return allMirrorChildren(dummyPropsMirror).compactMap { (label: String?, value: Any) in
        guard let field = value as? AnyFieldInternal else {
          return nil
        }
        return field.key ?? convertLabelToKey(label)
      }
    }

    public override func getSupportedEventNames() -> [String] {
      let propEventNames: [String] = allMirrorChildren(dummyPropsMirror).compactMap { (label: String?, value: Any) in
        guard let event = value as? EventDispatcher else {
          return nil
        }
        return event.customName ?? convertLabelToKey(label)
      }
      return propEventNames
    }
  }

