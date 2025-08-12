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

  var body: some View {
    Button {
      onTap()
    } label: {
      HStack(alignment: .center) {
        Circle()
          .fill(Color.green)
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
#if !os(tvOS)
      .background(Color(.systemGroupedBackground))
#endif
      .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    .buttonStyle(PlainButtonStyle())
  }
}
