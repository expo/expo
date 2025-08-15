// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class FormViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var scrollEnabled: Bool = true
}

internal struct FormView: ExpoSwiftUI.View {
  @ObservedObject var props: FormViewProps

  var body: some View {
    let form = Form {
      Children()
    }
    .modifier(CommonViewModifiers(props: props))

    if #available(iOS 16.0, tvOS 16.0, *) {
      form.scrollDisabled(!props.scrollEnabled)
    } else {
      form
    }
  }
}
