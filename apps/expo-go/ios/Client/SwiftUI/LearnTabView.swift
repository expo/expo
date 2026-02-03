// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import EXDevMenu

struct LearnTabView: View {
  @EnvironmentObject var viewModel: HomeViewModel
  @State private var loadingLessonId: Int?
  @State private var errorMessage: String?

  // Feature flag to show old playground buttons (hidden for now)
  private let showPlaygroundButtons = false

  private var isLoading: Bool {
    loadingLessonId != nil
  }

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 16) {
        // Header
        Text("Learn the basics with bite-sized interactive lessons.")
          .foregroundColor(.secondary)

        LazyVStack(spacing: 8) {
          ForEach(Lesson.allLessons) { lesson in
            LessonRow(
              lesson: lesson,
              isCompleted: viewModel.settingsManager.isLessonCompleted(lesson.id),
              isLoading: loadingLessonId == lesson.id
            ) {
              startLesson(lesson)
            }
            .disabled(isLoading)
          }
        }

        // Old playground buttons (hidden)
        if showPlaygroundButtons {
          Divider()
            .padding(.vertical, 8)

          Text("PLAYGROUND")
            .expoSectionHeader()

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
          .disabled(isLoading)

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
          .disabled(isLoading)
        }

        Spacer()
      }
      .padding()
    }
    .navigationTitle("Learn")
    .onAppear {
      viewModel.settingsManager.refreshCompletedLessons()
    }
    .alert("Unable to Load Lesson", isPresented: .init(
      get: { errorMessage != nil },
      set: { if !$0 { errorMessage = nil } }
    )) {
      Button("OK") { errorMessage = nil }
    } message: {
      if let errorMessage {
        Text(errorMessage)
      }
    }
  }

  // MARK: - Lesson Loading

  private func startLesson(_ lesson: Lesson) {
    loadingLessonId = lesson.id

    Task {
      let service = PlaygroundService.shared
      let channel = service.generateChannelId()

      // Set up editing session with lesson code
      await SnackEditingSession.shared.setupSessionWithCode(
        snackId: lesson.snackDisplayName,
        code: lesson.snackFiles,
        dependencies: Lesson.snackDependencies,
        channel: channel,
        isLesson: true,
        lessonId: lesson.id,
        lessonDescription: lesson.shortDescription
      )

      // Check for setup errors
      if let error = SnackEditingSession.shared.setupError {
        await MainActor.run {
          loadingLessonId = nil
          errorMessage = error.localizedDescription
        }
        return
      }

      // Build URL and launch
      let url = service.buildRuntimeUrl(
        channel: channel,
        sdkVersion: Versions.sharedInstance.sdkVersion
      )

      await MainActor.run {
        viewModel.openApp(url: url)
        loadingLessonId = nil
      }
    }
  }

  // MARK: - Playground Creation (kept for future use)

  private func createNewPlayground() {
    loadingLessonId = 0  // Use 0 to indicate generic loading

    Task {
      let versions = Versions.sharedInstance
      let service = PlaygroundService.shared
      let channel = service.generateChannelId()

      await SnackEditingSession.shared.setupSessionWithCode(
        code: PlaygroundService.defaultCode,
        channel: channel
      )

      let url = service.buildRuntimeUrl(channel: channel, sdkVersion: versions.sdkVersion)

      await MainActor.run {
        viewModel.openApp(url: url)
        loadingLessonId = nil
      }
    }
  }

  private func forkTemplatePlayground() {
    loadingLessonId = 0  // Use 0 to indicate generic loading

    Task {
      let versions = Versions.sharedInstance
      let service = PlaygroundService.shared
      let channel = service.generateChannelId()

      await SnackEditingSession.shared.setupSession(
        snackId: service.getTemplateSnackId(),
        channel: channel,
        isStaging: false
      )

      let url = service.buildRuntimeUrl(channel: channel, sdkVersion: versions.sdkVersion)

      await MainActor.run {
        viewModel.openApp(url: url)
        loadingLessonId = nil
      }
    }
  }
}
