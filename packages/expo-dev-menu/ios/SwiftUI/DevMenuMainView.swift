import SwiftUI

struct DevMenuMainView: View {
  @EnvironmentObject var viewModel: DevMenuViewModel

  var body: some View {
    ScrollView {
      LazyVStack(spacing: 0, pinnedViews: []) {
        if let hostUrl = viewModel.appInfo?.hostUrl {
          HostUrl(
            hostUrl: hostUrl,
            onCopy: viewModel.copyToClipboard,
            copiedMessage: viewModel.hostUrlCopiedMessage
          )
        }

        if !viewModel.registeredCallbacks.isEmpty {
          CustomItems(
            callbacks: viewModel.registeredCallbacks,
            onFireCallback: viewModel.fireCallback
          )
        }

        DevMenuActions(
          isDevLauncherInstalled: viewModel.isDevLauncherInstalled,
          onReload: viewModel.reload,
          onGoHome: viewModel.goHome
        )

        DevMenuDeveloperTools()
          .environmentObject(viewModel)

        if viewModel.appInfo?.engine == "Hermes" {
          HermesWarning()
        }

        DevMenuAppInfo()
          .environmentObject(viewModel)

        DevMenuRNDevMenu(onOpenRNDevMenu: viewModel.openRNDevMenu)

        Spacer(minLength: 32)
      }
    }
  }
}

#Preview {
  DevMenuMainView()
}
