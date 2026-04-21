// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class TabViewProps: UIBaseViewProps {
  @Field var selection: Either<Double, String>?
  @Field var defaultSelection: Either<Double, String>?
  var onSelectionChange = EventDispatcher()
}

internal struct TabView: ExpoSwiftUI.View {
  @ObservedObject var props: TabViewProps
  // Uncontrolled-mode backing store. Seeded in .onAppear (not init) because
  // props are empty at construction time — real values arrive later.
  @State private var internalSelection: AnyHashable = 0
  @State private var didApplyDefaultSelection = false

  init(props: TabViewProps) {
    self.props = props
  }

  var body: some View {
    let children = props.children ?? []
    let tabs = children.compactMap(Self.unwrapTab)
    let usesTabChildren = tabs.count == children.count && !children.isEmpty

    // No default tabViewStyle — the innermost modifier wins, so a default
    // here would shadow the user's. Callers must supply one explicitly.
    Group {
      if #available(iOS 18.0, tvOS 18.0, *), usesTabChildren {
        valueBasedTabView(tabs)
      } else {
        indexBasedTabView(children, tabs: usesTabChildren ? tabs : nil)
      }
    }
    .onAppear {
      guard !didApplyDefaultSelection else { return }
      didApplyDefaultSelection = true
      if props.selection == nil, let initial = Self.hashable(from: props.defaultSelection) {
        internalSelection = initial
      }
    }
  }

  // MARK: - iOS 18+: value-based Tab(value:) API

  @available(iOS 18.0, tvOS 18.0, *)
  @ViewBuilder
  private func valueBasedTabView(_ tabs: [Tab]) -> some View {
    SwiftUI.TabView(selection: hashableBinding) {
      ForEach(tabs, id: \.hashableValue) { tab in
        // Render children directly (not tab.childView) to avoid double-
        // decorating with the iOS 17 fallback .tabItem.
        SwiftUI.Tab(
          tab.props.label ?? "",
          systemImage: tab.props.systemImage ?? "",
          value: tab.hashableValue
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

  // MARK: - Index-based path
  // Used for the pager style (tabs == nil) and <Tab> on pre-18 (tabs != nil,
  // value <-> index mapping happens in the binding).

  @ViewBuilder
  private func indexBasedTabView(_ children: [any ExpoSwiftUI.AnyChild], tabs: [Tab]?) -> some View {
    SwiftUI.TabView(selection: indexBinding(tabs: tabs)) {
      ForEach(Array(children.enumerated()), id: \.element.id) { index, child in
        let view: any View = child.childView
        AnyView(view)
          .tag(index)
      }
    }
  }

  // When `tabs` is non-nil (pre-18 <Tab> fallback), selection from JS may be
  // a Tab value rather than an index — resolve it to an index for the getter,
  // and map back to the value for the event.
  private func indexBinding(tabs: [Tab]?) -> Binding<Int> {
    if props.selection != nil {
      return Binding(
        get: {
          Self.intFromEither(props.selection)
            ?? tabs.flatMap { ts in
              Self.hashable(from: props.selection).flatMap { sel in
                ts.firstIndex(where: { $0.hashableValue == sel })
              }
            }
            ?? 0
        },
        set: { newValue in
          let current = Self.intFromEither(props.selection)
            ?? tabs.flatMap { ts in
              Self.hashable(from: props.selection).flatMap { sel in
                ts.firstIndex(where: { $0.hashableValue == sel })
              }
            }
          if current != newValue {
            let payload: Any = tabs.flatMap { ts in
              newValue < ts.count ? Self.eventPayload(for: ts[newValue].hashableValue) : nil
            } ?? newValue
            props.onSelectionChange(["selection": payload])
          }
        }
      )
    }
    return Binding(
      get: {
        if let idx = internalSelection as? Int { return idx }
        if let tabs {
          return tabs.firstIndex(where: { $0.hashableValue == internalSelection }) ?? 0
        }
        return 0
      },
      set: { newValue in
        internalSelection = newValue
        let payload: Any = tabs.flatMap { ts in
          newValue < ts.count ? Self.eventPayload(for: ts[newValue].hashableValue) : nil
        } ?? newValue
        props.onSelectionChange(["selection": payload])
      }
    )
  }

  // MARK: - Value-based binding (iOS 18+)

  private var hashableBinding: Binding<AnyHashable> {
    let selection = props.selection
    if selection != nil {
      return Binding(
        get: { Self.hashable(from: selection)! },
        set: { newValue in
          if Self.hashable(from: selection) != newValue {
            props.onSelectionChange(["selection": Self.eventPayload(for: newValue)])
          }
        }
      )
    }
    return Binding(
      get: { internalSelection },
      set: { newValue in
        internalSelection = newValue
        props.onSelectionChange(["selection": Self.eventPayload(for: newValue)])
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

  private static func intFromEither(_ either: Either<Double, String>?) -> Int? {
    guard let either else { return nil }
    if let doubleValue: Double = either.get() {
      return Int(doubleValue)
    }
    return nil
  }

  private static func hashable(from either: Either<Double, String>?) -> AnyHashable? {
    guard let either else { return nil }
    if let stringValue: String = either.get() {
      return stringValue
    }
    if let doubleValue: Double = either.get() {
      return doubleValue
    }
    return nil
  }

  private static func eventPayload(for value: AnyHashable) -> Any {
    if let stringValue = value.base as? String { return stringValue }
    if let doubleValue = value.base as? Double { return doubleValue }
    if let intValue = value.base as? Int { return intValue }
    return String(describing: value.base)
  }
}
