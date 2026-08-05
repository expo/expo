//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import UIKit

struct DeviceAccountView: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject var viewModel: HomeViewModel
  @StateObject private var loginViewModel = LoginViewModel()

  var body: some View {
    NavigationStack {
      ZStack {
        if viewModel.isAuthenticated {
          AccountSelectorView()
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
}
