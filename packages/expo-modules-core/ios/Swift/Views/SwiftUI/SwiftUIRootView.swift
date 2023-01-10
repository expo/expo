// Copyright 2022-present 650 Industries. All rights reserved.

import SwiftUI

public struct SwiftUIRootView<ViewType: SwiftUI.View, PropsType: ViewProps>: View {
  typealias RenderFunction = (_ props: PropsType) -> ViewType

  @ObservedObject
  var props: PropsType

  let render: RenderFunction

  init(props: PropsType, render: @escaping RenderFunction) {
    self.props = props
    self.render = render
  }

  public var body: some View {
    return render(props)
  }
}
