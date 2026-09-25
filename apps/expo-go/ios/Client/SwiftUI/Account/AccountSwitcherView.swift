// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import UIKit

struct AccountSwitcherView: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject var viewModel: HomeViewModel
  let onAddAccount: () -> Void
  @State private var sessionPendingRemoval: AccountSwitcherSection?

  var body: some View {
    VStack(spacing: 0) {
      ScrollView {
        VStack(spacing: 16) {
          ForEach(viewModel.accountSwitcherSections) { section in
            AccountSwitcherSectionView(
              section: section,
              onSelect: select,
              onReauthenticate: addAccount,
              onRemove: { sessionPendingRemoval = section }
            )
          }

          Button(action: addAccount) {
            Label("Add account", systemImage: "plus")
              .font(.headline)
              .foregroundStyle(.secondary)
              .frame(maxWidth: .infinity, alignment: .leading)
              .padding(.horizontal, 16)
              .padding(.vertical, 12)
              .contentShape(.rect)
          }
          .buttonStyle(.plain)
        }
        .padding(.top, 8)
      }
      .frame(maxHeight: .infinity)

      Button(action: signOut) {
        Text("Log out")
          .font(.headline)
          .fontWeight(.bold)
          .foregroundStyle(.white)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 12)
      }
      .background(Color.black, in: .rect(cornerRadius: 12))
    }
    .confirmationDialog(
      "Remove \(sessionPendingRemoval?.username ?? "")?",
      isPresented: Binding(
        get: { sessionPendingRemoval != nil },
        set: { if !$0 { sessionPendingRemoval = nil } }
      ),
      titleVisibility: .visible,
      presenting: sessionPendingRemoval
    ) { section in
      Button("Remove", role: .destructive) {
        viewModel.removeSession(id: section.sessionId)
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

  private func signOut() {
    UIImpactFeedbackGenerator(style: .light).impactOccurred()
    viewModel.signOut()
    dismiss()
  }
}
