import SwiftUI

struct DevMenuMainView: View {
  @EnvironmentObject var viewModel: DevMenuViewModel

  var body: some View {
    ScrollView {
      VStack(spacing: 32) {
        VStack {
          if let hostUrl = viewModel.appInfo?.hostUrl {
            HostUrl(
              hostUrl: hostUrl,
              onCopy: viewModel.copyToClipboard,
              copiedMessage: viewModel.hostUrlCopiedMessage
            )
          }

          DevMenuActions(
            isDevLauncherInstalled: viewModel.isDevLauncherInstalled,
            onReload: viewModel.reload,
            onGoHome: viewModel.goHome
          )
        }

        if !viewModel.registeredCallbacks.isEmpty {
          CustomItems(
            callbacks: viewModel.registeredCallbacks,
            onFireCallback: viewModel.fireCallback
          )
        }

        DevMenuDeveloperTools()

        if viewModel.appInfo?.engine == "Hermes" {
          HermesWarning()
        }

        DevMenuAppInfo()

        DevMenuRNDevMenu(onOpenRNDevMenu: viewModel.openRNDevMenu)
      }
      .padding()
    }
    .environmentObject(viewModel)
  }
}
