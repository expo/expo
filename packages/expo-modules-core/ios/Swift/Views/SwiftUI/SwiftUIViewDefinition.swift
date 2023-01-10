// Copyright 2022-present 650 Industries. All rights reserved.

import SwiftUI

public final class SwiftUIViewDefinition<ViewType: SwiftUI.View, PropsType: ViewProps>: ViewManagerDefinition {
  typealias RenderFunction = (_ props: PropsType) -> ViewType

  let render: RenderFunction

  init(_ render: @escaping RenderFunction) {
    self.render = render
    super.init(definitions: [
      Prop("colors") { (_: UIView, _: [CGColor]) in },
      Prop("startPoint") { (_: UIView, _: CGPoint?) in },
      Prop("endPoint") { (_: UIView, _: CGPoint?) in },
      Prop("locations") { (_: UIView, _: [CGFloat]?) in }
    ])
  }

  override func createView(appContext: AppContext) -> UIView? {
    return SwiftUIHostingView(render)
  }
}

// MARK: - Definition components

public func View<ViewType: SwiftUI.View, PropsType: ViewProps>(
  @ViewBuilder _ render: @escaping (_ props: PropsType) -> ViewType
) -> SwiftUIViewDefinition<ViewType, PropsType> {
  return SwiftUIViewDefinition(render)
}
