// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class ImageViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var systemName: String = ""
  @Field var size: Double?
  @Field var color: Color?
  @Field var variableValue: Double?
  @Field var useTapGesture: Bool?
  var onTap = EventDispatcher()
}

internal struct ImageView: ExpoSwiftUI.View {
  @ObservedObject var props: ImageViewProps

  var body: some View {
    let image: Image

    if #available(iOS 16.0, tvOS 16.0, *) {
      image = Image(systemName: props.systemName, variableValue: props.variableValue)
    } else {
      image = Image(systemName: props.systemName)
    }

    return
      image
      .font(.system(size: CGFloat(props.size ?? 24)))
      .foregroundColor(props.color)
      .modifier(CommonViewModifiers(props: props))
      .applyOnTapGesture(useTapGesture: props.useTapGesture, eventDispatcher: props.onTap)
  }
}
