import SwiftUI
import UIKit

struct DevServersSection: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @State private var showingURLInput = false
  @State private var urlText = ""
  @State private var showingTroubleshootingAlert = false
  @State private var troubleshootingTitle = ""
  @State private var troubleshootingMessage = ""

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      header

      LazyVStack(alignment: .leading, spacing: 6) {
        if viewModel.developmentServers.isEmpty {
          instructionsCard
        }

        if !viewModel.developmentServers.isEmpty {
          ForEach(viewModel.developmentServers) { server in
            DevServerRow(server: server) {
              UIImpactFeedbackGenerator(style: .light).impactOccurred()
              let normalizedUrl = normalizeDevServerUrl(server.url)
              viewModel.addToRecentlyOpened(
                url: normalizedUrl,
                name: server.description,
                iconUrl: server.iconUrl
              )
              viewModel.openApp(url: normalizedUrl)
            }
          }
        }

        enterUrl
      }
    }
    .alert(troubleshootingTitle, isPresented: $showingTroubleshootingAlert) {
      Button("OK", role: .cancel) { }
    } message: {
      Text(troubleshootingMessage)
    }
  }

  private var header: some View {
    HStack {
      Text("development servers".uppercased())
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      Spacer()

      Button {
        presentTroubleshooting()
      } label: {
        Text("help".uppercased())
          .font(.system(size: 12))
      }
      .buttonStyle(.automatic)
    }
  }

  private var instructionsCard: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("Start a local development server with:")
        .font(.body)

      Text("npx expo start")
        .font(.system(.callout, design: .monospaced))
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.expoSecondarySystemBackground)
        .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))

      Text("Select the local server when it appears here.")
        .font(.subheadline)
        .foregroundColor(.secondary)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Color.expoSystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
  }

  private var enterUrl: some View {
    VStack(spacing: 20) {
      Button {
        withAnimation(.easeInOut(duration: 0.3)) {
          showingURLInput.toggle()
        }
      } label: {
        HStack {
          Image(systemName: showingURLInput ? "chevron.down" : "chevron.right")
            .font(.headline)
          Text("Enter URL manually")
            .font(.system(size: 14))
          Spacer()
        }
      }

      if showingURLInput {
        TextField("exp://", text: $urlText)
          .autocapitalization(.none)
          .disableAutocorrection(true)
          .padding(.horizontal, 16)
          .padding(.vertical, 12)
          .foregroundColor(.primary)
          .overlay(
            RoundedRectangle(cornerRadius: 5)
              .stroke(Color.expoSystemGray4, lineWidth: 1)
          )
          .clipShape(RoundedRectangle(cornerRadius: 5))

        Button {
          if let url = sanitizeUrlString(urlText) {
            viewModel.openApp(url: url)
            withAnimation(.easeInOut(duration: 0.3)) {
              showingURLInput = false
            }
            urlText = ""
          }
        } label: {
          Text("Connect")
            .font(.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(urlText.isEmpty ? Color.gray : Color.black)
            .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
        }
        .disabled(urlText.isEmpty)
        .buttonStyle(PlainButtonStyle())
      }
    }
    .animation(.easeInOut, value: showingURLInput)
    .padding()
    .background(showingURLInput ? Color.expoSecondarySystemBackground : Color.expoSystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
  }

  private func presentTroubleshooting() {
    if !viewModel.isNetworkAvailable {
      troubleshootingTitle = "No network connection available"
      troubleshootingMessage = "You must be connected to the internet to view a list of your projects open in development."
      showingTroubleshootingAlert = true
      return
    }

    let baseMessage = "Make sure you are signed in to the same Expo account on your computer and this app. Also verify that your computer is connected to the internet, and ideally to the same Wi-Fi network as your mobile device. Lastly, ensure that you are using the latest version of Expo CLI. Pull to refresh to update."
    #if targetEnvironment(simulator)
    let message = baseMessage + " If this still doesn't work, press the + icon on the header to type the project URL manually."
    #else
    let message = baseMessage
    #endif

    troubleshootingTitle = "Troubleshooting"
    troubleshootingMessage = message
    showingTroubleshootingAlert = true
  }

  private func normalizeDevServerUrl(_ urlString: String) -> String {
    guard let url = URL(string: urlString) else {
      return urlString
    }
    return toExpURLString(url)
  }
}
