import SwiftUI
import WidgetKit

public extension View {
  // Since iOS 17, WidgetKit replaces a widget that never calls `containerBackground(_:for:)`
  // with a "Please adopt containerBackground API" placeholder.
  // https://github.com/expo/expo/issues/46200
  // Layouts set their own background with the `containerBackground` modifier, which is applied
  // inside the layout tree, so an unconditional call here would override it (#44192).
  @ViewBuilder
  func fallbackContainerBackground(forLayout node: [String: Any]) -> some View {
    if #available(iOS 17.0, *), !declaresContainerBackground(node) {
      containerBackground(.fill.tertiary, for: .widget)
    } else {
      self
    }
  }
}

private let containerBackgroundModifierType = "containerBackground"

private func declaresContainerBackground(_ node: [String: Any]) -> Bool {
  guard let props = node["props"] as? [String: Any] else {
    return false
  }
  let modifiers = props["modifiers"] as? [Any] ?? []
  let declaresBackground = modifiers.contains { modifier in
    return (modifier as? [String: Any])?["$type"] as? String == containerBackgroundModifierType
  }
  return declaresBackground || childNodes(of: props).contains(where: declaresContainerBackground)
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
