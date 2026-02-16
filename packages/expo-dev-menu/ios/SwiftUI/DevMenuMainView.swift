import SwiftUI

struct DevMenuMainView: View {
  @EnvironmentObject var viewModel: DevMenuViewModel

  var body: some View {
    ScrollView {
      VStack(spacing: 32) {
        DevMenuActions(
          canNavigateHome: viewModel.canNavigateHome,
          onReload: viewModel.reload,
          onGoHome: viewModel.goHome
        )

        if !viewModel.registeredCallbacks.isEmpty {
          CustomItems(
            callbacks: viewModel.registeredCallbacks,
            onFireCallback: viewModel.fireCallback
          )
        }

        DevMenuDeveloperTools()

        if viewModel.configuration.showDebuggingTip && viewModel.appInfo?.engine == "Hermes" {
          HermesDebuggerTip()
        }

        if viewModel.configuration.showHostUrl, let hostUrl = viewModel.appInfo?.hostUrl {
          HostUrl(
            hostUrl: hostUrl,
            onCopy: viewModel.copyToClipboard,
            copiedMessage: viewModel.hostUrlCopiedMessage
          )
        }

        if viewModel.configuration.showSystemSection {
          DevMenuAppInfo()
        }

        if viewModel.shouldShowReactNativeDevMenu {
          DevMenuRNDevMenu(onOpenRNDevMenu: viewModel.openRNDevMenu)
        }
      }
      .padding()
    }
    .environmentObject(viewModel)
    .navigationTitle("Dev Menu")
#if !os(macOS) && !os(tvOS)
    .navigationBarHidden(true)
    .navigationBarTitleDisplayMode(.inline)
#endif
  }
}
