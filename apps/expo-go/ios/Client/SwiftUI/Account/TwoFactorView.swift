//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct TwoFactorView: View {
  @ObservedObject var loginViewModel: LoginViewModel
  let onVerifySuccess: (String) async -> Void

  @FocusState private var isCodeFocused: Bool

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      Text("Open your two-factor authentication app to view your one-time password.")
        .font(.system(size: 16))
        .foregroundColor(.secondary)

      VStack(alignment: .leading, spacing: 6) {
        Text("One-time password")
          .font(.callout)
          .fontWeight(.medium)

        otpInputField
      }

      if let error = loginViewModel.errorMessage {
        ErrorBanner(message: error)
      }

      verifyButton

      VStack(alignment: .leading, spacing: 4) {
        Text("Lost access to your 2FA device?")
          .font(.callout)
          .foregroundColor(.secondary)

        NavigationLink {
          ScrollView {
            RecoveryCodeView(
              loginViewModel: loginViewModel,
              onVerifySuccess: onVerifySuccess
            )
            .padding(.horizontal, 16)
            .padding(.top, 16)
          }
          .navigationTitle("Recovery code")
        } label: {
          Text("Enter a recovery code.")
            .font(.callout)
            .foregroundColor(.accentColor)
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
      }
    }
    .onAppear {
      loginViewModel.isUsingRecoveryCode = false
      loginViewModel.otpCode = ""
      loginViewModel.errorMessage = nil
      isCodeFocused = true
    }
  }

  private var otpInputField: some View {
    ZStack {
      TextField("", text: $loginViewModel.otpCode)
        .keyboardType(.numberPad)
        .textContentType(.oneTimeCode)
        .focused($isCodeFocused)
        .foregroundColor(.clear)
        .tint(.clear)
        .onChange(of: loginViewModel.otpCode) { newValue in
          let filtered = String(newValue.filter { $0.isNumber }.prefix(6))
          if filtered != newValue {
            loginViewModel.otpCode = filtered
          }
          if filtered.count == 6 {
            Task {
              if let secret = await loginViewModel.submitOTP() {
                await onVerifySuccess(secret)
              }
            }
          }
        }

      HStack(spacing: 0) {
        digitGroup(startIndex: 0)

        Text("-")
          .font(.title2)
          .fontWeight(.medium)
          .foregroundColor(.secondary)
          .padding(.horizontal, 8)

        digitGroup(startIndex: 3)
      }
      .allowsHitTesting(false)
    }
  }

  private func digitGroup(startIndex: Int) -> some View {
    HStack(spacing: 6) {
      ForEach(startIndex..<startIndex + 3, id: \.self) { index in
        digitBox(at: index)
      }
    }
  }

  private func digitBox(at index: Int) -> some View {
    let chars = Array(loginViewModel.otpCode)
    let hasDigit = index < chars.count
    let isActive = index == chars.count && isCodeFocused

    return Text(hasDigit ? String(chars[index]) : "")
      .font(.title2)
      .fontWeight(.medium)
      .frame(maxWidth: .infinity)
      .frame(height: 48)
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
      .overlay(
        RoundedRectangle(cornerRadius: BorderRadius.medium)
          .stroke(isActive ? Color.primary.opacity(0.5) : Color.clear, lineWidth: 1.5)
      )
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
