import SwiftUI
import UIKit
import EXDevMenu

struct DevServersSection: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @State private var showingTroubleshootingAlert = false
  @State private var loadingServerUrl: String?
  @State private var isLoadingPlayground = false
  @State private var troubleshootingTitle = ""
  @State private var troubleshootingMessage = ""

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      header

      VStack(alignment: .leading, spacing: 6) {
        if viewModel.developmentServers.isEmpty {
          instructionsCard
        }

        if !viewModel.developmentServers.isEmpty {
          ForEach(viewModel.developmentServers) { server in
            DevServerRow(server: server, isLoading: loadingServerUrl == server.url) {
              UIImpactFeedbackGenerator(style: .light).impactOccurred()
              loadingServerUrl = server.url
              let normalizedUrl = normalizeDevServerUrl(server.url)
              viewModel.addToRecentlyOpened(
                url: normalizedUrl,
                name: server.description,
                iconUrl: server.iconUrl
              )
              viewModel.openApp(url: normalizedUrl)
            }
            .disabled(viewModel.isLoadingApp)
          }
        }

        // Separator
        Text("•  •  •")
          .font(.caption)
          .foregroundColor(.secondary)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 4)

        openPlaygroundButton
      }
    }
    .alert(troubleshootingTitle, isPresented: $showingTroubleshootingAlert) {
      Button("OK", role: .cancel) { }
    } message: {
      Text(troubleshootingMessage)
    }
    .onChange(of: viewModel.isLoadingApp) { isLoading in
      if !isLoading {
        loadingServerUrl = nil
        isLoadingPlayground = false
      }
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
        .padding(.vertical, 10)
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

  private func presentTroubleshooting() {
    if !viewModel.isNetworkAvailable {
      troubleshootingTitle = "No network connection available"
      troubleshootingMessage = "You must be connected to the internet to view a list of your projects open in development."
      showingTroubleshootingAlert = true
      return
    }

    let baseMessage = "Make sure you are signed in to the same Expo account on your computer and this app. Also verify that your computer is connected to the internet, and ideally to the same Wi-Fi network as your mobile device. Lastly, ensure that you are using the latest version of Expo CLI. Pull to refresh to update."
    #if targetEnvironment(simulator)
    let message = baseMessage + " Alternatively, tap the + button to enter a URL manually."
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

  private var openPlaygroundButton: some View {
    Button {
      createNewPlayground()
    } label: {
      HStack(spacing: 12) {
        Image(systemName: "book.fill")
          .font(.system(size: 18))
          .foregroundColor(.white)
          .frame(width: 40, height: 40)
          .background(Color(uiColor: .darkGray), in: RoundedRectangle(cornerRadius: BorderRadius.medium))

        VStack(alignment: .leading, spacing: 2) {
          Text("Open a new playground")
            .font(.body)
            .fontWeight(.semibold)
            .foregroundColor(.primary)

          Text("Your own space to explore and learn")
            .font(.caption)
            .foregroundColor(.secondary)
        }

        Spacer()

        if isLoadingPlayground {
          ProgressView()
        } else {
          Image(systemName: "chevron.right")
            .font(.caption)
            .foregroundColor(.secondary)
        }
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
    }
    .buttonStyle(.plain)
    .disabled(viewModel.isLoadingApp)
  }

  private func createNewPlayground() {
    isLoadingPlayground = true

    let service = PlaygroundService.shared
    let channel = service.generateChannelId()

    let url = service.buildRuntimeUrl(
      channel: channel,
      sdkVersion: Versions.sharedInstance.sdkVersion
    )

    // Convert default code to the format expected by openApp
    var codeDict: [String: [String: Any]] = [:]
    for (path, file) in PlaygroundService.defaultCode {
      codeDict[path] = [
        "contents": file.contents,
        "type": file.isAsset ? "ASSET" : "CODE"
      ]
    }

    let snackParams: NSDictionary = [
      "channel": channel,
      "code": codeDict,
      "isPlayground": true
    ]

    viewModel.openApp(url: url, snackParams: snackParams)
  }
}

// MARK: - Enter URL Sheet

struct EnterURLSheet: View {
  @Binding var urlText: String
  let isLoading: Bool
  let onConnect: (String) -> Void
  let onDismiss: () -> Void

  @Environment(\.dismiss) private var dismiss
  @FocusState private var isURLFieldFocused: Bool

  var body: some View {
    NavigationView {
      VStack(spacing: 20) {
        Text("Enter the URL of your development server or project.")
          .font(.subheadline)
          .foregroundColor(.secondary)
          .multilineTextAlignment(.center)

        TextField("exp://192.168.1.1:8081", text: $urlText)
          .autocapitalization(.none)
          .disableAutocorrection(true)
          .keyboardType(.URL)
          .focused($isURLFieldFocused)
          .padding(.horizontal, 16)
          .padding(.vertical, 12)
          .background(Color.expoSecondarySystemBackground)
          .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))

        Button {
          if let url = sanitizeUrlString(urlText) {
            onConnect(url)
            dismiss()
          }
        } label: {
          HStack {
            if isLoading {
              ProgressView()
                .tint(.white)
            }
            Text("Connect")
          }
          .font(.headline)
          .foregroundColor(.white)
          .frame(maxWidth: .infinity)
          .padding()
          .background(urlText.isEmpty ? Color.gray : Color.expoBlue)
          .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
        }
        .disabled(urlText.isEmpty || isLoading)
        .buttonStyle(.plain)

        Spacer()
      }
      .padding()
      .navigationTitle("Enter URL")
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Cancel") {
            onDismiss()
            dismiss()
          }
        }
      }
    }
    .modifier(SheetHeightModifier())
    .onAppear {
      isURLFieldFocused = true
    }
  }
}

struct SheetHeightModifier: ViewModifier {
  func body(content: Content) -> some View {
    if #available(iOS 16.0, *) {
      content.presentationDetents([.medium])
    } else {
      content
    }
  }
}
