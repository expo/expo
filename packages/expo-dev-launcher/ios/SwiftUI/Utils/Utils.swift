// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

func getAvatarColor(for firstLetter: String) -> (background: Color, foreground: Color) {
  switch firstLetter.lowercased() {
  case "a"..."d":
    return (Color.blue.opacity(0.2), Color.blue)
  case "e"..."h":
    return (Color.green.opacity(0.2), Color.green)
  case "i"..."l":
    return (Color.yellow.opacity(0.2), Color.orange)
  case "m"..."p":
    return (Color.orange.opacity(0.2), Color.orange)
  case "q"..."t":
    return (Color.red.opacity(0.2), Color.red)
  case "u"..."z":
    return (Color.pink.opacity(0.2), Color.pink)
  default:
    return (Color.purple.opacity(0.2), Color.purple)
  }
}

func formatTimestamp(_ date: Date) -> String {
  let formatter = DateFormatter()
  formatter.dateStyle = .medium
  formatter.timeStyle = .medium
  return formatter.string(from: date)
}

func formatDate(_ date: Date) -> String {
  let formatter = DateFormatter()
  formatter.dateStyle = .medium
  formatter.timeStyle = .none
  return formatter.string(from: date)
}

extension Text {
  func monospacedCaption() -> some View {
    self
      .font(.system(.caption, design: .monospaced))
      .foregroundColor(.primary)
  }

  func monospacedCaptionSecondary() -> some View {
    self
      .font(.system(.caption, design: .monospaced))
      .foregroundColor(.secondary)
  }
}

extension View {
  func systemGroupedBackground() -> some View {
    #if os(tvOS)
    return self
    #else
    return self.background(Color(.systemGroupedBackground))
    #endif
  }
}

func getDevLauncherBundle() -> Bundle? {
  if let bundleURL = Bundle.main.url(forResource: "EXDevLauncher", withExtension: "bundle") {
    if let bundle = Bundle(url: bundleURL) {
      return bundle
    }
  }

  // fallback to the main bundle
  return .main
}
