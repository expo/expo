//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct EmptyStateView: View {
  let message: String
  let description: String?

  init(message: String, description: String? = nil) {
    self.message = message
    self.description = description
  }

  var body: some View {
    VStack(spacing: 8) {
      Text(message)
        .font(.headline)
        .foregroundColor(.primary)
        .multilineTextAlignment(.center)

      if let description = description {
        Text(description)
          .font(.caption)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.center)
      }
    }
    .padding()
    .frame(maxWidth: .infinity)
    .background(Color.expoSecondarySystemGroupedBackground)
    .clipShape(RoundedRectangle(cornerRadius: 12))
  }
}
