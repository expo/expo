//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import UIKit

struct AccountSheet: View {
  var body: some View {
#if targetEnvironment(simulator)
    SimulatorAccountView()
#else
    DeviceAccountView()
#endif
  }
}

struct AccountSelectorView: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject var viewModel: HomeViewModel

  var body: some View {
    VStack(spacing: 0) {
      ScrollView {
        VStack(spacing: 16) {
          if let userData = viewModel.user, !userData.accounts.isEmpty {
            VStack(spacing: 0) {
              ForEach(Array(userData.accounts.enumerated()), id: \.element.id) { index, account in
                accountRow(account: account)
                if index < userData.accounts.count - 1 {
                  Divider()
                }
              }
            }
            .cornerRadius(12)
          }
        }
        .padding(.top, 8)
      }
      .frame(maxHeight: .infinity)

      Button {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        viewModel.signOut()
        dismiss()
      } label: {
        Text("Log out")
          .font(.headline)
          .fontWeight(.bold)
          .foregroundColor(.white)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 12)
      }
      .background(Color.black)
      .cornerRadius(12)
    }
  }

  private func accountRow(account: Account) -> some View {
    HStack(spacing: 12) {
      AvatarView(account: account, size: 40)

      VStack(alignment: .leading, spacing: 2) {
        Text(account.name)
          .font(.headline)
          .foregroundColor(.primary)
          .multilineTextAlignment(.leading)
      }

      Spacer()

      if viewModel.selectedAccountId == account.id {
        Image(systemName: "checkmark.circle.fill")
          .font(.system(size: 16, weight: .medium))
          .foregroundColor(.green)
      }
    }
    .padding(.horizontal, 16)
    .padding(.vertical, 12)
    .background(Color.expoSystemBackground)
    .contentShape(Rectangle())
    .onTapGesture {
      UIImpactFeedbackGenerator(style: .light).impactOccurred()
      viewModel.selectAccount(accountId: account.id)
    }
    .accessibilityAddTraits(.isButton)
  }
}
