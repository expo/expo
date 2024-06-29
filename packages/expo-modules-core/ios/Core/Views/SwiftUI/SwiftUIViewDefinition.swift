// Copyright 2022-present 650 Industries. All rights reserved.

import SwiftUI
import Combine

public protocol ExpoSwiftUIView<Props>: SwiftUI.View {
  associatedtype Props: ViewProps

  var props: Props { get }

  init()
}

public final class SwiftUIViewDefinition<Props: ViewProps, ViewType: ExpoSwiftUIView<Props>>: ViewDefinition<SwiftUIHostingView<Props, ViewType>> {
  init(_ viewType: ViewType.Type) {
    super.init(SwiftUIHostingView<Props, ViewType>.self, elements: [
      Prop("colors") { (_: UIView, _: [CGColor]) in },
      Prop("startPoint") { (_: UIView, _: CGPoint?) in },
      Prop("endPoint") { (_: UIView, _: CGPoint?) in },
      Prop("locations") { (_: UIView, _: [CGFloat]?) in },
      Prop("test") { (_: UIView, _: Double?) in }
    ])
  }

  public override func createView(appContext: AppContext) -> UIView? {
    return SwiftUIHostingView(viewType: ViewType.self)
  }
}

// MARK: - Definition components

public func View<Props: ViewProps, ViewType: ExpoSwiftUIView<Props>>(_ viewType: ViewType.Type) -> SwiftUIViewDefinition<Props, ViewType> {
  return SwiftUIViewDefinition(ViewType.self)
}
