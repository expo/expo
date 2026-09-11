// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum NavigationSplitViewVisibilityOptions: String, Enumerable {
  case automatic
  case all
  case doubleColumn
  case detailOnly

  var value: NavigationSplitViewVisibility {
    switch self {
    case .automatic: return .automatic
    case .all: return .all
    case .doubleColumn: return .doubleColumn
    case .detailOnly: return .detailOnly
    }
  }
}

internal enum NavigationSplitViewColumnOptions: String, Enumerable {
  case sidebar
  case content
  case detail

  @available(iOS 17.0, *)
  var value: NavigationSplitViewColumn {
    switch self {
    case .sidebar: return .sidebar
    case .content: return .content
    case .detail: return .detail
    }
  }
}

internal final class NavigationSplitViewProps: UIBaseViewProps {
  @Field var columnVisibility: NavigationSplitViewVisibilityOptions?
  @Field var preferredCompactColumn: NavigationSplitViewColumnOptions?
  var onColumnVisibilityChange = EventDispatcher()
  var onPreferredCompactColumnChange = EventDispatcher()
}

internal struct NavigationSplitViewView: ExpoSwiftUI.View {
  @ObservedObject var props: NavigationSplitViewProps
  @State private var uncontrolledColumnVisibility = NavigationSplitViewVisibility.automatic
  @State private var uncontrolledPreferredCompactColumn = NavigationSplitViewColumnOptions.sidebar

  var body: some View {
    if #available(iOS 17.0, *) {
      splitViewWithPreferredCompactColumn
    } else if #available(iOS 16.0, *) {
      splitView
    } else {
      detail
    }
  }

  @available(iOS 17.0, *)
  @ViewBuilder
  private var splitViewWithPreferredCompactColumn: some View {
    if let content = props.children?.slot("content") {
      NavigationSplitView(
        columnVisibility: columnVisibilityBinding,
        preferredCompactColumn: preferredCompactColumnBinding
      ) {
        sidebar
      } content: {
        content
      } detail: {
        detail
      }
    } else {
      NavigationSplitView(
        columnVisibility: columnVisibilityBinding,
        preferredCompactColumn: preferredCompactColumnBinding
      ) {
        sidebar
      } detail: {
        detail
      }
    }
  }

  @available(iOS 16.0, *)
  @ViewBuilder
  private var splitView: some View {
    if let content = props.children?.slot("content") {
      NavigationSplitView(columnVisibility: columnVisibilityBinding) {
        sidebar
      } content: {
        content
      } detail: {
        detail
      }
    } else {
      NavigationSplitView(columnVisibility: columnVisibilityBinding) {
        sidebar
      } detail: {
        detail
      }
    }
  }

  @ViewBuilder private var sidebar: some View {
    props.children?.slot("sidebar")
  }

  @ViewBuilder private var detail: some View {
    props.children?.slot("detail")
  }

  @available(iOS 16.0, *)
  private var columnVisibilityBinding: Binding<NavigationSplitViewVisibility> {
    Binding(
      get: { props.columnVisibility?.value ?? uncontrolledColumnVisibility },
      set: { value in
        if props.columnVisibility == nil {
          uncontrolledColumnVisibility = value
        }
        props.onColumnVisibilityChange(["columnVisibility": visibilityName(value)])
      }
    )
  }

  @available(iOS 17.0, *)
  private var preferredCompactColumnBinding: Binding<NavigationSplitViewColumn> {
    Binding(
      get: { (props.preferredCompactColumn ?? uncontrolledPreferredCompactColumn).value },
      set: { value in
        let option = columnOption(value)
        if props.preferredCompactColumn == nil {
          uncontrolledPreferredCompactColumn = option
        }
        props.onPreferredCompactColumnChange(["preferredCompactColumn": option.rawValue])
      }
    )
  }

  private func visibilityName(_ value: NavigationSplitViewVisibility) -> String {
    switch value {
    case .automatic: return "automatic"
    case .all: return "all"
    case .doubleColumn: return "doubleColumn"
    case .detailOnly: return "detailOnly"
    default: return "automatic"
    }
  }

  @available(iOS 17.0, *)
  private func columnOption(_ value: NavigationSplitViewColumn) -> NavigationSplitViewColumnOptions {
    switch value {
    case .sidebar: return .sidebar
    case .content: return .content
    case .detail: return .detail
    @unknown default: return .sidebar
    }
  }
}
