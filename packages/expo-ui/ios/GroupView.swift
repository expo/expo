// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class GroupViewProps: UIBaseViewProps {
  @Field var useTapGesture: Bool?
  var onTap = EventDispatcher()
}

internal struct GroupView: ExpoSwiftUI.View {
  @ObservedObject var props: GroupViewProps

  var body: some View {
    Group {
      Children()
    }
    .applyOnTapGesture(useTapGesture: props.useTapGesture, eventDispatcher: props.onTap, useContentShape: true)
  }
}
