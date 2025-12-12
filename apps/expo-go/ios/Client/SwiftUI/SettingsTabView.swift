//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import AuthenticationServices

struct SettingsTabView: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @State private var allowAnalytics = false
  @State private var isDeleting = false
  @State private var deletionError: String?
  @State private var context: AuthPresentationContextProvider?

  var body: some View {
    ScrollView {
      VStack(spacing: 24) {
        VStack(alignment: .leading, spacing: 16) {
          Text("Theme")
            .font(.headline)
            .foregroundColor(.primary)

          VStack(spacing: 0) {
            ThemeOption(
              icon: "circle.lefthalf.filled.righthalf.striped.horizontal",
              title: "Automatic",
              isSelected: viewModel.selectedTheme == 0,
              action: { viewModel.updateTheme(0) }
            )
            Divider()
            ThemeOption(
              icon: "sun.max",
              title: "Light",
              isSelected: viewModel.selectedTheme == 1,
              action: { viewModel.updateTheme(1) }
            )
            Divider()
            ThemeOption(
              icon: "moon",
              title: "Dark",
              isSelected: viewModel.selectedTheme == 2,
              action: { viewModel.updateTheme(2) }
            )
          }
          .background(Color.expoSecondarySystemBackground)
          .clipShape(RoundedRectangle(cornerRadius: 12))

          Text("Automatic is only supported on operating systems that allow you to control the system-wide color scheme.")
            .font(.caption)
            .foregroundColor(.secondary)
        }

        VStack(alignment: .leading, spacing: 16) {
          Text("Developer Menu Gestures")
            .font(.headline)
            .foregroundColor(.primary)

          VStack(spacing: 0) {
            GestureOption(
              imageName: "shake-device",
              title: "Shake device",
              isEnabled: viewModel.shakeToShowDevMenu,
              action: { viewModel.updateShakeGesture(!viewModel.shakeToShowDevMenu) }
            )
            Divider()
            GestureOption(
              imageName: "three-finger-long-press",
              title: "Three-finger long press",
              isEnabled: viewModel.threeFingerLongPressEnabled,
              action: { viewModel.updateThreeFingerGesture(!viewModel.threeFingerLongPressEnabled) }
            )
          }
          .background(Color.expoSecondarySystemBackground)
          .clipShape(RoundedRectangle(cornerRadius: 12))

          Text("Selected gestures will toggle the developer menu while inside an experience. The menu allows you to reload or return to home in a published experience, and exposes developer tools in development mode.")
            .font(.caption)
            .foregroundColor(.secondary)
        }

        VStack(alignment: .leading, spacing: 16) {
          Text("Tracking")
            .font(.headline)
            .foregroundColor(.primary)

          VStack(spacing: 0) {
            Button {
              allowAnalytics.toggle()
            } label: {
              HStack {
                Text("Allow access to app-related data for tracking")
                  .font(.body)
                  .foregroundColor(.primary)
                  .multilineTextAlignment(.leading)

                Spacer()

                if allowAnalytics {
                  Image(systemName: "checkmark")
                    .foregroundColor(.expoBlue)
                }
              }
              .padding()
            }
            .buttonStyle(PlainButtonStyle())
          }
          .background(Color.expoSecondarySystemBackground)
          .clipShape(RoundedRectangle(cornerRadius: 12))

          if let destination = URL(string: "https://expo.dev/privacy") {
            Link("Learn more about what data Expo collects and why.", destination: destination)
              .font(.caption)
              .foregroundColor(.expoBlue)
          }
        }
        VStack(alignment: .leading, spacing: 16) {
          Text("App Info")
            .font(.headline)
            .foregroundColor(.primary)

          VStack(spacing: 0) {
            AppInfoRow(label: "Client Version", value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown")
            Divider()
            AppInfoRow(label: "Supported SDK", value: getExpoSDKVersion())
          }
          .background(Color.expoSecondarySystemBackground)
          .clipShape(RoundedRectangle(cornerRadius: 12))

          Button("Copy Build Info") {
            copyBuildInfoToClipboard()
          }
          .frame(maxWidth: .infinity)
          .padding()
          .background(Color(.secondarySystemBackground))
          .foregroundColor(.primary)
          .clipShape(RoundedRectangle(cornerRadius: 12))
        }

        if viewModel.isAuthenticated {
          VStack(alignment: .leading, spacing: 16) {
            Text("Delete Account")
              .font(.headline)
              .foregroundColor(.primary)

            VStack(alignment: .leading, spacing: 12) {
              HStack(spacing: 12) {
                Image(systemName: "trash")
                  .font(.title2)
                  .foregroundColor(.red)

                Text("Delete your account")
                  .font(.headline)
                  .foregroundColor(.primary)
              }

              Text("This action is irreversible. It will delete your personal account, projects, and activity.")
                .font(.body)
                .foregroundColor(.secondary)

              if let error = deletionError {
                Text(error)
                  .font(.body)
                  .foregroundColor(.white)
                  .padding()
                  .frame(maxWidth: .infinity)
                  .background(Color.red)
                  .clipShape(RoundedRectangle(cornerRadius: 8))
              }

              Button {
                handleDeleteAccount()
              } label: {
                Text(isDeleting ? "Deleting..." : "Delete Account")
                  .font(.body)
                  .fontWeight(.medium)
                  .foregroundColor(.red)
                  .frame(maxWidth: .infinity)
                  .padding()
                  .background(Color.red.opacity(0.1))
                  .clipShape(RoundedRectangle(cornerRadius: 8))
              }
              .buttonStyle(PlainButtonStyle())
              .disabled(isDeleting)
            }
            .padding()
            .background(Color.expoSecondarySystemBackground)
            .clipShape(RoundedRectangle(cornerRadius: 12))
          }
        }
      }
      .padding()
    }
    .background(Color.expoSystemBackground)
    .navigationTitle("Settings")
    .navigationBarTitleDisplayMode(.inline)
  }

  private func getExpoSDKVersion() -> String {
    return "54.0.0"
  }

  private func getExpoRuntimeVersion() -> String {
    return Bundle.main.infoDictionary?["EXExpoRuntimeVersion"] as? String ?? "1.0.0"
  }

  private func copyBuildInfoToClipboard() {
    let buildInfo = """
    Client Version: \(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown")
    Supported SDK: \(getExpoSDKVersion())
    """

    UIPasteboard.general.string = buildInfo
  }

  private func handleDeleteAccount() {
    guard !isDeleting else { return }

    deletionError = nil
    isDeleting = true

    let redirectBase = "expauth://after-delete"
    let websiteOrigin = "https://expo.dev"
    guard let encodedRedirect = redirectBase.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
          let url = URL(string: "\(websiteOrigin)/settings/delete-user-expo-go?post_delete_redirect_uri=\(encodedRedirect)") else {
      deletionError = "Failed to create delete account URL"
      isDeleting = false
      return
    }

    let session = ASWebAuthenticationSession(url: url, callbackURLScheme: "expauth") { [self] callbackURL, error in
      isDeleting = false

      if let error {
        if case ASWebAuthenticationSessionError.canceledLogin = error {
          return
        }
        deletionError = error.localizedDescription
        return
      }

      if callbackURL != nil {
        viewModel.signOut()
      }
    }

    session.presentationContextProvider = context
    session.prefersEphemeralWebBrowserSession = false
    session.start()
  }
}

private class AuthPresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    let window = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }
    return window ?? ASPresentationAnchor()
  }
}
