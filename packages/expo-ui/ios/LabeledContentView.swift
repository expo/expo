// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class LabeledContentProps: UIBaseViewProps {
  @Field var label: String?
}

internal struct LabeledContentView: ExpoSwiftUI.View {
  @ObservedObject var props: LabeledContentProps

  var body: some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      if hasCustomLabel {
        LabeledContent {
          contentChildren
        } label: {
          customLabelContent
        }
      } else {
        LabeledContent(props.label ?? "") {
          contentChildren
        }
      }
    }
  }

  private var hasCustomLabel: Bool {
    props.children?.slot("label") != nil
  }

  @ViewBuilder
  private var contentChildren: some View {
    if let content = props.children?.slot("content") {
      content
    }
  }

  @ViewBuilder
  private var customLabelContent: some View {
    if let labelContent = props.children?.slot("label") {
      labelContent
    }
  }
}
