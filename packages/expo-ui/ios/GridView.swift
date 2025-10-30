import ExpoModulesCore
import SwiftUI

// MARK: - Grid Props
final class GridProps: UIBaseViewProps {
  @Field var alignment: AlignmentOptions?
  @Field var verticalSpacing: CGFloat?
  @Field var horizontalSpacing: CGFloat?
}

// MARK: - GridRow
internal final class GridRowProps: UIBaseViewProps {}
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
        Children()
      }
    } else {
      EmptyView()
    }
  }
}
