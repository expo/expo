// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

enum LocalNetworkPermissionStatus: Equatable, Sendable {
  case unknown
  case checking
  case granted
  case denied
}

struct LocalNetworkPermissionView: View {
  @ObservedObject var viewModel: DevLauncherViewModel
  let onPermissionGranted: () -> Void
  @State private var isCheckingPermission = false
  @State private var timeoutTask: Task<Void, Never>?
  @State private var hasTimedOut = false

  private var isLoading: Bool {
    isCheckingPermission || viewModel.permissionStatus == .checking
  }
  
  var body: some View {
    VStack(spacing: 0) {
      Spacer()
      
      if hasTimedOut {
        PermissionTimeoutView {
          retryPermissionCheck()
        } continueWithoutPermission: {
          continueWithoutPermission()
        }
      } else {
        switch viewModel.permissionStatus {
        case .unknown, .checking:
          RequestPermissionView(isLoading: isLoading) {
            triggerPermissionCheck()
          }
        case .granted:
          ProgressView()
        case .denied:
          PermissionsDeniedView(appName: appName) {
            openSettings()
          } continueWithoutPermission: {
            continueWithoutPermission()
          }
        }
      }
      
      Spacer()
      
      Footer()
    }
    .padding(.horizontal, 24)
    .padding(.vertical, 32)
    .background(Color(.systemBackground))
    .onDisappear {
      timeoutTask?.cancel()
      timeoutTask = nil
    }
    .onChange(of: viewModel.permissionStatus) { newStatus in
      timeoutTask?.cancel()
      timeoutTask = nil

      if newStatus == .granted {
        hasTimedOut = false
        viewModel.markPermissionFlowCompleted()
        onPermissionGranted()
      } else if newStatus == .denied {
        isCheckingPermission = false
        hasTimedOut = false
      }
    }
  }
  
  private var appName: String {
    Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String
      ?? Bundle.main.object(forInfoDictionaryKey: "CFBundleName") as? String
      ?? "this app"
  }
  
  private func triggerPermissionCheck() {
    isCheckingPermission = true
    hasTimedOut = false
    viewModel.startDiscoveryForPermissionCheck()

    timeoutTask?.cancel()
    timeoutTask = Task {
      do {
        try await Task.sleep(nanoseconds: 15_000_000_000)
        await MainActor.run {
          if viewModel.permissionStatus == .checking {
            hasTimedOut = true
            isCheckingPermission = false
            viewModel.stopServerDiscovery()
            viewModel.permissionStatus = .unknown
          }
        }
      } catch {}
    }
  }

  private func retryPermissionCheck() {
    hasTimedOut = false
    triggerPermissionCheck()
  }
  
  private func openSettings() {
    if let url = URL(string: UIApplication.openSettingsURLString) {
      UIApplication.shared.open(url)
    }
  }
  
  private func continueWithoutPermission() {
    viewModel.markPermissionFlowCompleted()
    onPermissionGranted()
  }
}

struct RequestPermissionView: View {
  let isLoading: Bool
  let triggerPermissionCheck: () -> Void

  var body: some View {
    VStack(spacing: 24) {
      Image(systemName: "wifi")
        .font(.system(size: 64))
        .foregroundColor(.accentColor)
      
      VStack(spacing: 12) {
        Text("Find Dev Servers")
          .font(.title)
          .fontWeight(.bold)
        
        Text("Expo Dev Launcher needs to access your local network to discover development servers running on your computer.")
          .font(.body)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.center)
      }
      
      VStack(spacing: 8) {
        Image(systemName: "info.circle")
          .foregroundColor(.secondary)
        Text("You'll see a system prompt asking for local network access. Tap \"Allow\" to continue.")
          .font(.footnote)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.center)
      }
      .padding()
      .background(Color(.secondarySystemBackground))
      .cornerRadius(12)
      
