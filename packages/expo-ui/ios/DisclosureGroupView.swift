// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

class DisclosureGroupProps: ExpoSwiftUI.ViewProps {
  @Field var title: String?
  @Field var isExpanded: Bool = true
  var onStateChange = EventDispatcher()
 
}

struct DisclosureGroupView: ExpoSwiftUI.View {
  @EnvironmentObject var props: DisclosureGroupProps
  @State private var isExpanded: Bool = false
  var body: some View {
    DisclosureGroup(props.title ?? "", isExpanded: $isExpanded) {
      UnwrappedChildren { child, isHostingView in
        child
          .if(!isHostingView) {
            $0.offset(x: UIDevice.current.userInterfaceIdiom == .pad ? IPAD_OFFSET : IPHONE_OFFSET)
          }
      }
        .onAppear(){
          isExpanded = props.isExpanded
        }
        .onChange(of: isExpanded) { newValue in
          print(newValue)
          let payload = ["isExpanded":  newValue]
          props.onStateChange(payload)
        }
        .onChange(of: props.isExpanded) { newValue in
          isExpanded = newValue
        }
       
    }
  }
}
