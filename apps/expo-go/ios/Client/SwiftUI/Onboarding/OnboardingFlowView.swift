// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct OnboardingFlowView: View {
  @StateObject private var viewModel = OnboardingViewModel()
  let onStartLesson: () -> Void
  let onExplore: () -> Void

  var body: some View {
    VStack(spacing: 0) {
      OnboardingProgressBar(
        currentStep: viewModel.currentPage.rawValue,
        totalSteps: viewModel.totalPages
      )

      TabView(selection: $viewModel.currentPage) {
        OnboardingWelcomeView(viewModel: viewModel)
          .tag(OnboardingPage.welcome)

        OnboardingTopicsView(viewModel: viewModel)
          .tag(OnboardingPage.topics)

        OnboardingMethodsView(viewModel: viewModel)
          .tag(OnboardingPage.methods)

        OnboardingReadyView(
          onStartLesson: {
            viewModel.persistTopicSelections()
            onStartLesson()
          },
          onExplore: {
            viewModel.persistTopicSelections()
            onExplore()
          }
        )
        .tag(OnboardingPage.ready)
      }
      .tabViewStyle(.page(indexDisplayMode: .never))
      .animation(.easeInOut(duration: 0.3), value: viewModel.currentPage)
    }
    .background(Color.expoSystemBackground)
  }
}
