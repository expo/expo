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
      .foregroundStyle(Color.primary)
  }

  func monospacedCaptionSecondary() -> some View {
    self
      .font(.system(.caption, design: .monospaced))
      .foregroundStyle(Color.secondary)
  }
}

extension View {
  func systemGroupedBackground() -> some View {
    return self.background(Color.expoSystemGroupedBackground)
  }

  @ViewBuilder
  func maxContentWidth() -> some View {
#if os(iOS)
    frame(maxWidth: 600)
      .frame(maxWidth: .infinity)
#else
    self
#endif
  }
}

func getDevLauncherBundle() -> Bundle? {
  if let bundle = resourceBundle(named: "EXDevLauncher", in: .main) {
    return bundle
  }
  // A prebuilt framework holds the bundle inside itself, under the name SwiftPM gives it.
  return resourceBundle(named: "expo-dev-launcher_EXDevLauncher", in: Bundle(for: EXDevLauncherUtils.self)) ?? .main
}

private func resourceBundle(named name: String, in container: Bundle) -> Bundle? {
  guard let url = container.url(forResource: name, withExtension: "bundle") else {
    return nil
  }
  return Bundle(url: url)
}
