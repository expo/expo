import ExpoModulesCore
import SwiftUI

// MARK: - Grid Props
final class GridProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
    @Field var fixedSize: Bool?
    @Field var frame: FrameOptions?
    @Field var padding: PaddingOptions?
    @Field var testID: String?
    @Field var modifiers: ModifierArray?

    @Field var alignment: AlignmentOptions?
    @Field var verticalSpacing: CGFloat?
    @Field var horizontalSpacing: CGFloat?
}

// MARK: - GridRow
internal final class GridRowProps: ExpoSwiftUI.ViewProps {}
internal struct GridRowView: ExpoSwiftUI.View {
    @ObservedObject var props: GridRowProps

    var body: some View {
        if #available(iOS 16.0, macOS 13.0, tvOS 16.0, *) {
            GridRow {
                Children()
            }
        } else {
            EmptyView()
        }
    }
}
internal final class GridContentProps: ExpoSwiftUI.ViewProps {}
internal struct GridContentView: ExpoSwiftUI.View {
    @ObservedObject var props: GridContentProps

    var body: some View {
        Children()
    }
}

// MARK: - GridView
internal struct GridView: ExpoSwiftUI.View {
    @ObservedObject var props: GridProps

    var body: some View {
        if #available(iOS 16.0, macOS 13.0, tvOS 16.0, *) {
            Grid(
                alignment: props.alignment?.toAlignment() ?? .center,
                horizontalSpacing: props.horizontalSpacing,
                verticalSpacing: props.verticalSpacing
            ) {
                contentChildren
            }
            .modifier(CommonViewModifiers(props: props))
        } else {
            EmptyView()
        }
    }
    @ViewBuilder
    private var contentChildren: some View {
        let children = props.children ?? []

        ForEach(Array(children.enumerated()), id: \.offset) { _, child in
            if let row = child.childView as? GridRowView {
                row
            } else if let other = child.childView as? GridContentView {
                other
            } else {
                EmptyView()
            }
        }
    }
}
