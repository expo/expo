// Copyright 2026-present 650 Industries. All rights reserved.

import SwiftUI

/// A SwiftUI view of Expo Modules v2. `@ExpoView<Props>` conforms a SwiftUI view struct to it, and adds the `props`
/// and `children` constants, the weak `appContext` property and the initializer:
///
///     @ExpoView<CardProps>
///     struct CardView: View {
///       var body: some View {
///         VStack {
///           Text(props.title)
///           children
///         }
///       }
///     }
///
/// Core creates the struct again with the current props and children when either changes, and SwiftUI keeps the
/// view's `@State` as long as the view stays mounted. The view renders inside a `Host`, and it can contain, or be
/// contained by, the SwiftUI views of `ExpoSwiftUI.View`.
@MainActor
public protocol AnyNativeSwiftUIView: AnyNativeView, SwiftUI.View {
  init(props: Props, children: ExpoSwiftUI.Children, appContext: AppContext?)
}

extension AnyNativeSwiftUIView {
  public static var _componentViewBaseClass: AnyClass {
    return SwiftUINativeView<Self>.self
  }
}

extension ExpoSwiftUI {
  /// The React children of a SwiftUI view of Expo Modules v2, in order. As a view, it renders all of them, so a body
  /// can place them with `VStack { children }`. As a collection, it gives each child, for example to find one by its
  /// type with `Child.as(_:)`.
  public struct Children: RandomAccessCollection {
    internal let elements: [Child]

    /// No children, for example to create a view in a SwiftUI preview.
    public init() {
      self.elements = []
    }

    internal init(_ elements: [Child]) {
      self.elements = elements
    }

    public var startIndex: Int {
      return elements.startIndex
    }

    public var endIndex: Int {
      return elements.endIndex
    }

    public subscript(position: Int) -> Child {
      return elements[position]
    }
  }

  /// A React child of a SwiftUI view of Expo Modules v2: a SwiftUI view of Expo Modules, or a UIKit view. As a view,
  /// it renders the child.
  public struct Child: Identifiable {
    /// The identity of a child. It stays the same while the child is mounted.
    public struct ID: Hashable {
      fileprivate let identity: ChildIdentity
    }

    public let id: ID

    internal let base: any AnyChild

    /// Called on the main thread when the view mounts the child, because the identity of a child is isolated to the
    /// main actor.
    @MainActor
    internal init(_ base: any AnyChild) {
      self.id = ID(identity: base.childIdentity)
      self.base = base
    }

    /// Returns the child as a SwiftUI view of Expo Modules v2 of the given type, or `nil` when it's another view.
    @MainActor
    public func `as`<Content: AnyNativeSwiftUIView>(_ type: Content.Type) -> NativeChild<Content>? {
      return base.as(type)
    }
  }

  /// A child that is a SwiftUI view of Expo Modules v2 of a known type, which `Child.as(_:)` returns. As a view, it
  /// renders `Content`, and it updates when the child's props or children change. `props`, `children` and `content`
  /// return the current values, but a body that reads them doesn't update when only the child changes.
  public struct NativeChild<Content: AnyNativeSwiftUIView>: SwiftUI.View {
    @ObservedObject internal var model: SwiftUINativeViewModel<Content>

    internal init(model: SwiftUINativeViewModel<Content>) {
      self.model = model
    }

    /// The props that the child has now.
    public var props: Content.Props {
      return model.props
    }

    /// The children that the child has now.
    public var children: Children {
      return Children(model.children)
    }

    /// The view struct with the current props, children and app context, for example to call a method of the view.
    public var content: Content {
      return Content(props: model.props, children: children, appContext: model.appContext)
    }

    public var body: Content {
      return content
    }
  }
}

// The conformances are in extensions, so they don't isolate the types to the main actor.
extension ExpoSwiftUI.Children: SwiftUI.View {
  public var body: some SwiftUI.View {
    ForEach(elements) { $0 }
  }
}

extension ExpoSwiftUI.Child: SwiftUI.View {
  public var body: some SwiftUI.View {
    let view: any SwiftUI.View = base.childView
    AnyView(view)
  }
}
