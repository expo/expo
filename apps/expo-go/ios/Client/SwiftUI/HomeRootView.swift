// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import UIKit

enum HomeTab: Hashable {
  case home
  case learn
  case diagnostics
  case settings
}

struct HomeRootView: View {
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

      NavigationView {
        LearnTabView()
      }
      .tabItem {
        Image(systemName: "book.fill")
        Text("Learn")
      }
      .tag(HomeTab.learn)

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
    .alert(item: $viewModel.errorToShow) { error in
      Alert(
        title: Text("Error"),
        message: Text(error.message),
        dismissButton: .default(Text("OK"))
      )
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
