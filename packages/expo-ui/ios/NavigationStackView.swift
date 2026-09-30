// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class NavigationStackViewProps: UIBaseViewProps {
  @Field var path: [String]?
  var onPathChange = EventDispatcher()
}

private struct NavigationDestinationContent: View {
  @ObservedObject var props: NavigationStackViewProps
  let value: String

  var body: some View {
    props.children?
      .slots("destination")
      .first { $0.extra("value", as: String.self) == value }
  }
}

internal struct NavigationStackView: ExpoSwiftUI.View {
  @ObservedObject var props: NavigationStackViewProps
  @State private var uncontrolledPath: [String] = []

  init(props: NavigationStackViewProps) {
    self.props = props
  }

  private var pathBinding: Binding<[String]> {
    let props = props
    let uncontrolled = $uncontrolledPath
    return Binding(
      get: { props.path ?? uncontrolled.wrappedValue },
      set: { newPath in
        guard (props.path ?? uncontrolled.wrappedValue) != newPath else {
          return
        }
        if props.path == nil {
          uncontrolled.wrappedValue = newPath
        }
        props.onPathChange(["path": newPath])
      }
    )
  }

  var body: some View {
    NavigationStack(path: pathBinding) {
      rootContent
        .navigationDestination(for: String.self) { value in
          NavigationDestinationContent(props: props, value: value)
        }
    }
  }

  @ViewBuilder
  private var rootContent: some View {
    ForEach(props.children?.withoutSlot("destination") ?? [], id: \.id) { child in
      let view: any View = child.childView
      AnyView(view)
    }
  }
}
