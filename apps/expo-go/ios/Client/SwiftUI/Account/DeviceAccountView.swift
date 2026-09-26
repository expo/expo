//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import UIKit

struct DeviceAccountView: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject var viewModel: HomeViewModel
  @StateObject private var loginViewModel = LoginViewModel()
  @State private var isAddingAccount = false

  private var showsLogin: Bool {
    !viewModel.hasStoredSessions || isAddingAccount
  }

  var body: some View {
    NavigationStack {
      ZStack {
        if !showsLogin {
          AccountSwitcherView(onAddAccount: startAddingAccount)
            .ignoresSafeArea(.keyboard)
            .transition(.opacity)
        } else {
          ScrollView {
            LoginView(
              loginViewModel: loginViewModel,
              onLoginSuccess: handleLoginSuccess,
              onSSO: {
                await viewModel.ssoLogin()
                isAddingAccount = false
              },
              onSignUp: {
                await viewModel.signUp()
                isAddingAccount = false
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
      .toolbar(showsLogin ? .visible : .hidden, for: .navigationBar)
      .toolbar {
        ToolbarItem(placement: .topBarLeading) {
          Button(action: close) {
            Image(systemName: "xmark")
              .font(.system(size: 16, weight: .medium))
              .foregroundColor(.primary)
          }
        }
      }
      .navigationDestination(isPresented: Binding(
        get: { loginViewModel.phase == .twoFactor && showsLogin },
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
    .animation(.default, value: showsLogin)
    .presentationDetents(showsLogin ? [.large] : [.medium, .large])
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.expoSystemBackground)
  }

  private func startAddingAccount() {
    isAddingAccount = true
  }

  private func close() {
    if isAddingAccount {
      isAddingAccount = false
    } else {
      dismiss()
    }
  }

  private func handleLoginSuccess(_ sessionSecret: String) async {
    await viewModel.completeLogin(with: sessionSecret)
    loginViewModel.resetToCredentials()
    isAddingAccount = false
  }
}
