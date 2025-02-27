// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class ListProps: ExpoSwiftUI.ViewProps {
    @Field var listStyle: String?
    @Field var heightOffset: CGFloat = 0
    @Field var moveEnabled: Bool? = false
    @Field var deleteEnabled: Bool? = false
    @Field var selectEnabled: Bool? = false
    @Field var editModeEnabled: Bool = false
}





struct ListView: ExpoSwiftUI.View {
    @EnvironmentObject var props: ListProps
    @State var selection: String?
    @State var editMode: EditMode = .inactive
     
    var body: some View {
    
        List(selection: props.selectEnabled ?? false ? $selection : nil) {
          
            UnwrappedChildren { child, isHostingView in
                child
                    .if(!isHostingView) {
                  $0.offset(x: UIDevice.current.userInterfaceIdiom == .pad ? IPAD_OFFSET : IPHONE_OFFSET)
                }
            }
            .onDelete(perform: handleDelete)
            .onMove(perform: handleMove)
            .deleteDisabled(!(props.deleteEnabled ?? false))
            .moveDisabled(!(props.moveEnabled ?? false))
            
        }
      
        .modifier(ListStyleModifer(style: props.listStyle ?? "plain"))
        
        
    }

    func handleDelete(at offsets: IndexSet) {
        for offset in offsets {
            print("Deleting item at index: \(offset)")
        }
    }
    func handleMove(from source: IndexSet, to destination: Int) {
        print(destination)
      }
    func handleSelect(oldValue: String, newValue: String ) {
        print(oldValue)
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
