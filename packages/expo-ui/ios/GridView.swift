import ExpoModulesCore
import SwiftUI

public final class GridProps: UIBaseViewProps {
  @Field var alignment: AlignmentOptions?
  @Field var verticalSpacing: CGFloat?
  @Field var horizontalSpacing: CGFloat?
}

public struct GridView: ExpoSwiftUI.View {
  @ObservedObject public var props: GridProps

  public init(props: GridProps) {
    self.props = props
  }

  public var body: some View {
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

public final class GridRowProps: ExpoSwiftUI.ViewProps {}
public struct GridRowView: ExpoSwiftUI.View {
  @ObservedObject public var props: GridRowProps

  public init(props: GridRowProps) {
    self.props = props
  }

  public var body: some View {
    if #available(iOS 16.0, macOS 13.0, tvOS 16.0, *) {
      GridRow {
        Children()
      }
    } else {
      EmptyView()
    }
  }
}
