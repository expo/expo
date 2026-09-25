// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct AccountSwitcherSectionView: View {
  let section: AccountSwitcherSection
  let onSelect: (AccountSwitcherRowModel) -> Void
  let onReauthenticate: () -> Void
  let onRemove: () -> Void

  var body: some View {
    VStack(spacing: 0) {
      if section.isExpired {
        ExpiredSessionRow(username: section.username, isPartner: section.isPartner, onTap: onReauthenticate)
      } else {
        ForEach(section.rows) { row in
          AccountSwitcherRow(
            row: row,
            username: section.isActive ? nil : section.username,
            isPartner: section.isPartner
          ) {
            onSelect(row)
          }
          if row.id != section.rows.last?.id {
            Divider()
          }
        }
      }
    }
    .clipShape(.rect(cornerRadius: 12))
    .contextMenu {
      if !section.isActive {
        Button(role: .destructive, action: onRemove) {
          Label("Remove \(section.username)", systemImage: "person.crop.circle.badge.minus")
        }
      }
    }
  }
}