      Button {
        triggerPermissionCheck()
      } label: {
        if isLoading {
          ProgressView()
            .progressViewStyle(CircularProgressViewStyle(tint: .white))
            .frame(maxWidth: .infinity)
            .padding()
        } else {
          Text("Continue")
            .fontWeight(.semibold)
            .frame(maxWidth: .infinity)
            .padding()
        }
      }
      .background(Color.accentColor)
      .foregroundColor(.white)
      .cornerRadius(12)
      .disabled(isLoading)
    }
  }
}

struct PermissionsDeniedView: View {
  let appName: String
  let openSettings: () -> Void
  let continueWithoutPermission: () -> Void
  
  var body: some View {
    VStack(spacing: 24) {
      Image(systemName: "wifi.slash")
        .font(.system(size: 64))
        .foregroundColor(.orange)
      
      VStack(spacing: 12) {
        Text("Local Network Access Required")
          .font(.title)
          .fontWeight(.bold)
        
        Text("Without local network access, Dev Launcher can't find development servers on your network. You can still enter server URLs manually.")
          .font(.body)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.center)
      }
      
      VStack(spacing: 12) {
        Button {
          openSettings()
        } label: {
          HStack {
            Image(systemName: "gear")
            Text("Open Settings")
              .fontWeight(.semibold)
          }
          .frame(maxWidth: .infinity)
          .padding()
        }
        .background(Color.accentColor)
        .foregroundColor(.white)
        .cornerRadius(12)
        
        Button {
          continueWithoutPermission()
        } label: {
          Text("Continue Without Discovery")
            .fontWeight(.medium)
            .frame(maxWidth: .infinity)
            .padding()
        }
        .foregroundColor(.accentColor)
      }
      
      Text("To enable later: Settings → Privacy & Security → Local Network → \(appName)")
        .font(.caption)
        .foregroundColor(.secondary)
        .multilineTextAlignment(.center)
    }
  }
}

struct PermissionTimeoutView: View {
  let retryPermissionCheck: () -> Void
  let continueWithoutPermission: () -> Void
  
  var body: some View {
    VStack(spacing: 24) {
      Image(systemName: "exclamationmark.triangle")
        .font(.system(size: 64))
        .foregroundColor(.orange)

      VStack(spacing: 12) {
        Text("Permission Check Timed Out")
          .font(.title)
          .fontWeight(.bold)

        Text("The permission check is taking longer than expected. This might happen if you dismissed the system dialog or if there's a network issue.")
          .font(.body)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.center)
      }

      VStack(spacing: 12) {
        Button {
          retryPermissionCheck()
        }
        label: {
          HStack {
            Image(systemName: "arrow.clockwise")
            Text("Try Again")
              .fontWeight(.semibold)
          }
          .frame(maxWidth: .infinity)
          .padding()
        }
        .background(Color.accentColor)
        .foregroundColor(.white)
        .cornerRadius(12)

        Button {
          continueWithoutPermission()
        }
        label: {
          Text("Continue Without Discovery")
            .fontWeight(.medium)
            .frame(maxWidth: .infinity)
            .padding()
        }
        .foregroundColor(.accentColor)
      }

      Text("You can enable discovery later in Settings if needed.")
        .font(.caption)
        .foregroundColor(.secondary)
        .multilineTextAlignment(.center)
    }
  }
}

struct Footer: View {
  var body: some View {
    VStack(spacing: 4) {
      Text("Why is this needed?")
        .font(.footnote)
        .fontWeight(.medium)
      Text("Dev servers advertise themselves on your local network using Bonjour. This permission allows the app to discover them automatically.")
        .font(.caption)
        .foregroundColor(.secondary)
        .multilineTextAlignment(.center)
    }
  }
}

#if DEBUG
struct LocalNetworkPermissionView_Previews: PreviewProvider {
  static var previews: some View {
    LocalNetworkPermissionView(
      viewModel: DevLauncherViewModel(),
      onPermissionGranted: {}
    )
  }
}
#endif
