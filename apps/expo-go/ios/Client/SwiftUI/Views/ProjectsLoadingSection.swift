//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct ProjectsLoadingSection: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      SectionHeader(title: "PROJECTS")

      VStack(spacing: 6) {
        ForEach(0..<3, id: \.self) { _ in
          ProjectSkeletonRow()
        }
      }
    }
  }
}

struct ProjectSkeletonRow: View {
  var body: some View {
    HStack(spacing: 12) {
      VStack(alignment: .leading, spacing: 2) {
        RoundedRectangle(cornerRadius: BorderRadius.small)
          .fill(Color.gray.opacity(0.2))
          .frame(width: 120, height: 16)

        RoundedRectangle(cornerRadius: BorderRadius.small)
          .fill(Color.gray.opacity(0.15))
          .frame(width: 180, height: 12)
      }

      Spacer()

      Image(systemName: "chevron.right")
        .font(.caption)
        .foregroundColor(.secondary)
        .opacity(0.3)
    }
    .padding()
    .background(Color.expoSecondarySystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
    .redacted(reason: .placeholder)
  }
}
