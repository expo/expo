// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct ExpiredSessionRow: View {
  let username: String
  let isPartner: Bool
  let onTap: () -> Void
  let onSignOut: () -> Void

  var body: some View {
    Button(action: onTap) {
      HStack(spacing: 8) {
        Image(systemName: "person.crop.circle.badge.exclamationmark")
          .font(.system(size: 24))
          .foregroundStyle(.secondary)
          .frame(width: 32, height: 32)

        VStack(alignment: .leading, spacing: 2) {
          Text(username)
            .font(.subheadline.weight(.medium))
            .foregroundStyle(.primary)
          Text(isPartner ? "Session expired. Scan the project's QR code again to sign in." : "Session expired")
            .font(.footnote)
            .foregroundStyle(.secondary)
        }

        Spacer(minLength: 8)
      }
      .padding(8)
      .contentShape(.rect)
    }
    .buttonStyle(.plain)
    .disabled(isPartner)
    .contextMenu {
      Button(role: .destructive, action: onSignOut) {
        Label("Log out of \(username)", systemImage: "rectangle.portrait.and.arrow.right")
      }
    }
  }
}
