//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import SafariServices

struct LoginView: View {
  @ObservedObject var loginViewModel: LoginViewModel
  let onLoginSuccess: (String) async -> Void
  let onSSO: () async -> Void
  let onSignUp: () async -> Void

  @FocusState private var focusedField: Field?
  @State private var isPasswordVisible = false
  @State private var safariURL: URL?
  private enum Field {
    case username, password
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      usernameField
      passwordField

      if let error = loginViewModel.errorMessage {
        ErrorBanner(message: error)
      }

      loginButton

      divider

      ssoButton
      signUpButton
    }
    .onAppear {
      focusedField = .username
    }
    .sheet(item: $safariURL) { url in
      SafariView(url: url)
        .ignoresSafeArea()
    }
  }

  private var usernameField: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text("Email or username")
        .font(.callout)
        .fontWeight(.medium)

      TextField("", text: $loginViewModel.username)
        .keyboardType(.emailAddress)
        .textInputAutocapitalization(.never)
        .textContentType(.username)
        .disableAutocorrection(true)
        .focused($focusedField, equals: .username)
        .padding()
        .background(Color.expoSecondarySystemBackground)
        .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
        .onSubmit { focusedField = .password }
        .submitLabel(.next)
    }
  }

  private var passwordField: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack {
        Text("Password")
          .font(.callout)
          .fontWeight(.medium)

        Spacer()

        Button("Forgot password?") {
          safariURL = URL(string: "https://expo.dev/reset-password")
        }
        .font(.callout)
        .foregroundColor(.accentColor)
      }

      ZStack(alignment: .trailing) {
        Group {
          if isPasswordVisible {
            TextField("", text: $loginViewModel.password)
              .textContentType(.password)
          } else {
            SecureField("", text: $loginViewModel.password)
              .textContentType(.password)
          }
        }
        .focused($focusedField, equals: .password)
        .padding()
        .padding(.trailing, 36)
        .onSubmit {
          if loginViewModel.canSubmitLogin {
            Task {
              if let secret = await loginViewModel.submitLogin() {
                await onLoginSuccess(secret)
              }
            }
          }
        }
        .submitLabel(.go)

        Button {
          isPasswordVisible.toggle()
        } label: {
          Image(systemName: isPasswordVisible ? "eye.slash" : "eye")
            .foregroundColor(.secondary)
            .frame(width: 44, height: 44)
        }
        .padding(.trailing, 4)
      }
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
    }
  }

  private var loginButton: some View {
    Button {
      UIImpactFeedbackGenerator(style: .light).impactOccurred()
      Task {
        if let secret = await loginViewModel.submitLogin() {
          await onLoginSuccess(secret)
        }
      }
    } label: {
      Text("Log in")
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
    .background(!loginViewModel.canSubmitLogin || loginViewModel.isLoading ? Color.gray.opacity(0.3) : Color.black)
    .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
    .disabled(!loginViewModel.canSubmitLogin || loginViewModel.isLoading)
  }

  private var divider: some View {
    HStack {
      Rectangle()
        .fill(Color.expoSystemGray4)
        .frame(height: 1)
      Text("or")
        .font(.callout)
        .foregroundColor(.secondary)
      Rectangle()
        .fill(Color.expoSystemGray4)
        .frame(height: 1)
    }
  }

  private var ssoButton: some View {
    Button {
      UIImpactFeedbackGenerator(style: .light).impactOccurred()
      Task { await onSSO() }
    } label: {
      HStack {
        Text("Continue with SSO")
          .font(.headline)
          .fontWeight(.semibold)
        Spacer()
        Image(systemName: "arrow.right")
      }
      .foregroundColor(.primary.opacity(0.7))
      .frame(maxWidth: .infinity)
      .padding(.vertical, 12)
      .padding(.horizontal, 16)
    }
    .background(Color.expoSecondarySystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
    .disabled(loginViewModel.isLoading)
  }

  private var signUpButton: some View {
    Button {
      UIImpactFeedbackGenerator(style: .light).impactOccurred()
      Task { await onSignUp() }
    } label: {
      HStack {
        Text("New to Expo? Sign up")
          .font(.headline)
          .fontWeight(.semibold)
        Spacer()
        Image(systemName: "arrow.right")
      }
      .foregroundColor(.primary.opacity(0.7))
      .frame(maxWidth: .infinity)
      .padding(.vertical, 12)
      .padding(.horizontal, 16)
    }
    .background(Color.expoSecondarySystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
    .disabled(loginViewModel.isLoading)
  }
}

extension URL: @retroactive Identifiable {
  public var id: String { absoluteString }
}

struct SafariView: UIViewControllerRepresentable {
  let url: URL

  func makeUIViewController(context: Context) -> SFSafariViewController {
    SFSafariViewController(url: url)
  }

  func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}
