// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SectionProps: ExpoSwiftUI.ViewProps {
  @Field var title: String?
}

struct SectionView: ExpoSwiftUI.View {
  @ObservedObject var props: SectionProps

  var body: some View {
    let form = Form {
      Section(header: Text(props.title ?? "").textCase(nil)) {
        Children()
      }
    }

    if #available(iOS 16.0, tvOS 16.0, *) {
      form.scrollDisabled(true)
    } else {
      form
    }
  }
}

internal struct SectionPrimitiveView: ExpoSwiftUI.View {
  @ObservedObject var props: SectionProps

  var body: some View {
    Section(header: Text(props.title ?? "").textCase(nil)) {
      Children()
    }
  }
}
