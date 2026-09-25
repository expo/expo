//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import UIKit

struct DeviceAccountView: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject var viewModel: HomeViewModel
  @StateObject private var loginViewModel: LoginViewModel
  @State private var isAddingAccount: Bool
  private let onSignedIn: (() -> Void)?

  init(prefilledUsername: String? = nil, onSignedIn: (() -> Void)? = nil) {
    let loginViewModel = LoginViewModel()
    if let prefilledUsername {
      loginViewModel.username = prefilledUsername
    }
    _loginViewModel = StateObject(wrappedValue: loginViewModel)
    _isAddingAccount = State(initialValue: prefilledUsername != nil)
    self.onSignedIn = onSignedIn
  }

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
                finishSignIn(await viewModel.ssoLogin())
              },
              onSignUp: {
                finishSignIn(await viewModel.signUp())
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
    if isAddingAccount && onSignedIn == nil {
      isAddingAccount = false
    } else {
      dismiss()
    }
  }

  private func handleLoginSuccess(_ sessionSecret: String) async {
    let signedIn = await viewModel.completeLogin(with: sessionSecret)
    loginViewModel.resetToCredentials()
    finishSignIn(signedIn)
  }

  private func finishSignIn(_ signedIn: Bool) {
    isAddingAccount = false
    if signedIn {
      onSignedIn?()
    }
  }
}
