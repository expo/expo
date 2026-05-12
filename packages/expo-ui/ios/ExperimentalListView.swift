// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal final class ExperimentalListProps: UIBaseViewProps {
  @Field var data: [Any] = []
  @Field var renderItem: WorkletCallback?
  @Field var spacing: Double = 8
}

internal struct ExperimentalListView: ExpoSwiftUI.View {
  @ObservedObject var props: ExperimentalListProps

  init(props: ExperimentalListProps) {
    self.props = props
  }

  var body: some View {
    ScrollView {
      LazyVStack(alignment: .leading, spacing: CGFloat(props.spacing)) {
        ForEach(0..<props.data.count, id: \.self) { index in
          ExperimentalListItem(
            item: props.data[index],
            index: index,
            renderItem: props.renderItem
          )
        }
      }
    }
  }
}

private struct ExperimentalListItem: View {
  let item: Any
  let index: Int
  let renderItem: WorkletCallback?

  var body: some View {
    if let description = renderItem?.invokeReturning(arguments: [item, index]) as? [String: Any] {
      ViewDescriptionRenderer(description: description)
    } else {
      EmptyView()
    }
  }
}

private struct ViewDescriptionRenderer: View {
  let description: [String: Any]

  var body: some View {
    let type = description["type"] as? String ?? ""
    switch type {
    case "VStack":
      VStack(alignment: horizontalAlignment(description["alignment"] as? String),
             spacing: (description["spacing"] as? Double).map { CGFloat($0) }) {
        renderChildren(description["children"])
      }
    case "HStack":
      HStack(alignment: verticalAlignment(description["alignment"] as? String),
             spacing: (description["spacing"] as? Double).map { CGFloat($0) }) {
        renderChildren(description["children"])
      }
    case "Text":
      textView(description)
    case "Spacer":
      Spacer()
    case "Image":
      imageView(description)
    default:
      EmptyView()
    }
  }

  @ViewBuilder
  private func renderChildren(_ raw: Any?) -> some View {
    if let children = raw as? [[String: Any]] {
      ForEach(0..<children.count, id: \.self) { i in
        ViewDescriptionRenderer(description: children[i])
      }
    }
  }

  private func textView(_ desc: [String: Any]) -> some View {
    var text = Text(desc["text"] as? String ?? "")
      .font(font(desc["font"] as? String))
    if let weight = fontWeight(desc["weight"] as? String) {
      text = text.fontWeight(weight)
    }
    return text.foregroundColor(color(desc["foregroundColor"] as? String))
  }

  private func imageView(_ desc: [String: Any]) -> some View {
    Image(systemName: desc["systemImage"] as? String ?? "")
      .foregroundColor(color(desc["foregroundColor"] as? String))
  }

  private func font(_ raw: String?) -> Font {
    switch raw {
    case "largeTitle": return .largeTitle
    case "title": return .title
    case "title2": return .title2
    case "title3": return .title3
    case "headline": return .headline
    case "subheadline": return .subheadline
    case "callout": return .callout
    case "caption": return .caption
    case "caption2": return .caption2
    case "footnote": return .footnote
    default: return .body
    }
  }

  private func fontWeight(_ raw: String?) -> Font.Weight? {
    switch raw {
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

  private func horizontalAlignment(_ raw: String?) -> HorizontalAlignment {
    switch raw {
    case "leading": return .leading
    case "trailing": return .trailing
    default: return .center
    }
  }

  private func verticalAlignment(_ raw: String?) -> VerticalAlignment {
    switch raw {
    case "top": return .top
    case "bottom": return .bottom
    default: return .center
    }
  }

  private func color(_ raw: String?) -> Color? {
    guard let raw else { return nil }
    if raw.hasPrefix("#") {
      return Color(hex: raw)
    }
    switch raw {
    case "primary": return .primary
    case "secondary": return .secondary
    case "red": return .red
    case "orange": return .orange
    case "yellow": return .yellow
    case "green": return .green
    case "mint": return .mint
    case "teal": return .teal
    case "cyan": return .cyan
    case "blue": return .blue
    case "indigo": return .indigo
    case "purple": return .purple
    case "pink": return .pink
    case "brown": return .brown
    case "white": return .white
    case "gray": return .gray
    case "black": return .black
    default: return nil
    }
  }
}

private extension Color {
  init?(hex: String) {
    var s = hex
    if s.hasPrefix("#") { s.removeFirst() }
    guard let v = UInt32(s, radix: 16) else { return nil }
    let r, g, b, a: Double
    switch s.count {
    case 6:
      r = Double((v >> 16) & 0xff) / 255
      g = Double((v >> 8) & 0xff) / 255
      b = Double(v & 0xff) / 255
      a = 1
    case 8:
      r = Double((v >> 24) & 0xff) / 255
      g = Double((v >> 16) & 0xff) / 255
      b = Double((v >> 8) & 0xff) / 255
      a = Double(v & 0xff) / 255
    default:
      return nil
    }
    self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
  }
}
