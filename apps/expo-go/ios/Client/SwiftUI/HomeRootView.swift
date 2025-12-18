// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import UIKit

public struct HomeRootView: View {
  @ObservedObject var viewModel: HomeViewModel
  @State private var showingUserProfile = false

  init(viewModel: HomeViewModel) {
    self.viewModel = viewModel
  }

  public var body: some View {
    TabView {
        HomeTabView()
          .tabItem {
            Image(systemName: "house.fill")
            Text("Home")
          }
          .navigationBarHidden(true)

        NavigationView {
          DiagnosticsTabView()
        }
        .tabItem {
          Image(systemName: "stethoscope")
          Text("Diagnostics")
        }

        NavigationView {
          SettingsTabView()
        }
        .tabItem {
          Image(systemName: "gearshape")
          Text("Settings")
        }
      }
      .environmentObject(viewModel)
      .environmentObject(ExpoGoNavigation(showingUserProfile: $showingUserProfile))
    .sheet(isPresented: $showingUserProfile) {
      AccountSheet()
        .environmentObject(viewModel)
    }
    .alert("Error", isPresented: $viewModel.showingErrorAlert) {
      Button("OK") {
        viewModel.dismissErrorAlert()
      }
    } message: {
      Text(viewModel.errorAlertMessage)
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
