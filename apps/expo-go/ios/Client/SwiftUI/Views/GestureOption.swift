//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct GestureOption: View {
  let imageName: String?
  let systemImage: String?
  let title: String
  let isEnabled: Bool
  let action: () -> Void

  init(imageName: String, title: String, isEnabled: Bool, action: @escaping () -> Void) {
    self.imageName = imageName
    self.systemImage = nil
    self.title = title
    self.isEnabled = isEnabled
    self.action = action
  }

  init(systemImage: String, title: String, isEnabled: Bool, action: @escaping () -> Void) {
    self.imageName = nil
    self.systemImage = systemImage
    self.title = title
    self.isEnabled = isEnabled
    self.action = action
  }

  var body: some View {
    Button {
      action()
    } label: {
      HStack {
        if let imageName {
          Image(imageName)
            .foregroundColor(.primary)
            .frame(width: 24, height: 24)
        } else if let systemImage {
          Image(systemName: systemImage)
            .foregroundColor(.primary)
            .frame(width: 24, height: 24)
        }

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
