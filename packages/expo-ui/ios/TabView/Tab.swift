// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class TabProps: UIBaseViewProps {
  @Field var value: String
  @Field var label: String?
  @Field var systemImage: String?
  @Field var uiImage: String?
}

// Marker view whose props are read by the enclosing TabView to build
// SwiftUI.Tab on iOS 18+. Falls back to .tabItem on iOS 17.
internal struct Tab: ExpoSwiftUI.View {
  @ObservedObject var props: TabProps

  init(props: TabProps) {
    self.props = props
  }

  // iOS 17 fallback — on iOS 18+ the parent reads props directly.
  var body: some View {
    Children()
      .tabItem {
        if let icon = Self.templateImage(from: props.uiImage) {
          if let label = props.label {
            Label { Text(label) } icon: { icon }
          } else {
            icon
          }
        } else if let label = props.label, let systemImage = props.systemImage {
          Label(label, systemImage: systemImage)
        } else if let label = props.label {
          Text(label)
        } else if let systemImage = props.systemImage {
          Image(systemName: systemImage)
        }
      }
  }

  // Loads `uiImage` as a template, so the tab bar tints it like an SF Symbol. A `@2x` / `@3x`
  // suffix in the file name (as in Metro's scaled assets) sets the image's scale, so the icon
  // keeps its point size.
  static func templateImage(from uri: String?) -> Image? {
    guard let uri, let url = URL(string: uri), let data = try? Data(contentsOf: url) else {
      return nil
    }
#if os(macOS)
    guard let image = UIImage(data: data) else { return nil }
#else
    guard let image = UIImage(data: data, scale: scale(of: url)) else { return nil }
#endif
    return Image(uiImage: image).renderingMode(.template)
  }

  private static func scale(of url: URL) -> CGFloat {
    let name = url.deletingPathExtension().lastPathComponent
    guard let range = name.range(of: "@[1-9]x$", options: .regularExpression),
          let scale = Double(name[range].dropFirst().dropLast()) else {
      return 1
    }
    return CGFloat(scale)
  }
}
