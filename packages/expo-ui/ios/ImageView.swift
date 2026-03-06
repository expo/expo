// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class ImageViewProps: UIBaseViewProps {
  @Field var uri: String?
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

  @ViewBuilder
  public var body: some View {
    if let uri = props.uri,
       let url = URL(string: uri),
       let data = try? Data(contentsOf: url),
       let uiImage = UIImage(data: data) {
      Image(uiImage: uiImage)
        .applyImageModifiers(props.modifiers, appContext: props.appContext)
        .applyOnTapGesture(useTapGesture: props.useTapGesture, eventDispatcher: props.onTap)
    } else {
      let image: Image = {
        if #available(iOS 16.0, tvOS 16.0, *) {
          return Image(systemName: props.systemName, variableValue: props.variableValue)
        }
        return Image(systemName: props.systemName)
      }()

      image
        .font(.system(size: CGFloat(props.size ?? 24)))
        .foregroundColor(props.color)
        .applyOnTapGesture(useTapGesture: props.useTapGesture, eventDispatcher: props.onTap)
    }
  }
}
