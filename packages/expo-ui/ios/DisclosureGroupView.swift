// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

class DisclosureGroupProps: ExpoSwiftUI.ViewProps {
    @Field var title: String?
    var onStateChange = EventDispatcher()
}

struct DisclosureGroupView: ExpoSwiftUI.View {
    @EnvironmentObject var props: DisclosureGroupProps
    @State private var isExpanded: Bool = false
    var body: some View {
        DisclosureGroup(props.title ?? "", isExpanded: $isExpanded) {
            Children()

                .onChange(of: isExpanded) { newValue in
                    let payload = ["isExpnaded": newValue == true ? true : false]
                    props.onStateChange(payload)
                }
        }
    }
}
