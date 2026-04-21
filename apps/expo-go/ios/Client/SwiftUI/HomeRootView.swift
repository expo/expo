// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import UIKit

enum HomeTab: Hashable {
  case home
  case learn
  case diagnostics
  case settings
}

// Dev flag: flip to `true` to see the onboarding flow in the simulator on every launch.
// Normally simulator runs skip onboarding (treated as already completed).
// Has no effect on physical devices — they always use the persisted state.
private let debugShowOnboardingInSimulator = false

#if targetEnvironment(simulator)
var initialOnboardingState: Bool = {
  if debugShowOnboardingInSimulator {
    // Reset persisted state so the flow restarts from page 1 each launch.
    UserDefaults.standard.removeObject(forKey: "ExpoGoOnboardingFinished")
    return false
  }
  return true
}()
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
