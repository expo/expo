// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI

/// A SwiftUI view that interprets descriptor dictionaries produced by the
/// worklet runtime's `createElement` into native SwiftUI views.
///
/// Descriptor format:
/// ```
/// {
///   "type": "HStack",
///   "props": { "spacing": 8 },
///   "children": [ { "type": "Text", "props": { "content": "Hello" }, "children": [] } ]
/// }
/// ```
struct DynamicView: SwiftUI.View {
  let descriptor: [String: Any]?

  var body: some SwiftUI.View {
    if let descriptor {
      buildView(from: descriptor)
    } else {
      EmptyView()
    }
  }

  @ViewBuilder
  private func buildView(from node: [String: Any]) -> some SwiftUI.View {
    let type = node["type"] as? String ?? ""
    let props = node["props"] as? [String: Any] ?? [:]
    let children = node["children"] as? [[String: Any]] ?? []

    switch type {
    case "Text", "__text":
      buildText(props: props)

    case "HStack":
      HStack(
        alignment: verticalAlignment(from: props["alignment"] as? String),
        spacing: cgFloat(from: props["spacing"])
      ) {
        buildChildren(children)
      }

    case "VStack":
      VStack(
        alignment: horizontalAlignment(from: props["alignment"] as? String),
        spacing: cgFloat(from: props["spacing"])
      ) {
        buildChildren(children)
      }

    case "ZStack":
      ZStack {
        buildChildren(children)
      }

    case "Image":
      buildImage(props: props)

    case "Label":
      buildLabel(props: props)

    case "Spacer":
      Spacer(minLength: cgFloat(from: props["minLength"]))

    case "Divider":
      Divider()

    case "Group":
      Group {
        buildChildren(children)
      }

    default:
      // Unknown type: render children in a Group as fallback
      if !children.isEmpty {
        Group {
          buildChildren(children)
        }
      } else {
        EmptyView()
      }
    }
  }

  // MARK: - Component Builders

  @ViewBuilder
  private func buildText(props: [String: Any]) -> some SwiftUI.View {
    let content = props["content"] as? String ?? ""
    let text = SwiftUI.Text(content)

    if let colorName = props["color"] as? String, let color = colorFromString(colorName) {
      text.foregroundColor(color)
    } else {
      text
    }
  }

  @ViewBuilder
  private func buildImage(props: [String: Any]) -> some SwiftUI.View {
    if let systemName = props["systemName"] as? String {
      let image = Image(systemName: systemName)

      if let size = cgFloat(from: props["size"]) {
        if let colorName = props["color"] as? String, let color = colorFromString(colorName) {
          image
            .font(.system(size: size))
            .foregroundColor(color)
        } else {
          image.font(.system(size: size))
        }
      } else if let colorName = props["color"] as? String, let color = colorFromString(colorName) {
        image.foregroundColor(color)
      } else {
        image
      }
    } else {
      EmptyView()
    }
  }

  @ViewBuilder
  private func buildLabel(props: [String: Any]) -> some SwiftUI.View {
    let title = props["title"] as? String ?? ""
    if let systemImage = props["systemImage"] as? String {
      Label(title, systemImage: systemImage)
    } else {
      SwiftUI.Text(title)
    }
  }

  // MARK: - Children

  @ViewBuilder
  private func buildChildren(_ children: [[String: Any]]) -> some SwiftUI.View {
    ForEach(Array(children.enumerated()), id: \.offset) { _, child in
      DynamicView(descriptor: child)
    }
  }

  // MARK: - Helpers

  private func cgFloat(from value: Any?) -> CGFloat? {
    if let doubleVal = value as? Double {
      return CGFloat(doubleVal)
    }
    if let intVal = value as? Int {
      return CGFloat(intVal)
    }
    return nil
  }

  private func verticalAlignment(from string: String?) -> VerticalAlignment {
    switch string {
    case "top": return .top
    case "bottom": return .bottom
    case "firstTextBaseline": return .firstTextBaseline
    case "lastTextBaseline": return .lastTextBaseline
    default: return .center
    }
  }

  private func horizontalAlignment(from string: String?) -> HorizontalAlignment {
    switch string {
    case "leading": return .leading
    case "trailing": return .trailing
    default: return .center
    }
  }

  private func colorFromString(_ string: String) -> Color? {
    switch string {
    case "red": return .red
    case "blue": return .blue
    case "green": return .green
    case "yellow": return .yellow
    case "orange": return .orange
    case "purple": return .purple
    case "pink": return .pink
    case "gray", "grey": return .gray
    case "white": return .white
    case "black": return .black
    case "primary": return .primary
    case "secondary": return .secondary
    default: return nil
    }
  }
}
