// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct DevMenuRootView: View {
  @StateObject private var viewModel = DevMenuViewModel()
  @State private var navigationId = UUID()

  var body: some View {
    let mainView = VStack(spacing: 0) {
      HeaderView()
        .environmentObject(viewModel)

      ZStack {
        DevMenuMainView()
          .environmentObject(viewModel)

        #if !os(tvOS)
        if !viewModel.isOnboardingFinished {
          DevMenuOnboardingView(
            onFinish: viewModel.finishOnboarding,
            appName: viewModel.configuration.onboardingAppName ?? "your development builds"
          )
        }
        #endif
      }
    }
#if !os(macOS)
    NavigationView {
      mainView
    }
    .navigationViewStyle(.stack)
    .id(navigationId)
    .onReceive(DevMenuManager.shared.menuWillShowPublisher) { _ in
      navigationId = UUID()
    }
#else
    NavigationStack {
      mainView
    }
    .id(navigationId)
    .onReceive(DevMenuManager.shared.menuWillShowPublisher) { _ in
      navigationId = UUID()
    }
#endif
  }
}

#Preview {
  DevMenuRootView()
}
