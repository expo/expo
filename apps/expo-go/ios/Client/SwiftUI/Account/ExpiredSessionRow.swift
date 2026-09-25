// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct ExpiredSessionRow: View {
  let username: String
  let isPartner: Bool
  let onTap: () -> Void

  var body: some View {
    Button(action: onTap) {
      HStack(spacing: 12) {
        Image(systemName: "person.crop.circle.badge.exclamationmark")
          .font(.system(size: 24))
          .foregroundStyle(.secondary)
          .frame(width: 32, height: 32)

        VStack(alignment: .leading, spacing: 2) {
          HStack(spacing: 6) {
            Text(username)
              .font(.headline)
              .foregroundStyle(.primary)
            if isPartner {
              PartnerBadge()
            }
          }
          Text(isPartner ? "Session expired. Scan the project's QR code again to sign in." : "Session expired")
            .font(.subheadline)
            .foregroundStyle(.secondary)
        }

        Spacer()
      }
      .padding(.horizontal, 16)
      .padding(.vertical, 12)
      .background(Color.expoSystemBackground)
      .contentShape(.rect)
    }
    .buttonStyle(.plain)
    .disabled(isPartner)
  }
}
