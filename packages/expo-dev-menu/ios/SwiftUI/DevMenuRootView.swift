// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct DevMenuRootView: View {
  @StateObject private var viewModel = DevMenuViewModel()

  var body: some View {
    NavigationView {
      VStack(spacing: 0) {
        HeaderView()
          .environmentObject(viewModel)

        Divider()

        ZStack {
          DevMenuMainView()
            .environmentObject(viewModel)

          if !viewModel.isOnboardingFinished {
            DevMenuOnboardingView(onFinish: viewModel.finishOnboarding)
          }
        }
      }
      .background(Color(.systemGroupedBackground))
    }
  }
}

#Preview {
  DevMenuRootView()
}
