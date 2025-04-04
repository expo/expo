// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

/**
 A type-erased protocol representing a child view for a SwiftUI view.
 */
extension ExpoSwiftUI {
  public protocol AnyChild: SwiftUI.View {
    // swiftlint:disable:next nesting - Keep AnyChild protocol inside ExpoSwiftUI namespace
    associatedtype ChildViewType: SwiftUI.View
    var childView: ChildViewType { get }

    var id: ObjectIdentifier { get }
  }
}

public extension ExpoSwiftUI.AnyChild where Self == ChildViewType {
  var childView: ChildViewType {
    self
  }

  var id: ObjectIdentifier {
    fatalError("Expected override by derived SwiftUIVirtualView or UIViewHost")
  }
}
