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
      .applyPadding(props)

    case "VStack":
      VStack(
        alignment: horizontalAlignment(from: props["alignment"] as? String),
        spacing: cgFloat(from: props["spacing"])
      ) {
        buildChildren(children)
      }
      .applyPadding(props)

    case "ZStack":
      ZStack {
        buildChildren(children)
      }
      .applyPadding(props)

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
    let weight = fontWeight(from: props["fontWeight"] as? String)
    let fontSize = cgFloat(from: props["fontSize"])
    let color: Color? = (props["color"] as? String).flatMap { colorFromString($0) }

    styledText(SwiftUI.Text(content), weight: weight, fontSize: fontSize, color: color)
  }

  private func styledText(_ text: SwiftUI.Text, weight: Font.Weight?, fontSize: CGFloat?, color: Color?) -> some SwiftUI.View {
    let styled = weight != nil ? text.fontWeight(weight!) : text
    return styled
      .font(fontSize.map { Font.system(size: $0) })
      .foregroundColor(color)
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

  private func fontWeight(from string: String?) -> Font.Weight? {
    switch string {
    case "ultraLight": return .ultraLight
    case "thin": return .thin
    case "light": return .light
    case "regular": return .regular
    case "medium": return .medium
    case "semibold": return .semibold
    case "bold": return .bold
    case "heavy": return .heavy
    case "black": return .black
    default: return nil
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

// MARK: - Padding Modifier

private extension SwiftUI.View {
  @ViewBuilder
  func applyPadding(_ props: [String: Any]) -> some SwiftUI.View {
    if let padding = props["padding"] as? Double {
      self.padding(CGFloat(padding))
    } else if let padding = props["padding"] as? Int {
      self.padding(CGFloat(padding))
    } else if let paddings = props["padding"] as? [String: Any] {
      self.padding(
        .init(
          top: (paddings["top"] as? Double).map { CGFloat($0) } ?? 0,
          leading: (paddings["leading"] as? Double).map { CGFloat($0) } ?? 0,
          bottom: (paddings["bottom"] as? Double).map { CGFloat($0) } ?? 0,
          trailing: (paddings["trailing"] as? Double).map { CGFloat($0) } ?? 0
        )
      )
    } else {
      self
    }
  }
}
