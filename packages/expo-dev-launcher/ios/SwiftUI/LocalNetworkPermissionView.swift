// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct LocalNetworkPermissionView: View {
  @ObservedObject var viewModel: DevLauncherViewModel
  let onContinue: () -> Void

  @State private var hasRequestedPermission = false
  @State private var isCheckingAccess = false
  @State private var showNoAccessMessage = false
  @State private var showTryAgainFailedAlert = false
  @State private var showAlreadyGrantedAlert = false
  @State private var showMisconfiguredAlert = false
  @State private var showCouldNotVerifyAlert = false
  @State private var couldNotVerifyMessage = ""

  private var isDenied: Bool {
    viewModel.permissionStatus == .denied
  }

  var body: some View {
    ZStack {
      Color
        .expoSystemBackground
        .ignoresSafeArea(.all)

      VStack(spacing: 24) {
        Image("radar-icon", bundle: getDevLauncherBundle())
          .resizable()
          .scaledToFit()
          .frame(width: 80, height: 80)

        Text("Finding Dev Servers")
          .font(.title)
          .fontWeight(.bold)

        Text("Expo Dev Launcher needs to access your local network to discover development servers running on your computer.")
          .font(.body)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.center)
          .fixedSize(horizontal: false, vertical: true)

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
      .padding()
      #if os(macOS)
      .frame(maxHeight: 600)
      #endif
    }
    .alert("Permission Not Granted", isPresented: $showTryAgainFailedAlert) {
      Button("Open Settings") {
        #if os(iOS)
        if let url = URL(string: UIApplication.openSettingsURLString) {
          UIApplication.shared.open(url)
        }
        #endif
      }
      Button("OK", role: .cancel) {}
    } message: {
      Text("Local network access is still disabled. To discover dev servers, enable it in Settings \u{2192} Privacy & Security \u{2192} Local Network.")
    }
    .alert("Permission Already Granted", isPresented: $showAlreadyGrantedAlert) {
      Button("OK") {
        onContinue()
      }
    } message: {
      Text("Local network access is already enabled. You're all set!")
        .multilineTextAlignment(.center)
    }
    .alert("Dev Server Discovery Isn't Set Up", isPresented: $showMisconfiguredAlert) {
      Button("OK", role: .cancel) {}
    } message: {
      Text("iOS is blocking discovery because this build's Info.plist is missing the \"_expo._tcp\" Bonjour entry. This is separate from the Local Network permission. Make sure the expo-dev-client config plugin is applied, then re-run \"npx expo prebuild --clean\" and rebuild.")
    }
    .alert("Couldn't Verify Access", isPresented: $showCouldNotVerifyAlert) {
      Button("OK", role: .cancel) {}
    } message: {
      Text(couldNotVerifyMessage)
    }
  }

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

      Text("When the system prompt pops up, tap \"Allow\" to continue.")
        .font(.footnote)
        .foregroundColor(.secondary)
        .multilineTextAlignment(.center)
        .fixedSize(horizontal: false, vertical: true)
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

      checkAccessButton(label: "I was not prompted") { verdict in
        handleCheckVerdict(verdict, onGranted: { showAlreadyGrantedAlert = true })
      }
    }
  }

  private var noAccessButtons: some View {
    Group {
      Text("Local network permission was not granted. Enable it in Settings \u{2192} Privacy & Security \u{2192} Local Network.")
        .font(.footnote)
        .foregroundColor(.secondary)
        .multilineTextAlignment(.center)
        .fixedSize(horizontal: false, vertical: true)

      Button {
        #if os(iOS)
        if let url = URL(string: UIApplication.openSettingsURLString) {
          UIApplication.shared.open(url)
        }
        #endif
      } label: {
        Text("Open Settings")
          .fontWeight(.semibold)
          .frame(maxWidth: .infinity)
          .padding()
      }
      .background(Color.expoSecondarySystemBackground)
      .foregroundColor(.primary)
      .cornerRadius(12)

      checkAccessButton(label: "Try Again") { verdict in
        handleCheckVerdict(verdict, onGranted: {
          viewModel.startServerDiscovery()
          onContinue()
        })
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

  private func handleCheckVerdict(_ verdict: LocalNetworkVerdict, onGranted: @escaping () -> Void) {
    switch verdict {
    case .granted:
      onGranted()
    case .denied:
      showNoAccessMessage = true
      showTryAgainFailedAlert = true
    case .misconfigured:
      showMisconfiguredAlert = true
    case .undetermined:
      Task {
        let hasNetwork = await viewModel.hasSatisfiedNetworkPath()
        couldNotVerifyMessage = hasNetwork
          ? "Couldn't verify local network access. If the system prompt didn't appear, make sure a dev server is running and try again. You can also check Settings \u{2192} Privacy & Security \u{2192} Local Network."
          : "No network connection. Connect to Wi-Fi and try again to discover development servers running on your computer."
        showCouldNotVerifyAlert = true
      }
    }
  }

  private func checkAccessButton(label: String, onResult: @escaping (LocalNetworkVerdict) -> Void) -> some View {
    Button {
      isCheckingAccess = true
      viewModel.stopServerDiscovery()
      Task {
        let verdict = await viewModel.checkLocalNetworkAccess()
        isCheckingAccess = false
        onResult(verdict)
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
