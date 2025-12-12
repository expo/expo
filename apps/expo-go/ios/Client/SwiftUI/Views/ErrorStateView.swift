//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct ErrorStateView: View {
  let message: String
  let onRetry: (() -> Void)?

  init(message: String, onRetry: (() -> Void)? = nil) {
    self.message = message
    self.onRetry = onRetry
  }

  var body: some View {
    VStack(spacing: 16) {
      Image(systemName: "exclamationmark.triangle")
        .font(.system(size: 40))
        .foregroundColor(.orange)

      Text(message)
        .font(.subheadline)
        .foregroundColor(.secondary)
        .multilineTextAlignment(.center)

      if let onRetry = onRetry {
        Button {
          onRetry()
        } label: {
          HStack(spacing: 6) {
            Image(systemName: "arrow.clockwise")
              .font(.caption)
            Text("Try Again")
              .font(.subheadline)
              .fontWeight(.medium)
          }
          .foregroundColor(.white)
          .padding(.horizontal, 16)
          .padding(.vertical, 8)
          .background(Color.black)
          .cornerRadius(8)
        }
      }
    }
    .padding()
    .frame(maxWidth: .infinity)
    .background(Color.expoSecondarySystemGroupedBackground)
    .clipShape(RoundedRectangle(cornerRadius: 12))
  }
}

#Preview {
  ErrorStateView(
    message: "Failed to load projects. Please check your connection and try again.",
    onRetry: {}
  )
  .padding()
  .background(Color.expoSystemBackground)
}
