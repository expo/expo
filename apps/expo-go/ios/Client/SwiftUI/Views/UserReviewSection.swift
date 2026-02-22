//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct UserReviewSection: View {
  @ObservedObject var reviewManager: UserReviewManager
  let onProvideFeedback: () -> Void
  @Environment(\.colorScheme) private var colorScheme

  var body: some View {
    let isDark = colorScheme == .dark
    let buttonBackground = isDark ? Color.white : Color.black
    let buttonForeground = isDark ? Color.black : Color.white

    VStack(alignment: .leading, spacing: 12) {
      HStack(alignment: .center) {
        Text("Enjoying Expo Go?")
          .font(.headline)

        Spacer()

        Button {
          reviewManager.dismissReviewSection()
        } label: {
          Image(systemName: "xmark")
            .font(.system(size: 12, weight: .semibold))
            .foregroundColor(.secondary)
            .frame(width: 24, height: 24)
        }
      }

      Text("Whether you love the app or feel we could be doing better, let us know! Your feedback will help us improve.")
        .font(.subheadline)
        .foregroundColor(.secondary)

      HStack(spacing: 10) {
        Button {
          reviewManager.provideFeedback()
          onProvideFeedback()
        } label: {
          Text("Not really")
            .font(.subheadline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(buttonBackground)
            .foregroundColor(buttonForeground)
            .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
        }
        .buttonStyle(PlainButtonStyle())

        Button {
          reviewManager.requestReview()
        } label: {
          Text("Love it!")
            .font(.subheadline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(buttonBackground)
            .foregroundColor(buttonForeground)
            .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
        }
        .buttonStyle(PlainButtonStyle())
      }
    }
    .padding()
    .background(Color.expoSecondarySystemBackground)
    .overlay(
      RoundedRectangle(cornerRadius: BorderRadius.large)
        .stroke(Color.expoSystemGray4.opacity(0.6), lineWidth: 0.5)
    )
    .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
  }
}
