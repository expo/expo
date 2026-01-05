// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

public final class ContentUnavailableViewProps: UIBaseViewProps {
  @Field var title: String = ""
  @Field var systemImage: String = ""
  @Field var description: String = ""
}

public struct ContentUnavailableView: ExpoSwiftUI.View {
  @ObservedObject public var props: ContentUnavailableViewProps

  public init(props: ContentUnavailableViewProps) {
    self.props = props
  }

  public var body: some View {
    if #available(iOS 17.0, tvOS 17.0, *) {
      SwiftUI.ContentUnavailableView(props.title, systemImage: props.systemImage, description: Text(props.description))
    }
  }
}
