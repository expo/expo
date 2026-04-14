// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class TabViewProps: UIBaseViewProps {
  @Field var selection: Int?
  @Field var initialSelection: Int?
  var onSelectionChange = EventDispatcher()
}

internal struct TabView: ExpoSwiftUI.View {
  @ObservedObject var props: TabViewProps
  // Backing storage for uncontrolled mode (only when `props.selection` is nil).
  // Can't seed from `props.initialSelection` in init: SwiftUIVirtualView
  // constructs this view once with an empty Props() and only later pushes
  // populated props through updateProps. Seeding via `.onAppear` waits until
  // those real prop values are visible on the @ObservedObject.
  @State private var internalSelection: Int = 0
  @State private var didApplyInitialSelection = false

  init(props: TabViewProps) {
    self.props = props
  }

  var body: some View {
    let children = props.children ?? []

    // No `.tabViewStyle` / `.indexViewStyle` here. SwiftUI's TabView reads the
    // *innermost* tabViewStyle modifier, so any default applied on the SwiftUI
    // side would shadow the user's override (which UIBaseView applies on the
    // outside via `applyModifiers`). No default is applied — callers must
    // supply a `tabViewStyle({...})` modifier; without one SwiftUI falls back
    // to `.automatic` (an empty bottom bar unless children have `tabItem`).
    SwiftUI.TabView(selection: selectionBinding) {
      ForEach(Array(children.enumerated()), id: \.element.id) { index, child in
        let view: any View = child.childView
        AnyView(view)
          .tag(index)
      }
    }
    .onAppear {
      guard !didApplyInitialSelection else { return }
      didApplyInitialSelection = true
      if props.selection == nil, let initial = props.initialSelection {
        internalSelection = initial
      }
    }
  }

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
  private var selectionBinding: Binding<Int> {
    if props.selection != nil {
      return Binding(
        get: { props.selection ?? 0 },
        set: { newValue in
          if props.selection != newValue {
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
}
