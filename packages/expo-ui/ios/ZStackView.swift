// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class ZStackViewProps: UIBaseViewProps {
  @Field var useTapGesture: Bool?
  @Field var alignment: AlignmentOptions?
  @Field var backgroundColor: Color?
  var onTap = EventDispatcher()
}

internal struct ZStackView: ExpoSwiftUI.View {
  @ObservedObject var props: ZStackViewProps

  var body: some View {
    ZStack(alignment: props.alignment?.toAlignment() ?? .center) {
      Children()
    }
    .applyOnTapGesture(useTapGesture: props.useTapGesture, eventDispatcher: props.onTap, useContentShape: true)
  }
}
