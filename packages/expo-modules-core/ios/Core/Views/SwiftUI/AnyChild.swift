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

    // The underlying UIKit view, if this child wraps one. Returns `nil` for pure SwiftUI child.
    var uiView: UIView? { get }

    // Identity used to reconcile child collections. Defaults to object identity.
    var childIdentity: ExpoSwiftUI.ChildIdentity { get }
  }

  /**
   An `AnyChild` that provides a string-based identity for child collections.
   */
  public protocol StringIdentityChild: AnyChild {
    var stringIdentity: String? { get }
  }

  public enum ChildIdentity: Hashable {
    case object(ObjectIdentifier)
    case string(String)
  }
}

public extension ExpoSwiftUI.AnyChild where Self == ChildViewType {
  var childView: ChildViewType {
    self
  }

  var id: ObjectIdentifier {
    fatalError("Expected override by derived SwiftUIVirtualView or UIViewHost")
  }

  var uiView: UIView? {
    nil
  }
}

public extension ExpoSwiftUI.AnyChild {
  var childIdentity: ExpoSwiftUI.ChildIdentity {
    .object(id)
  }
}

public extension ExpoSwiftUI.AnyChild where Self: ExpoSwiftUI.StringIdentityChild {
  var childIdentity: ExpoSwiftUI.ChildIdentity {
    if let stringIdentity {
      return .string(stringIdentity)
    }
    return .object(id)
  }
}
