// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class ZStackViewProps: UIBaseViewProps {
  @Field var alignment: AlignmentOptions?
}

public struct ZStackView: ExpoSwiftUI.View {
  @ObservedObject public var props: ZStackViewProps

  public init(props: ZStackViewProps) {
    self.props = props
  }

  public var body: some View {
    ZStack(alignment: props.alignment?.toAlignment() ?? .center) {
      Children()
    }
  }
}
