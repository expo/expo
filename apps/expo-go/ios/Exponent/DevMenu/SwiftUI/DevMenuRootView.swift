// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct DevMenuRootView: View {
  static let coordinateSpace = "DevMenuRootView"

  @StateObject private var viewModel = DevMenuViewModel(manager: DevMenuManager.shared)
  @State private var navigationId = UUID()
  @State private var isSourceExplorerPresented = false

  var body: some View {
    let mainView = VStack(spacing: 0) {
      HeaderView()
        .environmentObject(viewModel)

      ZStack {
        DevMenuMainView()
          .environmentObject(viewModel)

        if !viewModel.isOnboardingFinished {
          DevMenuOnboardingView(
            onFinish: viewModel.finishOnboarding,
            onContentBottomChange: { bottom in
              DevMenuManager.shared.setOnboardingContentHeight(bottom)
            }
          )
        }
      }
    }
    .coordinateSpace(name: Self.coordinateSpace)
    .onChange(of: viewModel.isOnboardingFinished) { isFinished in
      if isFinished {
        DevMenuManager.shared.setOnboardingContentHeight(nil)
      }
    }

    NavigationView {
      ZStack {
        mainView

        NavigationLink(
          destination: SourceMapExplorerView(),
          isActive: $isSourceExplorerPresented
        ) {
          EmptyView()
        }
        .hidden()
      }
    }
    .navigationViewStyle(.stack)
    .id(navigationId)
    .onReceive(DevMenuManager.shared.menuWillShowPublisher) { _ in
      isSourceExplorerPresented = false
      navigationId = UUID()
    }
    .onReceive(DevMenuManager.shared.sourceExplorerPresentationPublisher) { shouldPresent in
      guard shouldPresent else { return }
      isSourceExplorerPresented = true
      DevMenuManager.shared.sourceExplorerDidPresent()
    }
  }
}
