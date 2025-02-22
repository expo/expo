// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

class SectionProps: ExpoSwiftUI.ViewProps {
  @Field var title: String?
  @Field var displayTitleUppercase: Bool = true
}

let IPAD_OFFSET: CGFloat = 30
let IPHONE_OFFSET: CGFloat = 40

struct SectionView: ExpoSwiftUI.View {
  @EnvironmentObject var props: SectionProps

  var body: some View {
    let form = Form {
      Section(header: Text(props.title ?? "").textCase(props.displayTitleUppercase ? .uppercase : nil)) {
        Children().padding(EdgeInsets(top: 0, leading: 0, bottom: props.heightOffset, trailing: 0))
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
