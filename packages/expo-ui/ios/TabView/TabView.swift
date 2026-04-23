// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class TabViewProps: UIBaseViewProps {
  @Field var selection: String?
  @Field var defaultSelection: String?
  var onSelectionChange = EventDispatcher()
}

internal struct TabView: ExpoSwiftUI.View {
  @ObservedObject var props: TabViewProps
  // Uncontrolled-mode backing store. Seeded in .onAppear (not init) because
  // props are empty at construction time — real values arrive later.
  @State private var internalSelection = ""
  @State private var didApplyDefaultSelection = false

  init(props: TabViewProps) {
    self.props = props
  }

  var body: some View {
    let children = props.children ?? []
    let tabs = children.compactMap(Self.unwrapTab)

    // No default tabViewStyle — the innermost modifier wins, so a default
    // here would shadow the user's. Callers must supply one explicitly.
    Group {
      if #available(iOS 18.0, tvOS 18.0, *) {
        valueBasedTabView(tabs)
      } else {
        legacyTabView(children, tabs: tabs)
      }
    }
    .onAppear {
      guard !didApplyDefaultSelection else { return }
      didApplyDefaultSelection = true
      if props.selection == nil {
        internalSelection = props.defaultSelection ?? tabs.first?.props.value ?? ""
      }
    }
  }

  // MARK: - iOS 18+: value-based Tab(value:) API

  @available(iOS 18.0, tvOS 18.0, *)
  @ViewBuilder
  private func valueBasedTabView(_ tabs: [Tab]) -> some View {
    SwiftUI.TabView(selection: stringBinding) {
      ForEach(tabs, id: \.props.value) { tab in
        // Render children directly (not tab.childView) to avoid double-
        // decorating with the iOS 17 fallback .tabItem.
        SwiftUI.Tab(
          tab.props.label ?? "",
          systemImage: tab.props.systemImage ?? "",
          value: tab.props.value
        ) {
          Self.tabContent(for: tab.props.children ?? [])
        }
#if !os(tvOS)
        .badge(Self.badgeText(from: tab.props.modifiers))
#endif
      }
    }
  }

  private static func badgeText(from modifiers: ModifierArray?) -> Text? {
    guard let modifiers,
          let badgeModifier = modifiers.first(where: { $0["$type"] as? String == "badge" }),
          let value = badgeModifier["value"] as? String else {
      return nil
    }
    return Text(value)
  }

  private static func tabContent(for children: [any ExpoSwiftUI.AnyChild]) -> AnyView {
    AnyView(
      ForEach(children, id: \.id) { grandchild in
        let view: any View = grandchild.childView
        AnyView(view)
      }
    )
  }

  // MARK: - iOS < 18 fallback
  // SwiftUI's pre-18 TabView only supports index-based selection, so we
  // map string tab values to/from indices.

  @ViewBuilder
  private func legacyTabView(_ children: [any ExpoSwiftUI.AnyChild], tabs: [Tab]) -> some View {
    SwiftUI.TabView(selection: indexBinding(tabs: tabs)) {
      ForEach(Array(children.enumerated()), id: \.element.id) { index, child in
        let view: any View = child.childView
        AnyView(view)
          .tag(index)
      }
    }
  }

  // Selection from JS is a Tab value (string) — resolve it to an index for
  // the getter, and map back to the value for the event.
  private func indexBinding(tabs: [Tab]) -> Binding<Int> {
    if let selection = props.selection {
      return Binding(
        get: {
          tabs.firstIndex(where: { $0.props.value == selection }) ?? 0
        },
        set: { newValue in
          let current = tabs.firstIndex(where: { $0.props.value == selection })
          if current != newValue, newValue < tabs.count {
            props.onSelectionChange(["selection": tabs[newValue].props.value])
          }
        }
      )
    }
    return Binding(
      get: {
        tabs.firstIndex(where: { $0.props.value == internalSelection }) ?? 0
      },
      set: { newValue in
        if newValue < tabs.count {
          internalSelection = tabs[newValue].props.value
          props.onSelectionChange(["selection": internalSelection])
        }
      }
    )
  }

  // MARK: - Value-based binding (iOS 18+)

  private var stringBinding: Binding<String> {
    if let selection = props.selection {
      return Binding(
        get: { selection },
        set: { newValue in
          if selection != newValue {
            props.onSelectionChange(["selection": newValue])
          }
        }
      )
    }
    return Binding(
      get: { internalSelection },
      set: { newValue in
        internalSelection = newValue
        props.onSelectionChange(["selection": newValue])
      }
    )
  }

  // MARK: - Helpers

  private static func unwrapTab(_ child: any ExpoSwiftUI.AnyChild) -> Tab? {
    if let tab = child as? Tab { return tab }
    if let wrapper = child as? ExpoSwiftUI.ViewWrapper {
      return wrapper.getWrappedView() as? Tab
    }
    return nil
  }
}
