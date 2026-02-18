// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct LocalNetworkPermissionView: View {
  @ObservedObject var viewModel: DevLauncherViewModel
  let onContinue: () -> Void
  let width = UIScreen.main.bounds.width

  @State private var hasRequestedPermission = false
  @State private var isCheckingAccess = false
  @State private var showNoAccessMessage = false
  @State private var showTryAgainFailedAlert = false
  @State private var showAlreadyGrantedAlert = false

  private var isDenied: Bool {
    viewModel.permissionStatus == .denied
  }

  var body: some View {
    VStack(spacing: 0) {
      Spacer()

      VStack(spacing: 24) {
        Text("Finding Dev Servers")
          .font(.title)
          .fontWeight(.bold)

        Image("sandbox", bundle: getDevLauncherBundle())
          .resizable()
          .scaledToFit()
          .frame(width: width * 0.9)
          .clipShape(RoundedRectangle(cornerRadius: 12))
          .overlay(
            RoundedRectangle(cornerRadius: 12)
              .stroke(Color.secondary.opacity(0.3), lineWidth: 1)
          )

        Text("Expo Dev Launcher needs to access your local network to discover development servers running on your computer.")
          .font(.body)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.center)
      }

      Spacer()

      VStack(spacing: 12) {
        if !hasRequestedPermission {
          continueButton
        } else if isDenied || showNoAccessMessage {
          noAccessButtons
        } else {
          postRequestButtons
        }
      }
    }
    .padding(.horizontal, 24)
    .padding(.vertical, 32)
    .background(Color.expoSystemBackground)
    .alert("Permission Not Granted", isPresented: $showTryAgainFailedAlert) {
      Button("Open Settings") {
        if let url = URL(string: UIApplication.openSettingsURLString) {
          UIApplication.shared.open(url)
        }
      }
      Button("OK", role: .cancel) {}
    } message: {
      Text("Local network access is still disabled. Enable it in Settings \u{2192} Privacy & Security \u{2192} Local Network to discover dev servers.")
    }
    .alert("Permission Already Granted", isPresented: $showAlreadyGrantedAlert) {
      Button("OK") {
        onContinue()
      }
    } message: {
      Text("Local network access is already enabled. You\u{2019}re all set!")
    }
  }

  // MARK: - Initial state

  private var continueButton: some View {
    Group {
      Button {
        viewModel.startServerDiscovery()
        hasRequestedPermission = true
      } label: {
        Text("Next")
          .fontWeight(.semibold)
          .frame(maxWidth: .infinity)
          .padding()
      }
      .background(Color.accentColor)
      .foregroundColor(.white)
      .cornerRadius(12)

      Text("When system prompt pops up, tap \u{201C}Allow\u{201D} to continue.")
        .font(.footnote)
        .foregroundColor(.secondary)
        .multilineTextAlignment(.center)
    }
  }

  private var postRequestButtons: some View {
    Group {
      Button {
        onContinue()
      } label: {
        Text("Done")
          .fontWeight(.semibold)
          .frame(maxWidth: .infinity)
          .padding()
      }
      .background(Color.accentColor)
      .foregroundColor(.white)
      .cornerRadius(12)

      checkAccessButton(label: "I was not prompted") { hasAccess in
        if hasAccess {
          showAlreadyGrantedAlert = true
        } else {
          showNoAccessMessage = true
          showTryAgainFailedAlert = true
        }
      }
    }
  }

  private var noAccessButtons: some View {
    Group {
      Text("Local network permission was not granted. Please enable it in Settings \u{2192} Privacy & Security \u{2192} Local Network.")
        .font(.footnote)
        .foregroundColor(.secondary)
        .multilineTextAlignment(.center)

      Button {
        if let url = URL(string: UIApplication.openSettingsURLString) {
          UIApplication.shared.open(url)
        }
      } label: {
        Text("Open Settings")
          .fontWeight(.semibold)
          .frame(maxWidth: .infinity)
          .padding()
      }
      .background(Color.expoSecondarySystemBackground)
      .foregroundColor(.primary)
      .cornerRadius(12)

      checkAccessButton(label: "Try Again") { hasAccess in
        if hasAccess {
          viewModel.startServerDiscovery()
          onContinue()
        } else {
          showTryAgainFailedAlert = true
        }
      }

      Button {
        onContinue()
      } label: {
        Text("Continue Anyway")
          .fontWeight(.semibold)
          .frame(maxWidth: .infinity)
          .padding()
      }
      .background(Color.expoSecondarySystemBackground)
      .foregroundColor(.secondary)
      .cornerRadius(12)
    }
  }

  private func checkAccessButton(label: String, onResult: @escaping (Bool) -> Void) -> some View {
    Button {
      isCheckingAccess = true
      viewModel.stopServerDiscovery()
      Task {
        let hasAccess = await viewModel.checkLocalNetworkAccess()
        isCheckingAccess = false
        onResult(hasAccess)
      }
    } label: {
      if isCheckingAccess {
        ProgressView()
          .frame(maxWidth: .infinity)
          .padding()
      } else {
        Text(label)
          .fontWeight(.semibold)
          .frame(maxWidth: .infinity)
          .padding()
      }
    }
    .disabled(isCheckingAccess)
    .background(Color.expoSecondarySystemBackground)
    .foregroundColor(.secondary)
    .cornerRadius(12)
  }
}

#if DEBUG
struct LocalNetworkPermissionView_Previews: PreviewProvider {
  static var previews: some View {
    LocalNetworkPermissionView(viewModel: DevLauncherViewModel(), onContinue: {})
  }
}
#endif
