import ExpoModulesCore
import SwiftUI

internal struct PopoverViewContent: ExpoSwiftUI.View {
    @ObservedObject var props: PopoverViewContentPorps

    var body: some View {
        Children()
    }
}

internal struct PopoverViewPopContent: ExpoSwiftUI.View {
    @ObservedObject var props: PopoverViewPopContentPorps

    var body: some View {
        Children()
    }
}
