// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum NavigationSplitViewVisibilityOptions: String, Enumerable {
  case automatic
  case all
  case doubleColumn
  case detailOnly

  func toVisibility() -> NavigationSplitViewVisibility {
    switch self {
    case .automatic:
      return .automatic
    case .all:
      return .all
    case .doubleColumn:
      return .doubleColumn
    case .detailOnly:
      return .detailOnly
    }
  }

  static func from(_ visibility: NavigationSplitViewVisibility) -> NavigationSplitViewVisibilityOptions {
    switch visibility {
    case .all:
      return .all
    case .doubleColumn:
      return .doubleColumn
    case .detailOnly:
      return .detailOnly
    default:
      return .automatic
    }
  }
}

internal enum NavigationSplitViewColumnOptions: String, Enumerable {
  case sidebar
  case content
  case detail

  @available(iOS 17.0, tvOS 17.0, *)
  func toColumn() -> NavigationSplitViewColumn {
    switch self {
    case .sidebar:
      return .sidebar
    case .content:
      return .content
    case .detail:
      return .detail
    }
  }

  @available(iOS 17.0, tvOS 17.0, *)
  static func from(_ column: NavigationSplitViewColumn) -> NavigationSplitViewColumnOptions {
    switch column {
    case .content:
      return .content
    case .detail:
      return .detail
    default:
      return .sidebar
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

  // Only used while the matching prop is unset. While it is set, JS is the sole source
  // of truth, so it stays in control of the columns and can refuse a change the user
  // made by dragging.
  @State private var uncontrolledVisibility: NavigationSplitViewVisibilityOptions = .automatic
  @State private var uncontrolledCompactColumn: NavigationSplitViewColumnOptions = .sidebar

  init(props: NavigationSplitViewProps) {
    self.props = props
  }

  private var columnVisibilityBinding: Binding<NavigationSplitViewVisibility> {
    let props = props
    let uncontrolled = $uncontrolledVisibility
    return Binding(
      get: { (props.columnVisibility ?? uncontrolled.wrappedValue).toVisibility() },
      set: { newValue in
        let resolved = NavigationSplitViewVisibilityOptions.from(newValue)
        guard (props.columnVisibility ?? uncontrolled.wrappedValue) != resolved else {
          return
        }
        if props.columnVisibility == nil {
          uncontrolled.wrappedValue = resolved
        }
        props.onColumnVisibilityChange(["visibility": resolved.rawValue])
      }
    )
  }

  @available(iOS 17.0, tvOS 17.0, *)
  private var compactColumnBinding: Binding<NavigationSplitViewColumn> {
    let props = props
    let uncontrolled = $uncontrolledCompactColumn
    return Binding(
      get: { (props.preferredCompactColumn ?? uncontrolled.wrappedValue).toColumn() },
      set: { newValue in
        let resolved = NavigationSplitViewColumnOptions.from(newValue)
        guard (props.preferredCompactColumn ?? uncontrolled.wrappedValue) != resolved else {
          return
        }
        if props.preferredCompactColumn == nil {
          uncontrolled.wrappedValue = resolved
        }
        props.onPreferredCompactColumnChange(["column": resolved.rawValue])
      }
    )
  }

  @ViewBuilder
  var body: some View {
    if #available(iOS 17.0, tvOS 17.0, *) {
      if let contentColumn {
        NavigationSplitView(
          columnVisibility: columnVisibilityBinding,
          preferredCompactColumn: compactColumnBinding
        ) {
          sidebarColumn
        } content: {
          contentColumn
        } detail: {
          detailColumn
        }
      } else {
        NavigationSplitView(
          columnVisibility: columnVisibilityBinding,
          preferredCompactColumn: compactColumnBinding
        ) {
          sidebarColumn
        } detail: {
          detailColumn
        }
      }
    } else {
      if let contentColumn {
        NavigationSplitView(columnVisibility: columnVisibilityBinding) {
          sidebarColumn
        } content: {
          contentColumn
        } detail: {
          detailColumn
        }
      } else {
        NavigationSplitView(columnVisibility: columnVisibilityBinding) {
          sidebarColumn
        } detail: {
          detailColumn
        }
      }
    }
  }

  private var sidebarColumn: SlotView? {
    props.children?.slot("sidebar")
  }

  private var contentColumn: SlotView? {
    props.children?.slot("content")
  }

  private var detailColumn: SlotView? {
    props.children?.slot("detail")
  }
}
