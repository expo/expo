//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct SnackRow: View {
  let snack: ExpoSnack

  var body: some View {
    HStack {
      Image(systemName: "doc.text")
        .foregroundColor(.orange)
        .frame(width: 24, height: 24)

      VStack(alignment: .leading, spacing: 2) {
        Text(snack.name)
          .font(.headline)
          .foregroundColor(.primary)

        if let description = snack.description {
          Text(description)
            .font(.caption)
            .foregroundColor(.secondary)
            .lineLimit(1)
        }
      }

      Spacer()

      Image(systemName: "chevron.right")
        .font(.caption)
        .foregroundColor(.secondary)
    }
    .padding()
    .background(Color.expoSecondarySystemGroupedBackground)
    .clipShape(RoundedRectangle(cornerRadius: 12))
  }
}
