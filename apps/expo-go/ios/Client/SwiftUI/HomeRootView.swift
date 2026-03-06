// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import UIKit

enum HomeTab: Hashable {
  case home
  case learn
  case diagnostics
  case settings
}

#if targetEnvironment(simulator)
var initialOnboardingState: Bool = true
#else
var initialOnboardingState: Bool = false
#endif

struct HomeRootView: View {
  @ObservedObject var viewModel: HomeViewModel
  @State private var showingUserProfile = false
  @State private var selectedTab: HomeTab = .home
  @AppStorage("ExpoGoOnboardingFinished") private var isOnboardingFinished = initialOnboardingState

  init(viewModel: HomeViewModel) {
    self.viewModel = viewModel
  }

  public var body: some View {
    ZStack {
      TabView(selection: $selectedTab) {
        NavigationView {
          HomeTabView()
        }
        .navigationViewStyle(.stack)
        .tabItem {
          Image(systemName: "house.fill")
          Text("Home")
        }
        .tag(HomeTab.home)

        NavigationView {
          LearnTabView()
        }
        .navigationViewStyle(.stack)
        .tabItem {
          Image(systemName: "book.fill")
          Text("Learn")
        }
        .tag(HomeTab.learn)

        NavigationView {
          DiagnosticsTabView()
        }
        .navigationViewStyle(.stack)
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

      if !isOnboardingFinished {
        OnboardingFlowView(
          onStartLesson: {
            selectedTab = .learn
            viewModel.pendingLessonId = 1
            withAnimation(.easeInOut(duration: 0.3)) {
              isOnboardingFinished = true
            }
          },
          onExplore: {
            selectedTab = .learn
            withAnimation(.easeInOut(duration: 0.3)) {
              isOnboardingFinished = true
            }
          }
        )
        .transition(.opacity)
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
