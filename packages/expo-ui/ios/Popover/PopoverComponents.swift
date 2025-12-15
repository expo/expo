import ExpoModulesCore
import SwiftUI

internal struct PopoverViewTrigger: ExpoSwiftUI.View {
    @ObservedObject var props: PopoverViewTriggerProps

    var body: some View {
        Children()
    }
}

internal struct PopoverViewContent: ExpoSwiftUI.View {
    @ObservedObject var props: PopoverViewContentPorps

    var body: some View {
        Children()
        .applyModifiers(props.modifiers, appContext: props.appContext, globalEventDispatcher: props.globalEventDispatcher)

    }
}
