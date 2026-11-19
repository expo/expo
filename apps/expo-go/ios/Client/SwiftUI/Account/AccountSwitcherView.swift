// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import UIKit

struct AccountSwitcherView: View {
  @EnvironmentObject var viewModel: HomeViewModel
  let onAddAccount: () -> Void
  @State private var sessionPendingSignOut: AccountSwitcherSection?

  var body: some View {
    let sections = viewModel.accountSwitcherSections

    VStack(spacing: 8) {
      Text("Accounts")
        .font(.title3.weight(.semibold))
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)

      ScrollView {
        VStack(alignment: .leading, spacing: 16) {
          ForEach(sections) { section in
            AccountSwitcherSectionView(
              section: section,
              showsHeader: sections.count > 1,
              onSelect: select,
              onReauthenticate: addAccount,
              onSignOut: { sessionPendingSignOut = section }
            )
          }
        }
      }

      Button(action: addAccount) {
        HStack(spacing: 8) {
          Image(systemName: "plus")
            .font(.system(size: 14, weight: .semibold))
            .frame(width: 24, height: 24)
          Text("Add account")
            .font(.subheadline.weight(.semibold))
        }
        .foregroundStyle(.secondary)
        .padding(8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .contentShape(.rect)
      }
      .buttonStyle(.plain)
    }
    .padding(16)
    .confirmationDialog(
      "Log out of \(sessionPendingSignOut?.username ?? "")?",
      isPresented: Binding(
        get: { sessionPendingSignOut != nil },
        set: { if !$0 { sessionPendingSignOut = nil } }
      ),
      titleVisibility: .visible,
      presenting: sessionPendingSignOut
    ) { section in
      Button("Log out", role: .destructive) {
        viewModel.signOut(sessionId: section.sessionId)
      }
    }
  }

  private func select(_ row: AccountSwitcherRowModel) {
    UIImpactFeedbackGenerator(style: .light).impactOccurred()
    Task {
      await viewModel.selectAccount(accountId: row.account.id, sessionId: row.sessionId)
    }
  }

  private func addAccount() {
    UIImpactFeedbackGenerator(style: .light).impactOccurred()
    onAddAccount()
  }
}
