// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class TabViewProps: UIBaseViewProps {
  // Either a number or a string. Numbers index into the legacy children array;
  // strings (or numbers used as `Tab` values) match `Tab(value:)` children.
  @Field var selection: Either<Double, String>?
  @Field var initialSelection: Either<Double, String>?
  var onSelectionChange = EventDispatcher()
}

internal struct TabView: ExpoSwiftUI.View {
  @ObservedObject var props: TabViewProps
  // Backing storage for uncontrolled mode (only when `props.selection` is nil).
  // Can't seed from `props.initialSelection` in init: SwiftUIVirtualView
  // constructs this view once with an empty Props() and only later pushes
  // populated props through updateProps. Seeding via `.onAppear` waits until
  // those real prop values are visible on the @ObservedObject.
  @State private var internalSelection: AnyHashable = 0
  @State private var didApplyInitialSelection = false

  init(props: TabViewProps) {
    self.props = props
  }

  var body: some View {
    let children = props.children ?? []
    let tabChildren = children.compactMap(Self.unwrapTab)

    // No `.tabViewStyle` / `.indexViewStyle` here. SwiftUI's TabView reads the
    // *innermost* tabViewStyle modifier, so any default applied on the SwiftUI
    // side would shadow the user's override (which UIBaseView applies on the
    // outside via `applyModifiers`). No default is applied — callers must
    // supply a `tabViewStyle({...})` modifier; without one SwiftUI falls back
    // to `.automatic` (an empty bottom bar unless children have `tabItem`).
    Group {
      if #available(iOS 18.0, *), !tabChildren.isEmpty, tabChildren.count == children.count {
        tabValueBody(tabChildren)
      } else {
        legacyIndexedBody(children)
      }
    }
    .onAppear {
      guard !didApplyInitialSelection else { return }
      didApplyInitialSelection = true
      if props.selection == nil, let initial = Self.hashable(from: props.initialSelection) {
        internalSelection = initial
      }
    }
  }

  // MARK: - iOS 18+ Tab path

  @available(iOS 18.0, *)
  @ViewBuilder
  private func tabValueBody(_ tabs: [Tab]) -> some View {
    SwiftUI.TabView(selection: hashableSelectionBinding) {
      ForEach(Array(tabs.enumerated()), id: \.offset) { _, tab in
        // Render the Tab's children directly — `tab.childView` would invoke
        // `Tab.body` and apply its iOS 17 fallback `.tabItem`, double-
        // decorating since `SwiftUI.Tab(label:systemImage:value:)` already
        // supplies the label/icon. The inner content is pre-erased to
        // AnyView via `tabContent(for:)` so the SwiftUI type-checker doesn't
        // have to resolve the full nested generic expression in one pass.
        SwiftUI.Tab(
          tab.props.label ?? "",
          systemImage: tab.props.systemImage ?? "",
          value: tab.hashableValue ?? AnyHashable("")
        ) {
          Self.tabContent(for: tab.props.children ?? [])
        }
      }
    }
  }

  private static func tabContent(for children: [any ExpoSwiftUI.AnyChild]) -> AnyView {
    AnyView(
      ForEach(children, id: \.id) { grandchild in
        // Explicit `any View` annotation opens the existential so the
        // `AnyView(_:)` initializer (which requires `V: View`) accepts it.
        let view: any View = grandchild.childView
        AnyView(view)
      }
    )
  }

  // MARK: - Legacy index-tagged path

  @ViewBuilder
  private func legacyIndexedBody(_ children: [any ExpoSwiftUI.AnyChild]) -> some View {
    SwiftUI.TabView(selection: indexedSelectionBinding) {
      ForEach(Array(children.enumerated()), id: \.element.id) { index, child in
        let view: any View = child.childView
        AnyView(view)
          .tag(index)
      }
    }
  }

  // MARK: - Bindings
  //
  // Two modes, picked per-render from whether `props.selection` is supplied:
  //
  //  • Controlled (props.selection != nil): JS owns the truth. The binding
  //    getter always returns the latest prop so the SwiftUI TabView never
  //    flashes page 0 before catching up; the setter only fires
  //    onSelectionChange when SwiftUI is trying to change to a value JS
  //    didn't already send down (echo gate).
  //  • Uncontrolled (props.selection == nil): native owns the truth in
  //    `internalSelection`. Setter updates internal state and notifies JS so
  //    the parent can observe changes without controlling them.

  private var indexedSelectionBinding: Binding<Int> {
    if props.selection != nil {
      return Binding(
        get: { Self.intFromEither(props.selection) ?? 0 },
        set: { newValue in
          if Self.intFromEither(props.selection) != newValue {
            props.onSelectionChange(["selection": newValue])
          }
        }
      )
    }
    return Binding(
      get: { (internalSelection as? Int) ?? 0 },
      set: { newValue in
        internalSelection = newValue
        props.onSelectionChange(["selection": newValue])
      }
    )
  }

  private var hashableSelectionBinding: Binding<AnyHashable> {
    if props.selection != nil {
      return Binding(
        get: { Self.hashable(from: props.selection) ?? AnyHashable("") },
        set: { newValue in
          let current = Self.hashable(from: props.selection)
          if current != newValue {
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

  // Walks UIBaseView's wrapper to get the actual content view, returning it
  // only if it's a `Tab`. Returns nil for any other child type.
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

  // Convert AnyHashable back to a JSON-safe payload for the JS event.
  private static func eventPayload(for value: AnyHashable) -> Any {
    if let stringValue = value.base as? String { return stringValue }
    if let doubleValue = value.base as? Double { return doubleValue }
    if let intValue = value.base as? Int { return intValue }
    return String(describing: value.base)
  }
}
