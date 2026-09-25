// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct AccountSwitcherRow: View {
  let row: AccountSwitcherRowModel
  let username: String?
  let isPartner: Bool
  let onTap: () -> Void

  var body: some View {
    Button(action: onTap) {
      HStack(spacing: 12) {
        AvatarView(account: row.account, size: 32)

        Text(row.account.name)
          .font(.headline)
          .foregroundStyle(.primary)

        if let username {
          Text("(\(username))")
            .font(.subheadline)
            .foregroundStyle(.secondary)
        }

        if isPartner {
          PartnerBadge()
        }

        Spacer()

        if row.isSelected {
          Image(systemName: "checkmark.circle.fill")
            .font(.system(size: 16, weight: .medium))
            .foregroundStyle(.green)
        }
      }
      .lineLimit(1)
      .padding(.horizontal, 16)
      .padding(.vertical, 12)
      .background(Color.expoSystemBackground)
      .contentShape(.rect)
    }
    .buttonStyle(.plain)
    .accessibilityAddTraits(row.isSelected ? .isSelected : [])
  }
}
