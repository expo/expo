import ExpoModulesCore
import SwiftUI

@ViewProps(extending: ExpoUIViewProps.self)
public struct GridProps {
  var alignment: AlignmentOptions?
  var verticalSpacing: CGFloat?
  var horizontalSpacing: CGFloat?
}

@ExpoView<GridProps>
public struct GridView: View {
  public var body: some View {
    grid.applyExpoUIViewProps(props.base, appContext: appContext)
  }

  @ViewBuilder
  private var grid: some View {
    if #available(iOS 16.0, macOS 13.0, tvOS 16.0, *) {
      Grid(
        alignment: props.alignment?.toAlignment() ?? .center,
        horizontalSpacing: props.horizontalSpacing,
        verticalSpacing: props.verticalSpacing
      ) {
        children
      }
    } else {
      EmptyView()
    }
  }
}

@ViewProps
public struct GridRowProps {}

@ExpoView<GridRowProps>
public struct GridRowView: View {
  public var body: some View {
    if #available(iOS 16.0, macOS 13.0, tvOS 16.0, *) {
      GridRow {
        children
      }
    } else {
      EmptyView()
    }
  }
}
