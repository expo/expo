//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct DevServerRow: View {
  let server: DevelopmentServer
  let onTap: () -> Void

  var body: some View {
    Button {
      onTap()
    }
    label: {
      HStack {
        Circle()
          .fill(Color.green)
          .frame(width: 12, height: 12)

        Text(server.description)
          .foregroundColor(.primary)

        Spacer()
        Image(systemName: "chevron.right")
          .font(.caption)
          .foregroundColor(.secondary)
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    .buttonStyle(PlainButtonStyle())
  }
}
