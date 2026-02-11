// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class ImageViewProps: UIBaseViewProps {
  @Field var systemName: String = ""
  @Field var size: Double?
  @Field var color: Color?
  @Field var variableValue: Double?
  @Field var useTapGesture: Bool?
  var onTap = EventDispatcher()
}

public struct ImageView: ExpoSwiftUI.View {
  @ObservedObject public var props: ImageViewProps

  public init(props: ImageViewProps) {
    self.props = props
  }

  public var body: some View {
    let image: Image

    if #available(iOS 16.0, tvOS 16.0, *) {
      image = Image(systemName: props.systemName, variableValue: props.variableValue)
    } else {
      image = Image(systemName: props.systemName)
    }

    return image
      .font(.system(size: CGFloat(props.size ?? 24)))
      .foregroundColor(props.color)
      .applyOnTapGesture(useTapGesture: props.useTapGesture, eventDispatcher: props.onTap)
  }
}
