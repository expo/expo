//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct ProjectRow: View {
  let project: ExpoProject
  var isLoading: Bool = false
  let onTap: () -> Void

  var body: some View {
    Button {
      onTap()
    } label: {
      HStack {
        VStack(alignment: .leading, spacing: 2) {
          Text(project.name)
            .font(.body)
            .fontWeight(.semibold)
            .foregroundColor(.primary)

          Text(project.fullName)
            .font(.caption)
            .foregroundColor(.secondary)
        }

        Spacer()

        if isLoading {
          ProgressView()
        } else {
          Image(systemName: "chevron.right")
            .font(.caption)
            .foregroundColor(.secondary)
        }
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
    }
    .buttonStyle(PlainButtonStyle())
  }
}
