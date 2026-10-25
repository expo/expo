// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import UIKit

enum HomeTab: Hashable {
  case home
  case learn
  case diagnostics
  case settings
}

extension HomeTab {
  var title: String {
    switch self {
    case .home: return "Home"
    case .learn: return "Learn"
    case .diagnostics: return "Diagnostics"
    case .settings: return "Settings"
    }
  }

  var systemImage: String {
    switch self {
    case .home: return "house.fill"
    case .learn: return "book.fill"
    case .diagnostics: return "stethoscope"
    case .settings: return "gearshape"
    }
  }
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
  @State private var hasCompletedPermissionFlow: Bool
  @AppStorage("ExpoGoOnboardingFinished") private var isOnboardingFinished = initialOnboardingState

  init(viewModel: HomeViewModel) {
    self.viewModel = viewModel
    let shouldSkip = DevelopmentServerService.isSimulator
      || UserDefaults.standard.bool(forKey: DevelopmentServerService.networkPermissionGrantedKey)
      || !UserDefaults.standard.bool(forKey: "ExpoGoOnboardingFinished")
    _hasCompletedPermissionFlow = State(initialValue: shouldSkip)
  }

  public var body: some View {
    ZStack {
      TabView(selection: $selectedTab) {
        NavigationView {
          HomeTabView()
        }
        .navigationViewStyle(.stack)
        .tabItem {
          Label(HomeTab.home.title, systemImage: HomeTab.home.systemImage)
        }
        .tag(HomeTab.home)

        NavigationView {
          LearnTabView()
        }
        .navigationViewStyle(.stack)
        .tabItem {
          Label(HomeTab.learn.title, systemImage: HomeTab.learn.systemImage)
        }
        .tag(HomeTab.learn)

        NavigationView {
          DiagnosticsTabView()
        }
        .navigationViewStyle(.stack)
        .tabItem {
          Label(HomeTab.diagnostics.title, systemImage: HomeTab.diagnostics.systemImage)
        }
        .tag(HomeTab.diagnostics)

        NavigationView {
          SettingsTabView(selectedTab: $selectedTab)
        }
        .navigationViewStyle(.stack)
        .tabItem {
          Label(HomeTab.settings.title, systemImage: HomeTab.settings.systemImage)
        }
        .tag(HomeTab.settings)
      }
      .environmentObject(viewModel)
      .environmentObject(ExpoGoNavigation(showingUserProfile: $showingUserProfile))
      .sheet(isPresented: $showingUserProfile) {
        AccountSheet()
          .environmentObject(viewModel)
      }
      .sheet(item: $viewModel.deviceLoginRequest) { request in
        DeviceLoginSheet(authService: viewModel.authService, verificationURI: request.verificationURI) { signedIn in
          request.completion.resolve(signedIn)
          viewModel.deviceLoginRequest = nil
        }
        // Catches swipe-to-dismiss, which never calls the content closure above.
        .onDisappear {
          request.completion.resolve(false)
        }
      }
      .alert(item: $viewModel.errorToShow) { error in
        Alert(
          title: Text(error.title),
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

      if !hasCompletedPermissionFlow {
        LocalNetworkPermissionView(serverService: viewModel.serverService) {
          viewModel.serverService.startDiscovery()
          withAnimation(.easeInOut(duration: 0.3)) {
            hasCompletedPermissionFlow = true
          }
        }
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
