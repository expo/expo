// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class SectionProps: ExpoSwiftUI.ViewProps {
  @Field var title: String?
}

let IPAD_OFFSET: CGFloat = 30
let IPHONE_OFFSET: CGFloat = 40

struct SectionView: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
  @ObservedObject var props: SectionProps

  var body: some View {
    let form = Form {
      Section(header: Text(props.title ?? "")) {
        UnwrappedChildren { child, isHostingView in
          child
            .if(!isHostingView) {
              $0.offset(x: UIDevice.current.userInterfaceIdiom == .pad ? IPAD_OFFSET : IPHONE_OFFSET)
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
