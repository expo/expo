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

          #if !os(tvOS)
          if !viewModel.isOnboardingFinished {
            DevMenuOnboardingView(onFinish: viewModel.finishOnboarding)
          }
          #endif
        }
      }
      #if !os(tvOS)
      .background(Color(.systemGroupedBackground))
      #endif
    }
  }
}

#Preview {
  DevMenuRootView()
}
