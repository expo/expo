// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct ErrorScreenButtonStyle: ButtonStyle {
  let background: Color
  let foreground: Color

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 14, weight: .semibold))
      .foregroundStyle(foreground)
      .frame(maxWidth: .infinity, minHeight: 36)
      .background(background, in: .rect(cornerRadius: 10))
      .opacity(configuration.isPressed ? 0.55 : 1)
      .scaleEffect(configuration.isPressed ? 0.98 : 1)
      .animation(.easeOut(duration: 0.1), value: configuration.isPressed)
  }
}
