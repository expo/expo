//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct GestureOption: View {
  let imageName: String
  let title: String
  let isEnabled: Bool
  let action: () -> Void

  var body: some View {
    Button {
      action()
    } label: {
      HStack {
        Image(imageName)
          .foregroundColor(.primary)
          .frame(width: 24, height: 24)

        Text(title)
          .font(.body)
          .foregroundColor(.primary)
          .multilineTextAlignment(.leading)

        Spacer()

        if isEnabled {
          Image(systemName: "checkmark")
            .foregroundColor(.expoBlue)
        }
      }
      .padding()
      .frame(maxWidth: .infinity, alignment: .leading)
      .contentShape(Rectangle())
    }
    .buttonStyle(PlainButtonStyle())
  }
}
