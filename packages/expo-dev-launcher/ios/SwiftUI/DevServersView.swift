// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import Combine

// swiftlint:disable closure_body_length

private func sanitizeUrlString(_ urlString: String) -> String? {
  var sanitizedUrl = urlString.trimmingCharacters(in: .whitespacesAndNewlines)

  if let decodedUrl = sanitizedUrl.removingPercentEncoding {
    sanitizedUrl = decodedUrl
  }

  if !sanitizedUrl.contains("://") {
    sanitizedUrl = "http://" + sanitizedUrl
  }

  guard URL(string: sanitizedUrl) != nil else {
    return nil
  }

  return sanitizedUrl
}

struct DevServersView: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel
  @Binding var showingInfoDialog: Bool
  @State private var showingURLInput = false
  @State private var urlText = ""
  @State private var cancellables = Set<AnyCancellable>()

  private func connectToURL() {
    if !urlText.isEmpty {
      let sanitizedURL = sanitizeUrlString(urlText)
      if let validURL = sanitizedURL {
        viewModel.openApp(url: validURL)
        withAnimation(.easeInOut(duration: 0.3)) {
          showingURLInput = false
        }
        urlText = ""
      }
    }
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      header

      LazyVStack(alignment: .leading, spacing: 6) {
        if viewModel.devServers.isEmpty {
          Text("No development servers found")
            .foregroundColor(.primary)
            .multilineTextAlignment(.leading)
            .padding()
          Divider()
        } else {
          ForEach(viewModel.devServers, id: \.url) { server in
            DevServerRow(server: server) {
              viewModel.openApp(url: server.url)
            }
          }
        }
        enterUrl
      }
    }
    .onAppear {
      startServerDiscovery()
    }
    .onDisappear {
      cancellables.removeAll()
    }
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
            #if os(tvOS)
            .font(.system(size: 28))
            #else
            .font(.system(size: 14))
            #endif
          Spacer()
        }
      }

      if showingURLInput {
        TextField("http://10.0.0.25:8081", text: $urlText)
          .autocapitalization(.none)
          .disableAutocorrection(true)
          .padding(.horizontal, 16)
          .padding(.vertical, 12)
          .foregroundColor(.primary)
          .onSubmit(connectToURL)
        #if !os(tvOS)
          .overlay(
            RoundedRectangle(cornerRadius: 5)
              .stroke(Color.expoSystemGray4, lineWidth: 1)
          )
        #endif
          .clipShape(RoundedRectangle(cornerRadius: 5))

        connectButton
      }
    }
    .animation(.easeInOut, value: showingURLInput)
    .padding()
    .background(showingURLInput ?
      Color.expoSecondarySystemBackground :
      Color.expoSystemBackground)
    .clipShape(RoundedRectangle(cornerRadius: 12))
  }

  private var header: some View {
    HStack {
      Text("development servers".uppercased())
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      Spacer()

      Button {
        showingInfoDialog = true
      } label: {
        Text("info".uppercased())
          #if os(tvOS)
          .foregroundColor(.primary)
          .font(.system(size: 24))
          #else
          .font(.system(size: 12))
          #endif
      }
      .buttonStyle(.automatic)
    }
  }

  private var connectButton: some View {
    Button(action: connectToURL) {
      Text("Connect")
        .font(.headline)
        .foregroundColor(.white)
        .frame(maxWidth: .infinity)
        .padding()
        .background(urlText.isEmpty ? Color.gray : Color.black)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
    .disabled(urlText.isEmpty)
    .buttonStyle(PlainButtonStyle())
  }

  private func startServerDiscovery() {
    Timer.publish(every: 2.0, on: .main, in: .common)
      .autoconnect()
      .receive(on: DispatchQueue.global(qos: .background))
      .sink { [weak viewModel] _ in
        viewModel?.discoverDevServers()
      }
      .store(in: &cancellables)
  }
}

struct DevServerRow: View {
  let server: DevServer
  let onTap: () -> Void

  var body: some View {
    Button {
      onTap()
    }
    label: {
      HStack {
        Circle()
          .fill(Color.green)
          .frame(width: 12, height: 12)

        Text(server.description)
          .foregroundColor(.primary)

        Spacer()
        Image(systemName: "chevron.right")
          .font(.caption)
          .foregroundColor(.secondary)
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    .buttonStyle(PlainButtonStyle())
  }
}
// swiftlint:enable closure_body_length
