// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct DevMenuMainView: View {
  @EnvironmentObject var viewModel: DevMenuViewModel

  var body: some View {
    ScrollView {
      VStack(spacing: 32) {
        DevMenuActions(
          canNavigateHome: true,
          onReload: viewModel.reload,
          onGoHome: viewModel.goHome
        )

        DevMenuDeveloperTools()

        if viewModel.showDebuggingTip && viewModel.appInfo?.engine == "Hermes" {
          HermesDebuggerTip()
        }

        if viewModel.showHostUrl, let hostUrl = viewModel.appInfo?.hostUrl {
          HostUrl(
            hostUrl: hostUrl,
            onCopy: viewModel.copyToClipboard,
            copiedMessage: viewModel.hostUrlCopiedMessage
          )
        }

        DevMenuAppInfo()
      }
      .padding()
    }
    .environmentObject(viewModel)
    .navigationTitle("Dev Menu")
    .navigationBarHidden(true)
    .navigationBarTitleDisplayMode(.inline)
  }
}
