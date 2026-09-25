// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct AccountSwitcherRow: View {
  let row: AccountSwitcherRowModel
  let username: String
  let isPartner: Bool
  let onTap: () -> Void
  let onSignOut: () -> Void

  var body: some View {
    Button(action: onTap) {
      HStack(spacing: 8) {
        AvatarView(account: row.account, size: 32)
          .overlay(alignment: .bottomTrailing) {
            if isPartner {
              PartnerBadge()
                .offset(x: 4)
            }
          }

        Text(row.account.name)
          .font(.subheadline.weight(.medium))
          .foregroundStyle(.primary)
          .lineLimit(1)

        Spacer(minLength: 8)

        Image(systemName: "checkmark")
          .font(.system(size: 13, weight: .semibold))
          .foregroundStyle(.secondary)
          .frame(width: 16, height: 16)
          .opacity(row.isSelected ? 1 : 0)
      }
      .padding(8)
      .background(row.isSelected ? Color.expoSystemGray6 : .clear, in: .rect(cornerRadius: 16))
      .contentShape(.rect)
    }
    .buttonStyle(.plain)
    .accessibilityAddTraits(row.isSelected ? .isSelected : [])
    .contextMenu {
      Button(role: .destructive, action: onSignOut) {
        Label("Log out of \(username)", systemImage: "rectangle.portrait.and.arrow.right")
      }
    }
  }
}
