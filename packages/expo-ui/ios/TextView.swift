// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class TextViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var text: String = ""
  @Field var weight: FontWeight?
  @Field var design: FontDesign?
  @Field var size: Double?
  @Field var lineLimit: Int?
  @Field var color: Color?
}

internal struct TextView: ExpoSwiftUI.View {
  @ObservedObject var props: TextViewProps


  var body: some View {
    let hasDeprecatedFontProps = props.weight != nil || props.design != nil || props.size != nil
    
    Text(props.text)
      .if(hasDeprecatedFontProps) { text in
        // TODO: remove this block of code once we remove the deprecated font props
        text.font(.system(
          size: CGFloat(props.size ?? 17),
          weight: props.weight?.toSwiftUI() ?? .regular,
          design: props.design?.toSwiftUI() ?? .default
        ))
      }
      .lineLimit(props.lineLimit)
      .foregroundColor(props.color)
      .modifier(CommonViewModifiers(props: props, defaultFrameAlignment: .leading))
  }
}
