// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import EXDevMenu

struct LearnTabView: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @State private var isCreatingPlayground = false

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 24) {
        Text("Create a playground and start learning now!")
          .foregroundColor(.secondary)

        // Create New Playground Button
        Button(action: createNewPlayground) {
          HStack {
            Image(systemName: "plus.circle.fill")
            Text("New Playground")
          }
          .frame(maxWidth: .infinity)
          .padding()
          .background(Color.expoBlue)
          .foregroundColor(.white)
          .cornerRadius(BorderRadius.large)
        }
        .disabled(isCreatingPlayground)

        // Fork Template Button
        Button(action: forkTemplatePlayground) {
          HStack {
            Image(systemName: "doc.on.doc.fill")
            Text("Start from Template")
          }
          .frame(maxWidth: .infinity)
          .padding()
          .background(Color.expoSecondarySystemGroupedBackground)
          .foregroundColor(.primary)
          .cornerRadius(BorderRadius.large)
        }
        .disabled(isCreatingPlayground)

        if isCreatingPlayground {
          HStack {
            ProgressView()
            Text("Creating playground...")
              .foregroundColor(.secondary)
          }
        }

        Spacer()
      }
      .padding()
    }
    .navigationTitle("Learn")
  }

  private func createNewPlayground() {
    isCreatingPlayground = true

    Task {
      let versions = Versions.sharedInstance
      let service = PlaygroundService.shared
      let channel = service.generateChannelId()

      // Set up editing session with default code
      await SnackEditingSession.shared.setupSessionWithCode(
        code: PlaygroundService.defaultCode,
        channel: channel
      )

      // Build URL and launch
      let url = service.buildRuntimeUrl(channel: channel, sdkVersion: versions.sdkVersion)

      await MainActor.run {
        viewModel.openApp(url: url)
        isCreatingPlayground = false
      }
    }
  }

  private func forkTemplatePlayground() {
    isCreatingPlayground = true

    Task {
      let versions = Versions.sharedInstance
      let service = PlaygroundService.shared
      let channel = service.generateChannelId()

      // Set up editing session by fetching and hosting template code
      await SnackEditingSession.shared.setupSession(
        snackId: service.getTemplateSnackId(),
        channel: channel,
        isStaging: false
      )

      // Build URL and launch
      let url = service.buildRuntimeUrl(channel: channel, sdkVersion: versions.sdkVersion)

      await MainActor.run {
        viewModel.openApp(url: url)
        isCreatingPlayground = false
      }
    }
  }
}
