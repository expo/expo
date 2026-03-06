// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

enum OnboardingTopic: String, CaseIterable, Identifiable {
  case styling = "Styling & Layout"
  case animations = "Animations & Gestures"
  case deviceFeatures = "Device Features"
  case course = "Taking a course"

  var id: String { rawValue }

  var icon: String {
    switch self {
    case .styling: return "app.grid"
    case .animations: return "circle.grid.cross.up.filled"
    case .deviceFeatures: return "faceid"
    case .course: return "graduationcap"
    }
  }

  var subtitle: String {
    switch self {
    case .styling: return "Make things look great on any screen"
    case .animations: return "Bring your apps to life with motion"
    case .deviceFeatures: return "Use the camera, haptics, and notifications"
    case .course: return "I'm using Expo Go for a class or tutorial"
    }
  }
}

enum OnboardingPage: Int, CaseIterable {
  case welcome = 0
  case topics = 1
  case methods = 2
  case ready = 3
}

@MainActor
class OnboardingViewModel: ObservableObject {
  @Published var currentPage: OnboardingPage = .welcome
  @Published var selectedTopics: Set<OnboardingTopic> = []

  var totalPages: Int {
    OnboardingPage.allCases.count
  }

  func advance() {
    guard let nextPage = OnboardingPage(rawValue: currentPage.rawValue + 1) else {
      return
    }
    withAnimation(.easeInOut(duration: 0.3)) {
      currentPage = nextPage
    }
  }

  func skip() {
    advance()
  }

  func toggleTopic(_ topic: OnboardingTopic) {
    if selectedTopics.contains(topic) {
      selectedTopics.remove(topic)
    } else {
      selectedTopics.insert(topic)
    }
  }

  func persistTopicSelections() {
    let selections = selectedTopics.map(\.rawValue)
    if !selections.isEmpty {
      UserDefaults.standard.set(selections, forKey: "ExpoGoOnboardingTopics")
    }
  }
}
