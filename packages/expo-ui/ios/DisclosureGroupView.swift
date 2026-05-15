// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class DisclosureGroupViewProps: UIBaseViewProps {
  @Field var label: String
  @Field var isExpanded: Bool = true
  var onIsExpandedChange = EventDispatcher()
}

internal struct DisclosureGroupView: ExpoSwiftUI.View {
  @ObservedObject var props: DisclosureGroupViewProps
  @State private var isExpanded: Bool = false

  var body: some View {
#if os(tvOS)
    Text("DisclosureGroupView is not supported on tvOS")
#else
    DisclosureGroup(props.label, isExpanded: $isExpanded) {
      Children()
    }
    .onChange(of: isExpanded) { newValue in
      if newValue == props.isExpanded { return }
      props.onIsExpandedChange(["isExpanded": newValue])
    }
    .onChange(of: props.isExpanded) { newValue in
      isExpanded = newValue
    }
    .onAppear {
      isExpanded = props.isExpanded
    }
#endif
  }
}
