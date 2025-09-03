//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct ProjectRow: View {
  let project: ExpoProject

  var body: some View {
    HStack {
      Image(systemName: "app")
        .foregroundColor(.blue)
        .frame(width: 24, height: 24)

      VStack(alignment: .leading, spacing: 2) {
        Text(project.name)
          .font(.headline)
          .foregroundColor(.primary)

        Text(project.fullName)
          .font(.caption)
          .foregroundColor(.secondary)
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
