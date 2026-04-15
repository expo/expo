// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class TabProps: UIBaseViewProps {
  // The selection value associated with this tab (matched against the parent
  // TabView's `selection` prop). Either a number or a string.
  @Field var value: Either<Double, String>?
  @Field var label: String?
  @Field var systemImage: String?
}

// `Tab` is a marker view: its props (label/systemImage/value) are read by the
// enclosing `TabView` to construct a SwiftUI.Tab on iOS 18+. If a `Tab` is
// rendered outside a TabView, it falls back to rendering its children in a
// plain VStack — no crash, just no tab semantics.
internal struct Tab: ExpoSwiftUI.View {
  @ObservedObject var props: TabProps

  init(props: TabProps) {
    self.props = props
  }

  // On iOS 18+ the parent TabView reads our props and constructs a
  // `SwiftUI.Tab(value:)` directly — `body` here is unused. On iOS 17 the
  // parent falls back to the legacy index-tagged path; this body renders the
  // Tab's children with a synthesized `.tabItem` so labels/icons still appear.
  var body: some View {
    Children()
      .tabItem {
        if let label = props.label, let systemImage = props.systemImage {
          Label(label, systemImage: systemImage)
        } else if let label = props.label {
          Text(label)
        } else if let systemImage = props.systemImage {
          Image(systemName: systemImage)
        }
      }
  }

  // Selection value as an `AnyHashable` (String or Double), used by TabView
  // to wire up `SwiftUI.Tab(value:)` and the binding.
  var hashableValue: AnyHashable? {
    guard let value = props.value else { return nil }
    if let stringValue: String = value.get() {
      return stringValue
    }
    if let doubleValue: Double = value.get() {
      return doubleValue
    }
    return nil
  }
}
