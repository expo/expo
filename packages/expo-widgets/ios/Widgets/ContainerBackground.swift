import SwiftUI
import WidgetKit

public extension View {
  // Widgets that never call `containerBackground(_:for:)` render as a system placeholder (#46200).
  // A layout sets its own with the `containerBackground` modifier, applied inside the tree, so
  // calling it here unconditionally would override it (#44192).
  @ViewBuilder
  func fallbackContainerBackground(forLayout node: [String: Any]) -> some View {
    if #available(iOS 17.0, *), !declaresContainerBackground(node) {
      // The background is dropped along with a layout that resolves to `EmptyView`, so it needs a
      // subtree that is always there. Zero-sized, so the stack still measures just the content.
      ZStack {
        Color.clear.frame(width: 0, height: 0)
        self
      }
      .containerBackground(.fill.tertiary, for: .widget)
    } else {
      self
    }
  }
}

private let containerBackgroundModifierType = "containerBackground"
private let widgetContainerPlacement = "widget"

private func declaresContainerBackground(_ node: [String: Any]) -> Bool {
  guard let props = node["props"] as? [String: Any] else {
    return false
  }
  let modifiers = props["modifiers"] as? [Any] ?? []
  let declaresBackground = modifiers.contains { modifier in
    return setsWidgetContainerBackground(modifier)
  }
  return declaresBackground || childNodes(of: props).contains(where: declaresContainerBackground)
}

// Mirrors `ContainerBackgroundModifier` in `@expo/ui`: it needs both a color and a placement, and
// from iOS 18 it honors the placement, where iOS 17 coerces every placement to `.widget`.
private func setsWidgetContainerBackground(_ modifier: Any) -> Bool {
  guard let modifier = modifier as? [String: Any],
        modifier["$type"] as? String == containerBackgroundModifierType,
        let color = modifier["color"], !(color is NSNull),
        let container = modifier["container"] as? String else {
    return false
  }
  if #available(iOS 18.0, *) {
    return container == widgetContainerPlacement
  }
  return true
}

private func childNodes(of props: [String: Any]) -> [[String: Any]] {
  if let children = props["children"] as? [Any] {
    return flattenChildNodes(children)
  }
  if let child = props["children"] as? [String: Any] {
    return [child]
  }
  return []
}
