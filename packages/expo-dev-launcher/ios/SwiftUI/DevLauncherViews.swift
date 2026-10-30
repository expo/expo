// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

public struct DevLauncherRootView: View {
  @ObservedObject var viewModel: DevLauncherViewModel
  @State private var showingUserProfile = false
  @State private var hasCompletedPermissionFlow: Bool

  init(viewModel: DevLauncherViewModel) {
    self.viewModel = viewModel
    let shouldSkipPermissionFlow = Self.isSimulator
      || UserDefaults.standard.bool(forKey: "expo.devlauncher.hasGrantedNetworkPermission")
    _hasCompletedPermissionFlow = State(initialValue: shouldSkipPermissionFlow)
  }

  private static var isSimulator: Bool {
    #if targetEnvironment(simulator)
    return true
    #else
    return false
    #endif
  }

  public var body: some View {
    if !hasCompletedPermissionFlow {
      LocalNetworkPermissionView(viewModel: viewModel) {
        hasCompletedPermissionFlow = true
      }
    } else {
      mainContent
    }
  }

  private var appName: String? {
    guard let name = viewModel.buildInfo["appName"] as? String, !name.isEmpty else {
      return nil
    }
    return name
  }

  private var mainContent: some View {
    TabView {
      TabNavigation(.home, title: appName) {
        HomeTabView()
      }

      TabNavigation(.updates) {
        UpdatesTabView()
      }

      TabNavigation(.settings) {
        SettingsTabView()
      }
    }
    .onAppear {
      DevLauncherTabBarManager.shared.setCustomAppearance()
    }
    .onDisappear {
      DevLauncherTabBarManager.shared.restoreOriginalAppearance()
    }
    .environmentObject(viewModel)
    .environmentObject(DevLauncherNavigation(showingUserProfile: $showingUserProfile))
    .onAppear {
      viewModel.startServerDiscovery()
    }
    .onDisappear {
      viewModel.stopServerDiscovery()
    }
    .sheet(isPresented: $showingUserProfile) {
      AccountSheet()
        .environmentObject(viewModel)
    }
#if !os(macOS)
    .fullScreenCover(isPresented: $viewModel.showingCrashReport) {
      if let error = viewModel.currentError {
        CrashReportView(
          error: error,
          errorInstance: viewModel.storedCrashInstance,
          onDismiss: {
            viewModel.dismissCrashReport()
          }
        )
      }
    }
#else
    .sheet(isPresented: $viewModel.showingCrashReport) {
      if let error = viewModel.currentError {
        CrashReportView(
          error: error,
          errorInstance: viewModel.storedCrashInstance,
          onDismiss: {
            viewModel.dismissCrashReport()
          }
        )
      }
    }
#endif
    .alert("Error loading app", isPresented: $viewModel.showingErrorAlert) {
      Button("OK") {
        viewModel.dismissErrorAlert()
      }
    } message: {
      Text(viewModel.errorAlertMessage)
    }
  }
}

struct RecentlyOpenedAppRow: View {
  let app: RecentlyOpenedApp
  let onTap: () -> Void
  @EnvironmentObject var viewModel: DevLauncherViewModel

  private var isServerActive: Bool {
    guard let url = URL(string: app.url),
    let port = url.port else {
      return false
    }

    return viewModel.devServers.contains { server in
      guard let serverURL = URL(string: server.url),
        let serverPort = serverURL.port else {
        return false
      }
      return serverPort == port
    }
  }

  var body: some View {
    Button {
      onTap()
    } label: {
      HStack(alignment: .center) {
        Circle()
          .fill(isServerActive ? Color.green : Color.gray)
          .frame(width: 12, height: 12)
        VStack(alignment: .leading) {
          Text(app.name)
            .font(.headline)
            .foregroundStyle(Color.primary)
          Text(app.url)
            .font(.caption)
            .foregroundStyle(Color.secondary)
            .lineLimit(1)
        }

        Spacer()
        Image(systemName: "chevron.right")
          .font(.caption)
          .foregroundStyle(Color.secondary)
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    .buttonStyle(PlainButtonStyle())
  }
}
