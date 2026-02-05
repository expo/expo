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
    .onChange(of: viewModel.isLoadingApp) { isLoading in
      // Clear local loading state when global loading completes
      if !isLoading {
        loadingLessonId = nil
      }
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

    let service = PlaygroundService.shared
    let channel = service.generateChannelId()

    // Build URL
    let url = service.buildRuntimeUrl(
      channel: channel,
      sdkVersion: Versions.sharedInstance.sdkVersion
    )

    // Convert lesson code to the format expected by openApp
    var codeDict: [String: [String: Any]] = [:]
    for (path, file) in lesson.snackFiles {
      codeDict[path] = [
        "contents": file.contents,
        "type": file.isAsset ? "ASSET" : "CODE"
      ]
    }

    // Build snack params
    let snackParams: NSDictionary = [
      "channel": channel,
      "snackId": lesson.snackDisplayName,
      "code": codeDict,
      "dependencies": Lesson.snackDependencies,
      "isLesson": true,
      "lessonId": lesson.id,
      "lessonDescription": lesson.shortDescription
    ]

    // Open app with snack params - session setup happens inside openApp
    viewModel.openApp(url: url, snackParams: snackParams)
  }

  // MARK: - Playground Creation (kept for future use)

  private func createNewPlayground() {
    loadingLessonId = 0  // Use 0 to indicate generic loading

    let versions = Versions.sharedInstance
    let service = PlaygroundService.shared
    let channel = service.generateChannelId()

    let url = service.buildRuntimeUrl(channel: channel, sdkVersion: versions.sdkVersion)

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
      "code": codeDict
    ]

    viewModel.openApp(url: url, snackParams: snackParams)
  }

  private func forkTemplatePlayground() {
    loadingLessonId = 0  // Use 0 to indicate generic loading

    let versions = Versions.sharedInstance
    let service = PlaygroundService.shared
    let channel = service.generateChannelId()

    let url = service.buildRuntimeUrl(channel: channel, sdkVersion: versions.sdkVersion)

    let snackParams: NSDictionary = [
      "channel": channel,
      "snackId": service.getTemplateSnackId(),
      "isStaging": false
    ]

    viewModel.openApp(url: url, snackParams: snackParams)
  }
}
