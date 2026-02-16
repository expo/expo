//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import UIKit

struct AccountSheet: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject var viewModel: HomeViewModel
  @StateObject private var loginViewModel = LoginViewModel()

  var body: some View {
    NavigationStack {
      ZStack {
        if viewModel.isAuthenticated {
          userAccountSelector
            .ignoresSafeArea(.keyboard)
            .padding(.horizontal, 16)
            .transition(.opacity)
        } else {
          ScrollView {
            LoginView(
              loginViewModel: loginViewModel,
              onLoginSuccess: handleLoginSuccess,
              onSSO: {
                await viewModel.ssoLogin()
              },
              onSignUp: {
                await viewModel.signUp()
              }
            )
            .padding(.horizontal, 16)
            .padding(.top, 16)
          }
          .transition(.opacity)
        }
      }
      .navigationTitle("Account")
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .topBarLeading) {
          Button {
            dismiss()
          } label: {
            Image(systemName: "xmark")
              .font(.system(size: 16, weight: .medium))
              .foregroundColor(.primary)
          }
        }
      }
      .navigationDestination(isPresented: Binding(
        get: { loginViewModel.phase == .twoFactor && !viewModel.isAuthenticated },
        set: { if !$0 { loginViewModel.resetToCredentials() } }
      )) {
        ScrollView {
          TwoFactorView(
            loginViewModel: loginViewModel,
            onVerifySuccess: handleLoginSuccess
          )
          .padding(.horizontal, 16)
          .padding(.top, 16)
        }
        .navigationTitle("Two-factor authentication")
      }
    }
    .animation(.default, value: viewModel.isAuthenticated)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.expoSystemBackground)
  }

  private func handleLoginSuccess(_ sessionSecret: String) async {
    await viewModel.authService.completeLogin(with: sessionSecret)
    loginViewModel.resetToCredentials()
    if let account = viewModel.selectedAccount {
      viewModel.dataService.startPolling(accountName: account.name)
    }
  }

  private var userAccountSelector: some View {
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
