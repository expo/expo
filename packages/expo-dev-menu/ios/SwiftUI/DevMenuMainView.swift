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
            canNavigateHome: viewModel.canNavigateHome,
            onReload: viewModel.reload,
            onGoHome: viewModel.goHome
          )
        }

        // Chat message input UI
        VStack(alignment: .leading, spacing: 8) {
          Text("AI")
            .font(.caption)
            .foregroundColor(.primary.opacity(0.6))
          
          HStack(spacing: 12) {
            TextField("Generate code...", text: .constant(""))
              .textFieldStyle(.plain)
            
            Button(action: {}) {
              Image(systemName: "arrow.up.circle.fill")
                .font(.system(size: 24))
                .foregroundColor(.blue)
            }
            .buttonStyle(.plain)
          }
          .padding()
          .background(Color.expoSecondarySystemBackground)
          .cornerRadius(20)
        }

        if !viewModel.registeredCallbacks.isEmpty {
          CustomItems(
            callbacks: viewModel.registeredCallbacks,
            onFireCallback: viewModel.fireCallback
          )
        }

        DevMenuDeveloperTools()

        if viewModel.appInfo?.engine == "Hermes" {
          HermesDebuggerTip()
        }

        DevMenuAppInfo()

        DevMenuRNDevMenu(onOpenRNDevMenu: viewModel.openRNDevMenu)
      }
      .padding()
    }
    .environmentObject(viewModel)
  }
}
