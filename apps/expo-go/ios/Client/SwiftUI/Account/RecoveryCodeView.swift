//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct RecoveryCodeView: View {
  @ObservedObject var loginViewModel: LoginViewModel
  let onVerifySuccess: (String) async -> Void

  @FocusState private var isCodeFocused: Bool

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      Text("Enter one of your recovery codes to regain access to your account.")
        .font(.system(size: 16))
        .foregroundColor(.secondary)

      VStack(alignment: .leading, spacing: 6) {
        Text("Recovery code")
          .font(.callout)
          .fontWeight(.medium)

        TextField("", text: $loginViewModel.otpCode)
          .textInputAutocapitalization(.never)
          .disableAutocorrection(true)
          .focused($isCodeFocused)
          .padding()
          .background(Color.expoSecondarySystemBackground)
          .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
          .onSubmit {
            if loginViewModel.canSubmitOTP {
              Task {
                if let secret = await loginViewModel.submitOTP() {
                  await onVerifySuccess(secret)
                }
              }
            }
          }
          .submitLabel(.go)
      }

      if let error = loginViewModel.errorMessage {
        ErrorBanner(message: error)
      }

      verifyButton
    }
    .onAppear {
      loginViewModel.isUsingRecoveryCode = true
      loginViewModel.otpCode = ""
      loginViewModel.errorMessage = nil
      isCodeFocused = true
    }
  }

  private var verifyButton: some View {
    Button {
      UIImpactFeedbackGenerator(style: .light).impactOccurred()
      Task {
        if let secret = await loginViewModel.submitOTP() {
          await onVerifySuccess(secret)
        }
      }
    } label: {
      Text("Verify")
        .font(.headline)
        .fontWeight(.semibold)
        .foregroundColor(.white)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .overlay(alignment: .leading) {
          if loginViewModel.isLoading {
            ProgressView()
              .tint(.white)
              .scaleEffect(0.8)
              .padding(.leading, 16)
          }
        }
    }
    .background(!loginViewModel.canSubmitOTP || loginViewModel.isLoading ? Color.gray.opacity(0.3) : Color.black)
    .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
    .disabled(!loginViewModel.canSubmitOTP || loginViewModel.isLoading)
  }
}
