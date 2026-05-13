// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal enum CapsuleCornerStyle: String, Enumerable {
  case continuous
  case circular
}

public final class CapsuleViewProps: UIBaseViewProps {
  @Field var cornerStyle: CapsuleCornerStyle = .continuous
}

public struct CapsuleView: ExpoSwiftUI.View {
  @ObservedObject public var props: CapsuleViewProps

  public init(props: CapsuleViewProps) {
    self.props = props
  }

  public var body: some View {
    Capsule(style: props.cornerStyle == .continuous ? .continuous : .circular)
  }
}
