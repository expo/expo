//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct ThemeOption: View {
  let icon: String
  let title: String
  let isSelected: Bool
  let action: () -> Void

  var body: some View {
    Button {
      action()
    } label: {
      HStack {
        Image(systemName: icon)
          .foregroundColor(.primary)
          .frame(width: 24, height: 24)

        Text(title)
          .font(.body)
          .foregroundColor(.primary)

        Spacer()

        if isSelected {
          Image(systemName: "checkmark.circle.fill")
            .foregroundColor(.expoBlue)
        } else {
          Image(systemName: "circle")
            .foregroundColor(.secondary)
        }
      }
      .padding()
      .frame(maxWidth: .infinity, alignment: .leading)
      .contentShape(Rectangle())
    }
    .buttonStyle(PlainButtonStyle())
  }
}
