// Copyright 2026-present 650 Industries. All rights reserved.

import SwiftUI

/// A SwiftUI view of Expo Modules v2. `@ExpoView<Props>` conforms a SwiftUI view struct to it, and adds the `props`
/// and `children` constants and the initializer:
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
  init(props: Props, children: ExpoSwiftUI.Children)
}

extension ExpoSwiftUI {
  /// The React children of a SwiftUI view of Expo Modules v2, in order. As a view, it renders all of them, so a body
  /// can place them with `VStack { children }`. As a collection, it gives each child, for example to pick one.
  public struct Children: RandomAccessCollection {
    public let elements: [any AnyChild]

    public init(_ elements: [any AnyChild] = []) {
      self.elements = elements
    }

    public var startIndex: Int {
      return elements.startIndex
    }

    public var endIndex: Int {
      return elements.endIndex
    }

    public subscript(position: Int) -> any AnyChild {
      return elements[position]
    }
  }
}

// The conformance is in an extension, so it doesn't isolate the collection to the main actor.
extension ExpoSwiftUI.Children: SwiftUI.View {
  public var body: some SwiftUI.View {
    ForEach(elements, id: \.childIdentity) { child in
      let view: any SwiftUI.View = child.childView
      AnyView(view)
    }
  }
}
