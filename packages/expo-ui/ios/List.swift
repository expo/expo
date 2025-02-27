// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class ListProps: ExpoSwiftUI.ViewProps {
    @Field var listStyle: String?
    @Field var heightOffset: CGFloat = 0
    @Field var moveEnabled: Bool? = false
    @Field var deleteEnabled: Bool? = false
    @Field var editModeEnabled: Bool = false
    @Field var swipeActions: [SwipeAction] = []  // Define swipe actions as a property
}

// Define a struct for swipe actions
struct SwipeAction {
    var title: String
    var icon: String?
    var onSwipe = EventDispatcher()
}


struct ListView: ExpoSwiftUI.View {
    @EnvironmentObject var props: ListProps

    var body: some View {
        List {
          
                if let children = props.children {
                    ForEach(0..<children.count, id: \.self) { index in
                        let child = children[index]
                        if let hostingView = child.view as? (any ExpoSwiftUI.AnyHostingView) {
                            // Handle hosting view (with necessary props and environment objects)
                            let content = hostingView.getContentView()
                            let propsObject = hostingView.getProps() as any ObservableObject
                            AnyView(
                                content
                                    .environmentObject(propsObject)
                                   
                            )
                            
                            
                         
                            
                        } else {
                            AnyView(
                                child
                                    .offset(x: UIDevice.current.userInterfaceIdiom == .pad ? IPAD_OFFSET : IPHONE_OFFSET)
                            )
                        }
                            
                    }
                  
                    .onDelete(perform: handleDelete)
                    .if(true) { $0.onMove(perform: handleMove) }
                    
                  
                    
                    
                } else {
                    AnyView(EmptyView())
                }
            
        }
       
        .modifier(ListStyleModifer(style: props.listStyle ?? "plain"))
    }

    func handleDelete(at offsets: IndexSet) {
        print(offsets.count)
    }
    func handleMove(from source: IndexSet, to destination: Int) {
        print(destination)
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
}
