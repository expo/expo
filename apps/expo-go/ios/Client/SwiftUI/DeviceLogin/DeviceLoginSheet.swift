// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

struct DeviceLoginSheet: View {
  let onFinished: (Bool) -> Void

  @StateObject private var viewModel: DeviceLoginViewModel
  @Environment(\.dismiss) private var dismiss
  @State private var browserURL: URL?

  init(authService: AuthenticationService, verificationURI: URL?, onFinished: @escaping (Bool) -> Void) {
    self.onFinished = onFinished
    _viewModel = StateObject(wrappedValue: DeviceLoginViewModel(authService: authService, verificationURI: verificationURI))
  }

  var body: some View {
    NavigationStack {
      ScrollView {
        content
          .padding(.horizontal, 16)
          .padding(.top, 24)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .background(Color.expoSystemBackground)
      .navigationTitle("Sign in to Expo Go")
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .topBarLeading) {
          Button {
            viewModel.cancel()
            onFinished(false)
            dismiss()
          } label: {
            Image(systemName: "xmark")
              .font(.system(size: 16, weight: .medium))
              .foregroundColor(.primary)
          }
          .accessibilityLabel("Cancel")
        }
      }
    }
    .sheet(item: $browserURL) { url in
      SafariView(url: url)
        .ignoresSafeArea()
    }
    .onChange(of: viewModel.phase) { newPhase in
      switch newPhase {
      case .awaitingBrowser:
        break
      case .matching:
        // The number the user has to pick is on the page behind this, so leave it readable.
        Task {
          try? await Task.sleep(nanoseconds: 3_000_000_000)
          browserURL = nil
        }
      default:
        browserURL = nil
      }
    }
    .task {
      viewModel.onSignedIn = {
        onFinished(true)
        dismiss()
      }
      await viewModel.start()
    }
  }

  @ViewBuilder
  private var content: some View {
    switch viewModel.phase {
    case .requesting:
      ProgressView("Getting a code")
        .frame(maxWidth: .infinity)
        .padding(.top, 48)
    case .awaitingBrowser:
      DeviceLoginCodeView(
        userCode: viewModel.userCode ?? "",
        origin: viewModel.displayOrigin,
        onOpenBrowser: { browserURL = viewModel.displayURI }
      )
    case .matching(let options):
      DeviceLoginMatchView(options: options) { value in
        viewModel.pick(value)
      }
    case .completing:
      ProgressView("Signing you in")
        .frame(maxWidth: .infinity)
        .padding(.top, 48)
    case .failed(let failure):
      DeviceLoginErrorView(failure: failure) {
        Task { await viewModel.restart() }
      }
    }
  }
}
