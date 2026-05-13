// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class SpacerViewProps: UIBaseViewProps {
  @Field var minLength: Double?
}

public struct SpacerView: ExpoSwiftUI.View {
  @ObservedObject public var props: SpacerViewProps

  public init(props: SpacerViewProps) {
    self.props = props
  }

  public var body: some View {
    Spacer(minLength: props.minLength.map { CGFloat($0) })
  }
}
