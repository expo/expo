// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class SectionProps: ExpoSwiftUI.ViewProps {
  @Field var title: String?
}

struct SectionView: ExpoSwiftUI.View {
  @EnvironmentObject var props: SectionProps

  var body: some View {
    let form = Form {
      Section(header: Text(props.title ?? "")) {
        UnwrappedChildren { view, isHostingView in
          view
            .if(!isHostingView) { v in
              v.offset(x: 40)
            }
        }
      }
    }

    if #available(iOS 16.0, tvOS 16.0, *) {
      form.scrollDisabled(true)
    } else {
      form
    }
  }
}

