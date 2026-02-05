//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct ProjectRow: View {
  let project: ExpoProject
  var isLoading: Bool = false
  let onTap: () -> Void

  private var hasUpdates: Bool {
    project.firstTwoBranches.contains { !$0.updates.isEmpty }
  }

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
            .opacity(hasUpdates ? 1 : 0.5)

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
