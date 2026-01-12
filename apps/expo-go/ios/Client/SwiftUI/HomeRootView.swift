// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import UIKit

enum HomeTab: Hashable {
  case home
  case diagnostics
  case settings
}

public struct HomeRootView: View {
  @ObservedObject var viewModel: HomeViewModel
  @State private var showingUserProfile = false
  @State private var selectedTab: HomeTab = .home

  init(viewModel: HomeViewModel) {
    self.viewModel = viewModel
  }

  public var body: some View {
    TabView(selection: $selectedTab) {
      NavigationView {
        HomeTabView()
      }
      .tabItem {
        Image(systemName: "house.fill")
        Text("Home")
      }
      .tag(HomeTab.home)
      .navigationBarHidden(true)

      NavigationView {
        DiagnosticsTabView()
      }
      .tabItem {
        Image(systemName: "stethoscope")
        Text("Diagnostics")
      }
      .tag(HomeTab.diagnostics)

      SettingsTabView(selectedTab: $selectedTab)
        .tabItem {
          Image(systemName: "gearshape")
          Text("Settings")
        }
        .tag(HomeTab.settings)
    }
    .environmentObject(viewModel)
    .environmentObject(ExpoGoNavigation(showingUserProfile: $showingUserProfile))
    .sheet(isPresented: $showingUserProfile) {
      AccountSheet()
        .environmentObject(viewModel)
    }
    .alert("Error", isPresented: Binding(
      get: { viewModel.errorToShow != nil },
      set: { if !$0 { viewModel.clearError() } }
    )) {
      Button("OK") {
        viewModel.clearError()
      }
    } message: {
      if let error = viewModel.errorToShow {
        Text(error.message)
      }
    }
  }
}

class ExpoGoNavigation: ObservableObject {
  @Binding var showingUserProfile: Bool

  init(showingUserProfile: Binding<Bool>) {
    self._showingUserProfile = showingUserProfile
  }

  func showUserProfile() {
    showingUserProfile = true
  }
}
