// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

// swiftlint:disable:next line_length
private let serverDiscoveryInfoMessage = "Development servers on your network are listed automatically. These filters hide the ones that belong to a different app, a different Expo account, or a different project."

struct DevServerFiltersView: View {
  @EnvironmentObject var viewModel: DevLauncherViewModel

  var body: some View {
    VStack(alignment: .leading) {
      Text("Server discovery".uppercased())
        .font(.caption)
        .foregroundColor(.primary.opacity(0.6))

      VStack(spacing: 0) {
        DevServerFilterRow(icon: "app") {
          Toggle("Match bundle identifier", isOn: $viewModel.filterByBundleIdentifier)
        }

        Divider()

        DevServerFilterRow(icon: "person") {
          Toggle("Match Expo account", isOn: $viewModel.filterByUsername)
        }

        Divider()

        DevServerFilterRow(icon: "tag") {
          slugField
        }
      }
      .background(Color.expoSecondarySystemBackground)
      .cornerRadius(12)

      Text(serverDiscoveryInfoMessage)
        .font(.system(size: 13))
        .foregroundStyle(.secondary)
    }
  }

  private var slugField: some View {
    TextField("Match slug", text: $viewModel.filterBySlug)
      .disableAutocorrection(true)
    #if !os(macOS) && !os(tvOS)
      .autocapitalization(.none)
    #endif
  }
}

private struct DevServerFilterRow<Content: View>: View {
  private let icon: String
  private let content: Content

  init(icon: String, @ViewBuilder content: () -> Content) {
    self.icon = icon
    self.content = content()
  }

  var body: some View {
    HStack {
      Image(systemName: icon)
        .frame(width: 24, height: 24)
        .opacity(0.6)
      content
    }
    .padding(.horizontal)
    .padding(.vertical, 12)
  }
}
