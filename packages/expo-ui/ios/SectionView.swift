// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

class SectionProps: ExpoSwiftUI.ViewProps {
    @Field var title: String?
    @Field var displayTitleUppercase: Bool = true
    @Field var heightOffset: CGFloat = 0
}

struct SectionView: ExpoSwiftUI.View {
    @EnvironmentObject var props: SectionProps

    var body: some View {
        let form = Form {
            Section(header: Text(props.title ?? "").textCase(props.displayTitleUppercase ? .uppercase : nil)) {
                Children().padding(EdgeInsets(top: 0, leading: 0, bottom: props.heightOffset, trailing: 0))
            }
        }

        if #available(iOS 16.0, tvOS 16.0, *) {
            form.scrollDisabled(true)
        } else {
            form
        }
    }
}