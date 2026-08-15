//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct ErrorView: View {
  let error: APIError
  let title: String
  let onRetry: () -> Void
  let onDismiss: (() -> Void)?

  init(
    error: APIError,
    title: String = "Error Loading Data",
    onRetry: @escaping () -> Void,
    onDismiss: (() -> Void)? = nil
  ) {
    self.error = error
    self.title = title
    self.onRetry = onRetry
    self.onDismiss = onDismiss
  }

  var body: some View {
    VStack(spacing: 0) {
      VStack(alignment: .leading, spacing: 12) {
        HStack {
          Image(systemName: "exclamationmark.triangle.fill")
            .font(.title)
            .foregroundColor(.orange)

          Spacer()

          if let onDismiss = onDismiss {
            Button {
              onDismiss()
            } label: {
              Image(systemName: "xmark.circle.fill")
                .font(.title2)
                .foregroundColor(.secondary)
            }
          }
        }

        Text(title)
          .font(.title2)
          .fontWeight(.bold)
          .multilineTextAlignment(.leading)

        Text(error.localizedDescription)
          .font(.body)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.leading)
      }
      .padding(.horizontal, 20)
      .padding(.top, 20)
      .frame(maxWidth: .infinity, alignment: .leading)

      Spacer()

      VStack(spacing: 12) {
        Button {
          onRetry()
        } label: {
          HStack {
            Image(systemName: "arrow.clockwise")
            Text("Try Again")
          }
          .font(.headline)
          .foregroundColor(.white)
          .frame(maxWidth: .infinity)
          .padding()
          .background(Color.black)
          .cornerRadius(8)
        }

        if let onDismiss = onDismiss {
          Button {
            onDismiss()
          } label: {
            Text("Dismiss")
              .font(.headline)
              .foregroundColor(.black)
              .frame(maxWidth: .infinity)
              .padding()
              .background(Color.expoSystemGray5)
              .cornerRadius(8)
          }
        }
      }
      .padding(.horizontal, 20)
      .padding(.bottom, 20)
    }
    .background(Color.expoSystemBackground)
  }
}
