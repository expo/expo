// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal enum CapsuleCornerStyle: String, Enumerable {
  case continuous
  case circular
}

internal final class CapsuleViewProps: UIBaseViewProps {
  @Field var cornerStyle: CapsuleCornerStyle = .continuous
}

internal struct CapsuleView: ExpoSwiftUI.View {
  @ObservedObject var props: CapsuleViewProps

  var body: some View {
    Capsule(style: props.cornerStyle == .continuous ? .continuous : .circular)
  }
}
