// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal enum EdgeCornerStyleType: String, Enumerable {
  case concentric
  case fixed
}

@Record
internal struct CornerStyleConfig {
  var type: EdgeCornerStyleType = .concentric
  var radius: CGFloat?
  var minimumRadius: CGFloat?
}

@Record
internal struct ConcentricRectangleCornerParams {
  var topLeadingCorner: CornerStyleConfig?
  var topTrailingCorner: CornerStyleConfig?
  var bottomLeadingCorner: CornerStyleConfig?
  var bottomTrailingCorner: CornerStyleConfig?
}

@ViewProps(extending: ExpoUIViewProps.self)
public struct ConcentricRectangleViewProps {
  var corners: ConcentricRectangleCornerParams?
}

@ExpoView<ConcentricRectangleViewProps>
public struct ConcentricRectangleView: View {
#if compiler(>=6.2) // Xcode 26
  @available(iOS 26.0, macOS 26.0, tvOS 26.0, *)
  private func cornerStyle(from config: CornerStyleConfig?) -> Edge.Corner.Style {
    // default to concentric
    guard let config = config else {
      return .concentric(minimum: nil)
    }

    switch config.type {
    case .concentric:
      let minimum: Edge.Corner.Style? = {
        if let minimumRadius = config.minimumRadius {
          return .fixed(minimumRadius)
        }
        return nil
      }()
      return .concentric(minimum: minimum)
    case .fixed:
      return .fixed(config.radius ?? 0)
    }
  }
#endif

  public var body: some View {
    shape.applyExpoUIViewProps(props.base, appContext: appContext)
  }

  @ViewBuilder
  private var shape: some View {
#if compiler(>=6.2) // Xcode 26
    if #available(iOS 26.0, macOS 26.0, tvOS 26.0, *) {
      let topLeadingCorner = cornerStyle(from: props.corners?.topLeadingCorner)
      let topTrailingCorner = cornerStyle(from: props.corners?.topTrailingCorner)
      let bottomLeadingCorner = cornerStyle(from: props.corners?.bottomLeadingCorner)
      let bottomTrailingCorner = cornerStyle(from: props.corners?.bottomTrailingCorner)

      ConcentricRectangle(
        topLeadingCorner: topLeadingCorner,
        topTrailingCorner: topTrailingCorner,
        bottomLeadingCorner: bottomLeadingCorner,
        bottomTrailingCorner: bottomTrailingCorner
      )
    } else {
      EmptyView()
    }
#else
    EmptyView()
#endif
  }
}
