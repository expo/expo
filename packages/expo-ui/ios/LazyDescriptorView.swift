// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI

/// Renders a single lazy-list descriptor dictionary as a SwiftUI view.
/// Shared between the precomputed (`LazyListForEachView`) and worklet-driven
/// (`LazyListWorkletForEachView`) lazy variants.
struct DescriptorView: View {
  let descriptor: [String: Any]

  var body: some View {
    let type = descriptor["type"] as? String ?? ""
    switch type {
    case "Text":
      Text(descriptor["value"] as? String ?? "")
        .applyFont(descriptor["font"] as? String)
        .applyForeground(descriptor["foregroundColor"] as? String)
    case "Image":
      Image(systemName: descriptor["systemName"] as? String ?? "")
        .applyForeground(descriptor["foregroundColor"] as? String)
    case "HStack":
      HStack(spacing: cgFloat(descriptor["spacing"])) {
        ChildrenView(children: descriptor["children"] as? [[String: Any]] ?? [])
      }
    case "VStack":
      VStack(alignment: .leading, spacing: cgFloat(descriptor["spacing"])) {
        ChildrenView(children: descriptor["children"] as? [[String: Any]] ?? [])
      }
    default:
      EmptyView()
    }
  }
}

struct IdentifiedDescriptor: Identifiable {
  let id: String
  let descriptor: [String: Any]
}

func identifyDescriptors(_ items: [[String: Any]]) -> [IdentifiedDescriptor] {
  items.enumerated().map { index, descriptor in
    let id = (descriptor["id"] as? String) ?? "__idx_\(index)"
    return IdentifiedDescriptor(id: id, descriptor: descriptor)
  }
}

private struct ChildrenView: View {
  let children: [[String: Any]]

  var body: some View {
    ForEach(identifyDescriptors(children)) { item in
      DescriptorView(descriptor: item.descriptor)
    }
  }
}

private func cgFloat(_ value: Any?) -> CGFloat? {
  if let n = value as? Double { return CGFloat(n) }
  if let n = value as? Int { return CGFloat(n) }
  return nil
}

// MARK: - Minimal modifier translation

private extension Text {
  func applyFont(_ name: String?) -> Text {
    guard let name, let font = swiftUIFont(name) else { return self }
    return self.font(font)
  }

  func applyForeground(_ name: String?) -> Text {
    guard let name, let color = swiftUIColor(name) else { return self }
    return self.foregroundColor(color)
  }
}

private extension Image {
  func applyForeground(_ name: String?) -> some View {
    guard let name, let color = swiftUIColor(name) else { return AnyView(self) }
    return AnyView(self.foregroundColor(color))
  }
}

private func swiftUIFont(_ name: String) -> Font? {
  switch name {
  case "largeTitle":  return .largeTitle
  case "title":       return .title
  case "title2":      return .title2
  case "title3":      return .title3
  case "headline":    return .headline
  case "subheadline": return .subheadline
  case "body":        return .body
  case "callout":     return .callout
  case "footnote":    return .footnote
  case "caption":     return .caption
  case "caption2":    return .caption2
  default:            return nil
  }
}

private func swiftUIColor(_ name: String) -> Color? {
  switch name {
  case "primary":   return .primary
  case "secondary": return .secondary
  case "red":       return .red
  case "orange":    return .orange
  case "yellow":    return .yellow
  case "green":     return .green
  case "mint":      return .mint
  case "teal":      return .teal
  case "cyan":      return .cyan
  case "blue":      return .blue
  case "indigo":    return .indigo
  case "purple":    return .purple
  case "pink":      return .pink
  case "brown":     return .brown
  case "black":     return .black
  case "white":     return .white
  case "gray":      return .gray
  default:          return nil
  }
}
