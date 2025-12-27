// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class ListProps: UIBaseViewProps {
  @Field var listStyle: String = "automatic"
  @Field var moveEnabled: Bool = false
  @Field var deleteEnabled: Bool = false
  @Field var selectEnabled: Bool = true
  @Field var scrollEnabled: Bool = true
  @Field var editModeEnabled: Bool = false
  var onDeleteItem = EventDispatcher()
  var onMoveItem = EventDispatcher()
  var onSelectionChange = EventDispatcher()
}

struct ListView: ExpoSwiftUI.View {
  @ObservedObject var props: ListProps
  @State private var selection: Set<AnyHashable> = []
  @State var editModeEnabled: EditMode = .inactive
  @State var search: String = ""

  init(props: ListProps) {
    self.props = props
  }

  var body: some View {
    let list = List(selection: props.selectEnabled ? $selection : nil) {
      Children()
        .onDelete(perform: handleDelete)
        .onMove(perform: handleMove)
        .deleteDisabled(!props.deleteEnabled)
        .moveDisabled(!props.moveEnabled)
    }
    .modifier(ListStyleModifer(style: props.listStyle))
    .onAppear {
      editModeEnabled = props.editModeEnabled ? .active : .inactive
    }
    .onChange(of: props.editModeEnabled) { newValue in
      withAnimation {
        editModeEnabled = newValue ? .active : .inactive
      }
    }
    .onChange(of: selection) { selection in
      handleSelectionChange(selection: selection)
    }
    .modifier(ScrollDisabledModifier(scrollEnabled: props.scrollEnabled))
    .environment(\.editMode, $editModeEnabled)
    if #available(iOS 16.0, tvOS 16.0, *) {
      list.scrollDisabled(!props.scrollEnabled)
    } else {
      list
    }
  }
  func handleDelete(at offsets: IndexSet) {
    for offset in offsets {
      props.onDeleteItem([
        "index": offset
      ])
      selection.remove(offset)
    }
  }
  func handleMove(from sources: IndexSet, to destination: Int) {
    for source in sources {
      props.onMoveItem([
        "from": source,
        "to": destination,
      ])
    }
  }
  func handleSelectionChange(selection: Set<AnyHashable>) {
    // Convert AnyHashable values to their base types for JSON serialization
    let selectionArray = selection.compactMap { item -> Any? in
      if let intValue = item.base as? Int {
        return intValue
      } else if let doubleValue = item.base as? Double {
        return Int(doubleValue)
      } else if let stringValue = item.base as? String {
        return stringValue
      }
      return nil
    }
    let jsonDict: [String: Any] = [
      "selection": selectionArray
    ]
    props.onSelectionChange(jsonDict)
  }
}

struct ListStyleModifer: ViewModifier {
  var style: String
  @ViewBuilder func body(content: Content) -> some View {
    switch style {
    case "grouped":
      content.listStyle(.grouped)
    case "plain":
      content.listStyle(.plain)
    case "automatic":
      content.listStyle(.automatic)

    case "insetGrouped":
      #if !os(tvOS)  // fallthrough to default
        content.listStyle(.insetGrouped)
      #endif
    case "inset":
      #if !os(tvOS)  // fallthrough to default
        content.listStyle(.inset)
      #endif
    case "sidebar":
      #if !os(tvOS)  // fallthrough to default
        content.listStyle(.sidebar)
      #endif
    default:
      content
    }
  }
}

struct ScrollDisabledModifier: ViewModifier {
  let scrollEnabled: Bool

  func body(content: Content) -> some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      content.scrollDisabled(!scrollEnabled)
    } else {
      content
    }
  }
}
