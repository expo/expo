// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class LabeledContentProps: UIBaseViewProps {
  @Field var label: String?
}

internal final class LabeledContentLabelProps: ExpoSwiftUI.ViewProps {}
internal struct LabeledContentLabel: ExpoSwiftUI.View {
  @ObservedObject var props: LabeledContentLabelProps

  var body: some View {
    Children()
  }
}

internal final class LabeledContentContentProps: ExpoSwiftUI.ViewProps {}
internal struct LabeledContentContent: ExpoSwiftUI.View {
  @ObservedObject var props: LabeledContentContentProps

  var body: some View {
    Children()
  }
}

internal struct LabeledContentView: ExpoSwiftUI.View {
  @ObservedObject var props: LabeledContentProps

  var body: some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      LabeledContent {
        contentChildren
      } label: {
        labeledContentLabel
      }
    }
  }

  @ViewBuilder
  private var contentChildren: some View {
    if let content = props.children?
      .compactMap({ $0.childView as? LabeledContentContent })
      .first
    {
      content
    }
  }

  @ViewBuilder
  private var labeledContentLabel: some View {
    if let labelContent = props.children?
      .compactMap({ $0.childView as? LabeledContentLabel })
      .first
    {
      labelContent
    } else if let label = props.label, !label.isEmpty {
      Text(label).textCase(nil)
    }
  }
}
