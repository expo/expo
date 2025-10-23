// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import UIKit

public struct DevLauncherRootView: View {
  @ObservedObject var viewModel: DevLauncherViewModel
  @State private var showingUserProfile = false

  init(viewModel: DevLauncherViewModel) {
    self.viewModel = viewModel
  }

  public var body: some View {
    NavigationView {
      TabView {
        HomeTabView()
          .tabItem {
            Image(systemName: "house.fill")
            Text("Home")
          }

        UpdatesTabView()
          .tabItem {
            Image(systemName: "arrow.2.circlepath")
            Text("Updates")
          }

        SettingsTabView()
          .tabItem {
            Image(systemName: "gearshape")
            Text("Settings")
          }
      }
      .onAppear {
        DevLauncherTabBarManager.shared.setCustomAppearance()
      }
      .onDisappear {
        DevLauncherTabBarManager.shared.restoreOriginalAppearance()
      }
      .navigationBarHidden(true)
      .environmentObject(viewModel)
      .environmentObject(DevLauncherNavigation(showingUserProfile: $showingUserProfile))
    }
    .navigationViewStyle(.stack)
    .sheet(isPresented: $showingUserProfile) {
      AccountSheet()
        .environmentObject(viewModel)
    }
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
            .foregroundColor(.primary)
          Text(app.url)
            .font(.caption)
            .foregroundColor(.secondary)
            .lineLimit(1)
        }

        Spacer()
        Image(systemName: "chevron.right")
          .font(.caption)
          .foregroundColor(.secondary)
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    .buttonStyle(PlainButtonStyle())
  }
}
