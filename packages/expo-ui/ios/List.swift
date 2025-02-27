// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

class ListProps: ExpoSwiftUI.ViewProps {
  @Field var listStyle: String = "automatic"
  @Field var heightOffset: CGFloat = 0
  @Field var moveEnabled: Bool = false
  @Field var deleteEnabled: Bool = false
  @Field var selectEnabled: Bool = false
  @Field var scrollEnabled: Bool = false
  @Field var editModeEnabled: Bool = false
  
  var onDeleteItem = EventDispatcher()
  var onMoveItem = EventDispatcher()
  var onSelectionChange = EventDispatcher()
  
}

struct ListView: ExpoSwiftUI.View {
  @EnvironmentObject var props: ListProps
  @State private var selection: Set<Int> = []
  @State var editModeEnabled: EditMode = .inactive
  @State var search: String = ""
  
  var body: some View {
    let list = List(selection: props.selectEnabled ? $selection : nil) {
      UnwrappedChildren { child, isHostingView in
        child
          .if(!isHostingView) {
            $0.offset(
              x: UIDevice.current.userInterfaceIdiom == .pad
              ? IPAD_OFFSET : IPHONE_OFFSET)
          }
      }
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
        print(selection)
        handleSelectionChange(selection: selection)
      }
      .modifier(ScrollDisabledModifier(scrollEnabled: props.selectEnabled))
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
  func handleSelectionChange(selection: Set<Int>) {
    let selectionArray = Array(selection)
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
    case "insetGrouped":
      content.listStyle(.insetGrouped)
    case "inset":
      content.listStyle(.inset)
    case "plain":
      content.listStyle(.plain)
    case "sidebar":
      content.listStyle(.sidebar)
    case "automatic":
      content.listStyle(.automatic)
    default:
      content
    }
  }
}

struct ScrollDisabledModifier: ViewModifier {
  let scrollEnabled: Bool
  
  func body(content: Content) -> some View {
    if #available(iOS 18.0, *) {
      content.scrollDisabled(!scrollEnabled)
    } else {
      content
    }
  }
}
