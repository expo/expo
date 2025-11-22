// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal final class ContentUnavailableViewProps: UIBaseViewProps {
  @Field var title: String = ""
  @Field var systemImage: String = ""
  @Field var description: String = ""
}

struct ContentUnavailableView: ExpoSwiftUI.View {
  @ObservedObject var props: ContentUnavailableViewProps

  var body: some View {
    if #available(iOS 17.0, tvOS 17.0, *) {
      SwiftUI.ContentUnavailableView(props.title, systemImage: props.systemImage, description: Text(props.description))
    }
  }
}
