//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct EmptyStateView: View {
  let icon: String?
  let message: String
  let description: String?
  let actionTitle: String?
  let action: (() -> Void)?

  init(
    icon: String? = nil,
    message: String,
    description: String? = nil,
    actionTitle: String? = nil,
    action: (() -> Void)? = nil
  ) {
    self.icon = icon
    self.message = message
    self.description = description
    self.actionTitle = actionTitle
    self.action = action
  }

  var body: some View {
    VStack(spacing: 16) {
      if let icon = icon {
        Image(systemName: icon)
          .font(.system(size: 48))
          .foregroundColor(.secondary.opacity(0.5))
      }

      VStack(spacing: 8) {
        Text(message)
          .font(.headline)
          .foregroundColor(.primary)
          .multilineTextAlignment(.center)

        if let description = description {
          Text(description)
            .font(.subheadline)
            .foregroundColor(.secondary)
            .multilineTextAlignment(.center)
        }
      }

      if let actionTitle = actionTitle, let action = action {
        Button {
          action()
        } label: {
          Text(actionTitle)
            .font(.subheadline)
            .fontWeight(.medium)
            .foregroundColor(.expoBlue)
        }
      }
    }
    .padding(24)
    .frame(maxWidth: .infinity)
    .background(Color.expoSecondarySystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: 12))
  }
}
