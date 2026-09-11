// Copyright 2026-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal enum NavigationSplitViewVisibilityOptions: String, Enumerable {
  case automatic
  case all
  case doubleColumn
  case detailOnly

  var value: NavigationSplitViewVisibility {
    switch self {
    case .automatic: .automatic
    case .all: .all
    case .doubleColumn: .doubleColumn
    case .detailOnly: .detailOnly
    }
  }
}

internal enum NavigationSplitViewColumnOptions: String, Enumerable {
  case sidebar
  case content
  case detail

  @available(iOS 17.0, tvOS 17.0, *)
  var value: NavigationSplitViewColumn {
    switch self {
    case .sidebar: .sidebar
    case .content: .content
    case .detail: .detail
    }
  }
}

internal final class NavigationSplitViewProps: UIBaseViewProps {
  @Field var columnVisibility: NavigationSplitViewVisibilityOptions?
  @Field var preferredCompactColumn: NavigationSplitViewColumnOptions?
  @Field var hasColumnVisibilityBinding = false
  @Field var hasPreferredCompactColumnBinding = false
  var onColumnVisibilityChange = EventDispatcher()
  var onPreferredCompactColumnChange = EventDispatcher()
}

internal struct NavigationSplitView: ExpoSwiftUI.View {
  @ObservedObject var props: NavigationSplitViewProps
  @State private var uncontrolledColumnVisibility: NavigationSplitViewVisibilityOptions = .automatic
  @State private var uncontrolledPreferredCompactColumn: NavigationSplitViewColumnOptions = .sidebar

  init(props: NavigationSplitViewProps) {
    self.props = props
  }

  var body: some View {
    Group {
      if props.children?.slot("content") == nil {
        twoColumnSplit
      } else {
        threeColumnSplit
      }
    }
  }

  @ViewBuilder
  private var twoColumnSplit: some View {
    if #available(iOS 17.0, tvOS 17.0, *), usesPreferredCompactColumn {
      if usesColumnVisibility {
        SwiftUI.NavigationSplitView(
          columnVisibility: columnVisibilityBinding,
          preferredCompactColumn: preferredCompactColumnBinding,
          sidebar: { slot("sidebar") },
          detail: { slot("detail") }
        )
      } else {
        SwiftUI.NavigationSplitView(
          preferredCompactColumn: preferredCompactColumnBinding,
          sidebar: { slot("sidebar") },
          detail: { slot("detail") }
        )
      }
    } else if usesColumnVisibility {
      SwiftUI.NavigationSplitView(
        columnVisibility: columnVisibilityBinding,
        sidebar: { slot("sidebar") },
        detail: { slot("detail") }
      )
    } else {
      SwiftUI.NavigationSplitView(sidebar: { slot("sidebar") }, detail: { slot("detail") })
    }
  }

  @ViewBuilder
  private var threeColumnSplit: some View {
    if #available(iOS 17.0, tvOS 17.0, *), usesPreferredCompactColumn {
      if usesColumnVisibility {
        SwiftUI.NavigationSplitView(
          columnVisibility: columnVisibilityBinding,
          preferredCompactColumn: preferredCompactColumnBinding,
          sidebar: { slot("sidebar") },
          content: { slot("content") },
          detail: { slot("detail") }
        )
      } else {
        SwiftUI.NavigationSplitView(
          preferredCompactColumn: preferredCompactColumnBinding,
          sidebar: { slot("sidebar") },
          content: { slot("content") },
          detail: { slot("detail") }
        )
      }
    } else if usesColumnVisibility {
      SwiftUI.NavigationSplitView(
        columnVisibility: columnVisibilityBinding,
        sidebar: { slot("sidebar") },
        content: { slot("content") },
        detail: { slot("detail") }
      )
    } else {
      SwiftUI.NavigationSplitView(
        sidebar: { slot("sidebar") },
        content: { slot("content") },
        detail: { slot("detail") }
      )
    }
  }

  private var usesColumnVisibility: Bool {
    props.hasColumnVisibilityBinding
  }

  private var usesPreferredCompactColumn: Bool {
    props.hasPreferredCompactColumnBinding
  }

  private var columnVisibilityBinding: Binding<SwiftUI.NavigationSplitViewVisibility> {
    Binding(
      get: { (props.columnVisibility ?? uncontrolledColumnVisibility).value },
      set: { newValue in
        let newOption = visibilityOption(newValue)
        guard (props.columnVisibility ?? uncontrolledColumnVisibility) != newOption else { return }
        if props.columnVisibility == nil {
          uncontrolledColumnVisibility = newOption
        }
        props.onColumnVisibilityChange(["columnVisibility": newOption.rawValue])
      }
    )
  }

  @available(iOS 17.0, tvOS 17.0, *)
  private var preferredCompactColumnBinding: Binding<SwiftUI.NavigationSplitViewColumn> {
    Binding(
      get: { (props.preferredCompactColumn ?? uncontrolledPreferredCompactColumn).value },
      set: { newValue in
        let newOption = columnOption(newValue)
        guard (props.preferredCompactColumn ?? uncontrolledPreferredCompactColumn) != newOption else {
          return
        }
        if props.preferredCompactColumn == nil {
          uncontrolledPreferredCompactColumn = newOption
        }
        props.onPreferredCompactColumnChange(["preferredCompactColumn": newOption.rawValue])
      }
    )
  }

  @ViewBuilder
  private func slot(_ name: String) -> some View {
    props.children?.slot(name)
  }

  private func visibilityOption(
    _ visibility: SwiftUI.NavigationSplitViewVisibility
  ) -> NavigationSplitViewVisibilityOptions {
    switch visibility {
    case .all: .all
    case .doubleColumn: .doubleColumn
    case .detailOnly: .detailOnly
    default: .automatic
    }
  }

  @available(iOS 17.0, tvOS 17.0, *)
  private func columnOption(
    _ column: SwiftUI.NavigationSplitViewColumn
  ) -> NavigationSplitViewColumnOptions {
    switch column {
    case .content: .content
    case .detail: .detail
    default: .sidebar
    }
  }
}
