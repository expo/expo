// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class DisclosureGroupViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var label: String
}

internal struct DisclosureGroupView: ExpoSwiftUI.View {
  @ObservedObject var props: DisclosureGroupViewProps

  var body: some View {
    DisclosureGroup(props.label) {
      Children()
    }
    .modifier(CommonViewModifiers(props: props))
  }
}
