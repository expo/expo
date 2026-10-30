// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct AccountSwitcherSectionView: View {
  let section: AccountSwitcherSection
  let showsHeader: Bool
  let onSelect: (AccountSwitcherRowModel) -> Void
  let onReauthenticate: () -> Void
  let onSignOut: () -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      if showsHeader {
        Text(section.username)
          .font(.footnote.weight(.medium))
          .foregroundStyle(.secondary)
          .padding(.horizontal, 8)
      }

      if section.isExpired {
        ExpiredSessionRow(
          username: section.username,
          isPartner: section.isPartner,
          onTap: onReauthenticate,
          onSignOut: onSignOut
        )
      } else {
        ForEach(section.rows) { row in
          AccountSwitcherRow(
            row: row,
            username: section.username,
            isPartner: section.isPartner,
            onTap: { onSelect(row) },
            onSignOut: onSignOut
          )
        }
      }
    }
  }
}
