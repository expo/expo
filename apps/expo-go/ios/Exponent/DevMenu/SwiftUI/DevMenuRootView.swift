// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct DevMenuRootView: View {
  @StateObject private var viewModel = DevMenuViewModel(manager: DevMenuManager.shared)
  @State private var navigationId = UUID()

  var body: some View {
    let mainView = VStack(spacing: 0) {
      HeaderView()
        .environmentObject(viewModel)

      ZStack {
        DevMenuMainView()
          .environmentObject(viewModel)

        if !viewModel.isOnboardingFinished {
          DevMenuOnboardingView(
            onFinish: viewModel.finishOnboarding
          )
        }
      }
    }

    NavigationView {
      mainView
    }
    .navigationViewStyle(.stack)
    .id(navigationId)
    .onReceive(DevMenuManager.shared.menuWillShowPublisher) { _ in
      navigationId = UUID()
    }
  }
}

#Preview {
  DevMenuRootView()
}
