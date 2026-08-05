// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore
import ExpoUI

struct CustomBorderModifier: ViewModifier, Record {
  @Field var color: Color = .red
  @Field var width: CGFloat = 2
  @Field var cornerRadius: CGFloat = 0

  func body(content: Content) -> some View {
    content
      .overlay(
        RoundedRectangle(cornerRadius: cornerRadius)
          .stroke(color, lineWidth: width)
      )
  }
}
