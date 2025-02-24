// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class ListProps: ExpoSwiftUI.ViewProps {
    @Field var listStyle: String?
    @Field var heightOffset: CGFloat = 0
}

struct ListView: ExpoSwiftUI.View {
    @EnvironmentObject var props: ListProps
    var body: some View {
        List() {
            UnwrappedChildren { child, isHostingView in
                child
                    .if(!isHostingView) {
                        $0.offset(x: UIDevice.current.userInterfaceIdiom == .pad ? IPAD_OFFSET : IPHONE_OFFSET)
                    }
            }
        }
    }
    
    
    struct ListStyleModifer: ViewModifier {
        var style: String
        @ViewBuilder func body(content: Content) -> some View {
            switch style {
            case "grouped": content.listStyle(.grouped)
            case "insetGrouped": content.listStyle(.insetGrouped)
            case "inset": content.listStyle(.inset)
            case "plain": content.listStyle(.plain)
            case "sidebar": content.listStyle(.sidebar)
            case "automatic": content.listStyle(.automatic)
            default: content
            }
        }
    }
    
}
