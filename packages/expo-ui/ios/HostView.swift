// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal enum ExpoColorScheme: String, Enumerable {
  case light
  case dark

  func toColorScheme() -> ColorScheme {
    switch self {
    case .light:
      return .light
    case .dark:
      return .dark
    }
  }
}

internal final class HostViewProps: ExpoSwiftUI.ViewProps {
  @Field var colorScheme: ExpoColorScheme?
  var onLayoutContent = EventDispatcher()
}

struct HostView: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
  @ObservedObject var props: HostViewProps

  var body: some View {
    return ZStack(alignment: .topLeading) {
      Children()
    }
    .modifier(ColorSchemeModifier(colorScheme: props.colorScheme?.toColorScheme()))
    .modifier(GeometryChangeModifier(props: props))
  }
}

/**
 A ViewModifier that listens for view size change the dispatch the `onLayoutContent` event
 */
private struct GeometryChangeModifier: ViewModifier {
  let props: HostViewProps

  private func dispatchOnLayoutContent(_ size: CGSize) {
    props.onLayoutContent([
      "width": size.width,
      "height": size.height
    ])
  }

  func body(content: Content) -> some View {
    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
      content.onGeometryChange(for: CGSize.self, of: { proxy in proxy.size }, action: {
        dispatchOnLayoutContent($0)
      })
    } else {
      content.overlay {
        GeometryReader { geometry in
          Color.clear
            .hidden()
            .onAppear {
              dispatchOnLayoutContent(geometry.size)
            }
            .onChange(of: geometry.size) { dispatchOnLayoutContent($0) }
        }
      }
    }
  }
}

private struct ColorSchemeModifier: ViewModifier {
  let colorScheme: ColorScheme?

  func body(content: Content) -> some View {
    if let colorScheme {
      content.environment(\.colorScheme, colorScheme)
    } else {
      content
    }
  }
}
