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
        Children()
        UnwrappedChildren { child, isHostingView in
          child
            .if(!isHostingView) {
              $0.offset(x: 40)
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
