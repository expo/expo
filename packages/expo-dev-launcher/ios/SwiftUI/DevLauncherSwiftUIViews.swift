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

        ExtensionsTabView()
          .tabItem {
            Image("extensions-icon", bundle: getDevLauncherBundle())
            Text("Extensions")
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
      .clipShape(RoundedRectangle(cornerRadius: 8))
    }
    .buttonStyle(PlainButtonStyle())
  }
}

struct RecentlyOpenedApp {
  let name: String
  let url: String
  let timestamp: Date
  let isEasUpdate: Bool?
}

struct FetchDevServers: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  @State private var animationAmount = 1.0
  let onTap: () -> Void

  var body: some View {
    Button {
      onTap()
    }
    label: {
      HStack {
        Circle()
          .fill(viewModel.isDiscoveringServers ? Color.blue : Color.gray)
          .frame(width: 15, height: 15)
          .scaleEffect(animationAmount)
          .opacity(viewModel.isDiscoveringServers ? (animationAmount == 1.0 ? 1.0 : 0.6) : 1.0)
          .onAppear {
            if viewModel.isDiscoveringServers {
              startAnimating()
            }
          }
          .onChange(of: viewModel.isDiscoveringServers) { isDiscovering in
            if isDiscovering {
              stopAnimating()
            } else {
              stopAnimating()
            }
          }

        Text(viewModel.isDiscoveringServers ? "Searching for servers..." : "Fetch development servers")
          .foregroundColor(.primary)

        Spacer()
        if !viewModel.isDiscoveringServers {
          Image("refresh-icon", bundle: getDevLauncherBundle())
            .font(.caption)
            .foregroundColor(.secondary)
        }
      }
      .padding()
    }
    .buttonStyle(PlainButtonStyle())
  }

  private func startAnimating() {
    withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
      animationAmount = 1.2
    }
  }

  private func stopAnimating() {
    withAnimation(.easeInOut(duration: 0.2)) {
      animationAmount = 1.0
    }
  }
}
