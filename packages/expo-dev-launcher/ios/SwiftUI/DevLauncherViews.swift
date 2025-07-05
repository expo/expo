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
            Image(systemName: "gear")
            Text("Settings")
          }
      }
      .accentColor(Color("TabBarTint", bundle: getDevLauncherBundle()))
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
    .fullScreenCover(isPresented: $viewModel.showingError) {
      if let error = viewModel.currentError {
        ErrorView(
          error: error,
          onReload: {
            viewModel.reloadCurrentApp()
          },
          onGoHome: {
            viewModel.dismissError()
          }
        )
      }
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
      HStack(alignment: .firstTextBaseline) {
        Circle()
          .fill(Color.green)
          .frame(width: 15, height: 15)
        VStack(alignment: .leading) {
          Text(app.name)
            .font(.headline)
            .foregroundColor(.primary)
          Text(app.url)
            .font(.caption)
            .foregroundColor(.secondary)
            .lineLimit(1)
        }
        // hack: figure out how to do precise layout
        .offset(y: -1)

        Spacer()
        Image(systemName: "chevron.right")
          .font(.caption)
          .foregroundColor(.secondary)
      }
      .padding()
      .background(Color(.systemBackground))
    }
    .buttonStyle(PlainButtonStyle())
  }
}
