//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI

struct SettingsTabView: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @State private var allowAnalytics = false

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
}
